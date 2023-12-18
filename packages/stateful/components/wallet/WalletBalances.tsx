import { ComponentType } from 'react'
import { waitForAny } from 'recoil'

import { accountsSelector } from '@dao-dao/state/recoil'
import {
  WalletBalances as StatelessWalletBalances,
  useCachedLoading,
  useCachedLoadingWithError,
  useChain,
} from '@dao-dao/stateless'
import {
  ActionKey,
  LazyNftCardInfo,
  LoadingData,
  LoadingDataWithError,
  TokenCardInfo,
} from '@dao-dao/types'
import { getMeTxPrefillPath, loadableToLoadingData } from '@dao-dao/utils'

import { useActionForKey } from '../../actions'
import {
  allWalletNftsSelector,
  hiddenBalancesSelector,
  tokenCardLazyInfoSelector,
  walletTokenCardInfosSelector,
} from '../../recoil'
import { ButtonLink } from '../ButtonLink'
import { IconButtonLink } from '../IconButtonLink'
import { TreasuryHistoryGraph } from '../TreasuryHistoryGraph'
import { WalletTokenLine } from './WalletTokenLine'
import { WalletTokenLineReadonly } from './WalletTokenLineReadonly'

export type WalletBalancesProps = {
  address: string | undefined
  hexPublicKey: LoadingData<string | undefined>
  NftCard: ComponentType<LazyNftCardInfo>
  // If true, use token card that has edit actions.
  editable: boolean
}

export const WalletBalances = ({
  address,
  hexPublicKey,
  NftCard,
  editable,
}: WalletBalancesProps) => {
  const { chain_id: chainId } = useChain()

  const accounts = useCachedLoadingWithError(
    address
      ? accountsSelector({
          chainId,
          address,
        })
      : undefined
  )

  const tokensWithoutLazyInfo = useCachedLoadingWithError(
    address
      ? walletTokenCardInfosSelector({
          chainId,
          walletAddress: address,
        })
      : undefined
  )

  // Load separately so they cache separately.
  const tokenLazyInfos = useCachedLoadingWithError(
    !tokensWithoutLazyInfo.loading && !tokensWithoutLazyInfo.errored && address
      ? waitForAny(
          tokensWithoutLazyInfo.data.map(({ token, unstakedBalance }) =>
            tokenCardLazyInfoSelector({
              owner: address,
              token,
              unstakedBalance,
            })
          )
        )
      : undefined
  )

  const tokens: LoadingDataWithError<TokenCardInfo[]> =
    tokensWithoutLazyInfo.loading || tokensWithoutLazyInfo.errored
      ? tokensWithoutLazyInfo
      : {
          loading: false,
          errored: false,
          updating:
            tokensWithoutLazyInfo.updating ||
            (!tokenLazyInfos.loading &&
              !tokenLazyInfos.errored &&
              tokenLazyInfos.updating),
          data: tokensWithoutLazyInfo.data.map(
            (token, i): TokenCardInfo => ({
              ...token,
              lazyInfo:
                tokenLazyInfos.loading ||
                tokenLazyInfos.errored ||
                tokensWithoutLazyInfo.data.length !== tokenLazyInfos.data.length
                  ? { loading: true }
                  : loadableToLoadingData(tokenLazyInfos.data[i], {
                      usdUnitPrice: undefined,
                      stakingInfo: undefined,
                      totalBalance: token.unstakedBalance,
                    }),
            })
          ),
        }

  const nfts = useCachedLoadingWithError(
    address
      ? allWalletNftsSelector([
          {
            chainId,
            walletAddress: address,
          },
        ])
      : undefined
  )

  const hiddenTokens = useCachedLoading(
    !hexPublicKey.loading && hexPublicKey.data
      ? hiddenBalancesSelector(hexPublicKey.data)
      : undefined,
    []
  )

  const configureRebalancerActionDefaults = useActionForKey(
    ActionKey.ConfigureRebalancer
  )?.useDefaults()

  return (
    <StatelessWalletBalances
      ButtonLink={ButtonLink}
      IconButtonLink={IconButtonLink}
      NftCard={NftCard}
      TokenLine={editable ? WalletTokenLine : WalletTokenLineReadonly}
      TreasuryHistoryGraph={TreasuryHistoryGraph}
      accounts={accounts}
      configureRebalancerHref={
        editable && configureRebalancerActionDefaults
          ? getMeTxPrefillPath([
              {
                actionKey: ActionKey.ConfigureRebalancer,
                data: configureRebalancerActionDefaults,
              },
            ])
          : undefined
      }
      hiddenTokens={hiddenTokens}
      nfts={nfts}
      tokens={tokens}
    />
  )
}
