import { constSelector, useRecoilValue, waitForAll } from 'recoil'

import {
  Cw20BaseSelectors,
  DaoVotingCw20StakedSelectors,
  usdPriceSelector,
} from '@dao-dao/state'
import { useCachedLoading } from '@dao-dao/stateless'
import { TokenType } from '@dao-dao/types'

import { useWallet } from '../../../../hooks/useWallet'
import { useVotingModuleAdapterOptions } from '../../../react/context'
import {
  UseGovernanceTokenInfoOptions,
  UseGovernanceTokenInfoResponse,
} from '../types'

export const useGovernanceTokenInfo = ({
  fetchWalletBalance = false,
  fetchTreasuryBalance = false,
  fetchUsdcPrice = false,
}: UseGovernanceTokenInfoOptions = {}): UseGovernanceTokenInfoResponse => {
  const { address: walletAddress } = useWallet()
  const { chainId, coreAddress, votingModuleAddress } =
    useVotingModuleAdapterOptions()

  const [stakingContractAddress, governanceTokenAddress] = useRecoilValue(
    waitForAll([
      DaoVotingCw20StakedSelectors.stakingContractSelector({
        chainId,
        contractAddress: votingModuleAddress,
        params: [],
      }),
      DaoVotingCw20StakedSelectors.tokenContractSelector({
        chainId,
        contractAddress: votingModuleAddress,
        params: [],
      }),
    ])
  )

  const [governanceTokenInfo, governanceTokenLogoUrl] = useRecoilValue(
    waitForAll([
      Cw20BaseSelectors.tokenInfoSelector({
        chainId,
        contractAddress: governanceTokenAddress,
        params: [],
      }),
      Cw20BaseSelectors.logoUrlSelector({
        chainId,
        contractAddress: governanceTokenAddress,
      }),
    ])
  )

  /// Optional

  // Wallet balance
  const loadingWalletBalance = useCachedLoading(
    fetchWalletBalance && walletAddress
      ? Cw20BaseSelectors.balanceSelector({
          chainId,
          contractAddress: governanceTokenAddress,
          params: [{ address: walletAddress }],
        })
      : constSelector(undefined),
    undefined
  )

  // Treasury balance
  const loadingTreasuryBalance = useCachedLoading(
    fetchTreasuryBalance
      ? Cw20BaseSelectors.balanceSelector({
          chainId,
          contractAddress: governanceTokenAddress,
          params: [{ address: coreAddress }],
        })
      : constSelector(undefined),
    undefined
  )

  // Price info
  const loadingPrice = useCachedLoading(
    fetchUsdcPrice
      ? usdPriceSelector({
          type: TokenType.Cw20,
          chainId,
          denomOrAddress: governanceTokenAddress,
        })
      : constSelector(undefined),
    undefined
  )

  return {
    stakingContractAddress,
    governanceTokenAddress,
    governanceTokenInfo,
    token: {
      chainId,
      type: TokenType.Cw20,
      denomOrAddress: governanceTokenAddress,
      symbol: governanceTokenInfo.symbol,
      decimals: governanceTokenInfo.decimals,
      imageUrl: governanceTokenLogoUrl,
      source: {
        chainId,
        type: TokenType.Cw20,
        denomOrAddress: governanceTokenAddress,
      },
    },
    /// Optional
    // Wallet balance
    loadingWalletBalance: loadingWalletBalance.loading
      ? { loading: true }
      : !loadingWalletBalance.data
      ? undefined
      : {
          loading: false,
          data: Number(loadingWalletBalance.data.balance),
        },
    // Treasury balance
    loadingTreasuryBalance: loadingTreasuryBalance.loading
      ? { loading: true }
      : !loadingTreasuryBalance.data
      ? undefined
      : {
          loading: false,
          data: Number(loadingTreasuryBalance.data.balance),
        },
    // Price
    loadingPrice: loadingPrice.loading
      ? { loading: true }
      : !loadingPrice.data
      ? undefined
      : {
          loading: false,
          data: loadingPrice.data,
        },
  }
}
