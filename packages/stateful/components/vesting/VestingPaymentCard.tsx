import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import {
  chainQueries,
  cwVestingExtraQueries,
  cwVestingQueryKeys,
} from '@dao-dao/state/query'
import { tokenCardLazyInfoSelector } from '@dao-dao/state/recoil'
import {
  VestingPaymentCard as StatelessVestingPaymentCard,
  useAddToken,
  useCachedLoadable,
  useChain,
  useDaoNavHelpers,
} from '@dao-dao/stateless'
import {
  ActionKey,
  ChainId,
  EntityType,
  StatefulVestingPaymentCardProps,
} from '@dao-dao/types'
import {
  convertMicroDenomToDenomWithDecimals,
  getDaoProposalSinglePrefill,
  getNativeTokenForChainId,
  loadableToLoadingData,
  processError,
} from '@dao-dao/utils'

import {
  useAwaitNextBlock,
  useEntity,
  useQueryLoadingDataWithError,
  useWallet,
} from '../../hooks'
import {
  useDistribute,
  useWithdrawDelegatorRewards,
} from '../../hooks/contracts/CwVesting'
import { ButtonLink } from '../ButtonLink'
import { EntityDisplay } from '../EntityDisplay'
import { VestingStakingModal } from './VestingStakingModal'

export const VestingPaymentCard = ({
  vestingInfo: fallbackInfo,
}: StatefulVestingPaymentCardProps) => {
  const { t } = useTranslation()
  const { chain_id: chainId } = useChain()
  const { goToDaoProposal } = useDaoNavHelpers()

  const {
    address: walletAddress = '',
    isWalletConnected,
    refreshBalances,
  } = useWallet({
    attemptConnection: true,
  })

  const queryClient = useQueryClient()
  // Use info passed into props as fallback, since it came from the list query;
  // the individual query updates more frequently.
  const freshInfo = useQueryLoadingDataWithError(
    cwVestingExtraQueries.info(queryClient, {
      chainId,
      address: fallbackInfo.vestingContractAddress,
    })
  )

  const vestingInfo =
    freshInfo.loading || freshInfo.errored ? fallbackInfo : freshInfo.data

  const {
    vestingContractAddress,
    vest,
    total,
    vested,
    token,
    distributable,
    startDate,
    endDate,
    steps,
  } = vestingInfo

  const { entity: recipientEntity } = useEntity(vest.recipient)
  const recipientIsDao =
    !recipientEntity.loading && recipientEntity.data.type === EntityType.Dao

  const lazyInfoLoading = loadableToLoadingData(
    useCachedLoadable(
      tokenCardLazyInfoSelector({
        owner: vestingContractAddress,
        token,
        // Unused. We just want the USD price and staking info.
        unstakedBalance: 0,
      })
    ),
    {
      usdUnitPrice: undefined,
      stakingInfo: undefined,
      // Unused. We just want the USD price and staking info.
      totalBalance: 0,
    }
  )

  const refresh = () => {
    // Invalidate validators.
    queryClient.invalidateQueries({
      queryKey: ['chain', 'validator', { chainId }],
    })
    // Invalidate staking info.
    queryClient.invalidateQueries({
      queryKey: chainQueries.nativeDelegationInfo(queryClient, {
        chainId,
        address: vestingContractAddress,
      }).queryKey,
    })
    // Invalidate vesting indexer queries.
    queryClient.invalidateQueries({
      queryKey: [
        'indexer',
        'query',
        {
          chainId,
          address: vestingContractAddress,
        },
      ],
    })
    // Then invalidate contract queries that depend on indexer queries.
    queryClient.invalidateQueries({
      queryKey: cwVestingQueryKeys.address(chainId, vestingContractAddress),
    })
    // Then info query.
    queryClient.invalidateQueries({
      queryKey: cwVestingExtraQueries.info(queryClient, {
        chainId,
        address: vestingContractAddress,
      }).queryKey,
    })
  }

  const awaitNextBlock = useAwaitNextBlock()

  const distribute = useDistribute({
    contractAddress: vestingContractAddress,
    sender: walletAddress,
  })
  const claim = useWithdrawDelegatorRewards({
    contractAddress: vestingContractAddress,
    sender: walletAddress,
  })

  const [withdrawing, setWithdrawing] = useState(false)
  const onWithdraw = async () => {
    setWithdrawing(true)
    try {
      if (recipientIsDao) {
        await goToDaoProposal(recipientEntity.data.address, 'create', {
          prefill: getDaoProposalSinglePrefill({
            actions: [
              {
                actionKey: ActionKey.Execute,
                data: {
                  chainId,
                  address: vestingContractAddress,
                  message: JSON.stringify(
                    {
                      distribute: {},
                    },
                    null,
                    2
                  ),
                  funds: [],
                  cw20: false,
                },
              },
            ],
          }),
        })
      } else {
        await distribute({})

        // Give time for indexer to update and then refresh.
        await awaitNextBlock()

        refresh()
        refreshBalances()
        toast.success(t('success.withdrewPayment'))
      }
    } catch (err) {
      console.error(err)
      toast.error(processError(err))
    } finally {
      setWithdrawing(false)
    }
  }

  const [claiming, setClaiming] = useState(false)
  const validators = lazyInfoLoading.loading
    ? undefined
    : lazyInfoLoading.data.stakingInfo?.stakes.map((s) => s.validator.address)

  // If no validators or not yet loaded, don't show claim.
  const onClaim =
    validators &&
    (async () => {
      setClaiming(true)
      try {
        if (recipientIsDao) {
          await goToDaoProposal(recipientEntity.data.address, 'create', {
            prefill: getDaoProposalSinglePrefill({
              actions: validators?.map((validator) => ({
                actionKey: ActionKey.Execute,
                data: {
                  chainId,
                  address: vestingContractAddress,
                  message: JSON.stringify(
                    {
                      withdraw_delegator_reward: {
                        validator,
                      },
                    },
                    null,
                    2
                  ),
                  funds: [],
                  cw20: false,
                },
              })),
            }),
          })
        } else {
          await claim({
            validators,
          })

          // Give time for indexer to update and then refresh.
          await awaitNextBlock()

          refresh()
          toast.success(t('success.claimedRewards'))
        }
      } catch (err) {
        console.error(err)
        toast.error(processError(err))
      } finally {
        setClaiming(false)
      }
    })

  const addToken = useAddToken()
  const cw20Address = 'cw20' in vest.denom ? vest.denom.cw20 : undefined
  const onAddToken =
    addToken && cw20Address ? () => addToken(cw20Address) : undefined

  const recipientIsWallet = vest.recipient === walletAddress
  const canManageStaking =
    // Neutron does not support staking.
    chainId !== ChainId.NeutronMainnet &&
    chainId !== ChainId.NeutronTestnet &&
    (recipientIsWallet || recipientIsDao) &&
    // Vested token is native token of chain.
    token.denomOrAddress === getNativeTokenForChainId(chainId).denomOrAddress

  const [showStakingModal, setShowStakingModal] = useState(false)

  return (
    <>
      <StatelessVestingPaymentCard
        ButtonLink={ButtonLink}
        EntityDisplay={EntityDisplay}
        canClaimStakingRewards={
          !lazyInfoLoading.loading &&
          !!lazyInfoLoading.data.stakingInfo?.totalPendingRewards
        }
        canceled={
          // Canceled vests have their curves set to constant.
          'constant' in vest.vested
        }
        claimedAmount={convertMicroDenomToDenomWithDecimals(
          vest.claimed,
          token.decimals
        )}
        claiming={claiming}
        cw20Address={cw20Address}
        description={vest.description}
        distributableAmount={convertMicroDenomToDenomWithDecimals(
          distributable,
          token.decimals
        )}
        endDate={endDate}
        isWalletConnected={isWalletConnected}
        lazyInfo={lazyInfoLoading}
        onAddToken={onAddToken}
        onClaim={onClaim}
        onManageStake={
          canManageStaking ? () => setShowStakingModal(true) : undefined
        }
        onWithdraw={onWithdraw}
        recipient={vest.recipient}
        recipientEntity={recipientEntity}
        recipientIsWallet={recipientIsWallet}
        remainingBalanceVesting={convertMicroDenomToDenomWithDecimals(
          Number(total) - Number(vested),
          token.decimals
        )}
        startDate={startDate}
        steps={steps}
        title={vest.title}
        token={token}
        withdrawing={withdrawing}
      />

      {canManageStaking && (
        <VestingStakingModal
          onClose={() => setShowStakingModal(false)}
          recipientIsDao={recipientIsDao}
          stakes={
            lazyInfoLoading.loading
              ? undefined
              : lazyInfoLoading.data.stakingInfo?.stakes
          }
          vestingInfo={vestingInfo}
          visible={showStakingModal}
        />
      )}
    </>
  )
}
