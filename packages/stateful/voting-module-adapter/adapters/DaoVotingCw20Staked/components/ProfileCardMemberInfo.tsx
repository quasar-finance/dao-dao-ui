import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { constSelector, useRecoilValue } from 'recoil'

import {
  Cw20StakeSelectors,
  blockHeightSelector,
  blocksPerYearSelector,
  stakingLoadingAtom,
} from '@dao-dao/state'
import {
  useCachedLoadable,
  useChain,
  useDaoInfoContext,
} from '@dao-dao/stateless'
import {
  BaseProfileCardMemberInfoProps,
  UnstakingTask,
  UnstakingTaskStatus,
} from '@dao-dao/types'
import {
  convertExpirationToDate,
  convertMicroDenomToDenomWithDecimals,
  durationToSeconds,
  processError,
} from '@dao-dao/utils'

import {
  Cw20StakeHooks,
  OraichainCw20StakingHooks,
  useAwaitNextBlock,
  useWallet,
} from '../../../../hooks'
import { ProfileCardMemberInfoTokens } from '../../../components'
import { useGovernanceTokenInfo, useStakingInfo } from '../hooks'
import { StakingModal } from './StakingModal'

export const ProfileCardMemberInfo = ({
  maxGovernanceTokenDeposit,
  ...props
}: BaseProfileCardMemberInfoProps) => {
  const { t } = useTranslation()
  const { chain_id: chainId } = useChain()
  const { name: daoName } = useDaoInfoContext()
  const {
    address: walletAddress,
    isWalletConnected,
    refreshBalances,
  } = useWallet()

  const [showStakingModal, setShowStakingModal] = useState(false)
  const [claimingLoading, setClaimingLoading] = useState(false)
  const stakingLoading = useRecoilValue(stakingLoadingAtom)

  const { governanceToken, loadingWalletBalance: loadingUnstakedBalance } =
    useGovernanceTokenInfo({
      fetchWalletBalance: true,
    })

  const {
    stakingContractAddress,
    unstakingDuration,
    refreshTotals,
    claimsPending,
    claimsAvailable,
    sumClaimsAvailable,
    loadingWalletStakedValue,
    loadingTotalStakedValue,
    refreshClaims,
  } = useStakingInfo({
    fetchClaims: true,
    fetchWalletStakedValue: true,
    fetchTotalStakedValue: true,
  })

  const isOraichainCustomStaking = useRecoilValue(
    Cw20StakeSelectors.isOraichainProxySnapshotContractSelector({
      chainId,
      contractAddress: stakingContractAddress,
    })
  )

  const oraichainCw20StakingConfig = useRecoilValue(
    isOraichainCustomStaking
      ? Cw20StakeSelectors.oraichainProxySnapshotConfigSelector({
          chainId,
          contractAddress: stakingContractAddress,
        })
      : constSelector(undefined)
  )

  // Support Oraichain custom cw20-staking contract.
  const stakingContractToExecute = isOraichainCustomStaking
    ? // If Oraichain proxy snapshot, fallback to empty string so it errors if
      // trying to stake anything. This should never happen.
      oraichainCw20StakingConfig?.staking_contract || ''
    : stakingContractAddress

  const doClaim = Cw20StakeHooks.useClaim({
    contractAddress: stakingContractToExecute,
    sender: walletAddress ?? '',
  })
  const doOraichainUnbond = OraichainCw20StakingHooks.useUnbond({
    contractAddress: stakingContractToExecute,
    sender: walletAddress ?? '',
  })

  const awaitNextBlock = useAwaitNextBlock()
  const onClaim = useCallback(async () => {
    if (!isWalletConnected) {
      return toast.error(t('error.logInToContinue'))
    }
    if (!sumClaimsAvailable) {
      return toast.error(t('error.noClaimsAvailable'))
    }

    setClaimingLoading(true)
    try {
      if (isOraichainCustomStaking) {
        // Oraichain claiming is an unbond with zero amount.
        await doOraichainUnbond({
          amount: '0',
          stakingToken: governanceToken.denomOrAddress,
        })
      } else {
        await doClaim()
      }

      // New balances will not appear until the next block.
      await awaitNextBlock()

      refreshBalances()
      refreshTotals()
      refreshClaims?.()

      toast.success(
        `Claimed ${convertMicroDenomToDenomWithDecimals(
          sumClaimsAvailable,
          governanceToken.decimals
        ).toLocaleString(undefined, {
          maximumFractionDigits: governanceToken.decimals,
        })} $${governanceToken.symbol}`
      )
    } catch (err) {
      console.error(err)
      toast.error(processError(err))
    } finally {
      setClaimingLoading(false)
    }
  }, [
    isWalletConnected,
    sumClaimsAvailable,
    t,
    isOraichainCustomStaking,
    awaitNextBlock,
    refreshBalances,
    refreshTotals,
    refreshClaims,
    governanceToken.decimals,
    governanceToken.symbol,
    governanceToken.denomOrAddress,
    doOraichainUnbond,
    doClaim,
  ])

  const blockHeightLoadable = useCachedLoadable(
    blockHeightSelector({
      chainId,
    })
  )
  const blocksPerYearLoadable = useCachedLoadable(
    blocksPerYearSelector({
      chainId,
    })
  )

  const unstakingTasks: UnstakingTask[] = [
    ...(claimsPending ?? []).map(({ amount, release_at }) => ({
      token: governanceToken,
      status: UnstakingTaskStatus.Unstaking,
      amount: convertMicroDenomToDenomWithDecimals(
        amount,
        governanceToken.decimals
      ),
      date:
        blocksPerYearLoadable.state === 'hasValue'
          ? convertExpirationToDate(
              blocksPerYearLoadable.contents,
              release_at,
              blockHeightLoadable.state === 'hasValue'
                ? blockHeightLoadable.contents
                : 0
            )
          : undefined,
    })),
    ...(claimsAvailable ?? []).map(({ amount, release_at }) => ({
      token: governanceToken,
      status: UnstakingTaskStatus.ReadyToClaim,
      amount: convertMicroDenomToDenomWithDecimals(
        amount,
        governanceToken.decimals
      ),
      date:
        blocksPerYearLoadable.state === 'hasValue'
          ? convertExpirationToDate(
              blocksPerYearLoadable.contents,
              release_at,
              blockHeightLoadable.state === 'hasValue'
                ? blockHeightLoadable.contents
                : 0
            )
          : undefined,
    })),
  ]

  return (
    <>
      <ProfileCardMemberInfoTokens
        claimingLoading={claimingLoading}
        daoName={daoName}
        loadingTokens={
          !loadingWalletStakedValue ||
          loadingWalletStakedValue.loading ||
          !loadingUnstakedBalance ||
          loadingUnstakedBalance.loading
            ? {
                loading: true,
              }
            : {
                loading: false,
                data: [
                  {
                    token: governanceToken,
                    staked: convertMicroDenomToDenomWithDecimals(
                      loadingWalletStakedValue.data,
                      governanceToken.decimals
                    ),
                    unstaked: convertMicroDenomToDenomWithDecimals(
                      loadingUnstakedBalance.data,
                      governanceToken.decimals
                    ),
                  },
                ],
              }
        }
        loadingVotingPower={
          !loadingWalletStakedValue ||
          loadingWalletStakedValue.loading ||
          !loadingTotalStakedValue ||
          loadingTotalStakedValue.loading
            ? { loading: true }
            : {
                loading: false,
                data:
                  (loadingWalletStakedValue.data /
                    loadingTotalStakedValue.data) *
                  100,
              }
        }
        onClaim={onClaim}
        onStake={() => setShowStakingModal(true)}
        refreshUnstakingTasks={() => refreshClaims?.()}
        stakingLoading={stakingLoading}
        unstakingDurationSeconds={
          (blocksPerYearLoadable.state === 'hasValue' &&
            unstakingDuration &&
            durationToSeconds(
              blocksPerYearLoadable.contents,
              unstakingDuration
            )) ||
          undefined
        }
        unstakingTasks={unstakingTasks}
        {...props}
      />

      <StakingModal
        maxDeposit={maxGovernanceTokenDeposit}
        onClose={() => setShowStakingModal(false)}
        visible={showStakingModal}
      />
    </>
  )
}
