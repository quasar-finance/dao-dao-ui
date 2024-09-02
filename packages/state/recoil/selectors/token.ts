import {
  selectorFamily,
  waitForAll,
  waitForAllSettled,
  waitForAny,
} from 'recoil'

import {
  Account,
  AmountWithTimestamp,
  GenericToken,
  GenericTokenBalance,
  GenericTokenSource,
  GenericTokenWithUsdPrice,
  TokenCardLazyInfo,
  TokenPriceHistoryRange,
  TokenType,
  UnstakingTaskStatus,
  WithChainId,
} from '@dao-dao/types'
import {
  MAINNET,
  convertMicroDenomToDenomWithDecimals,
  getChainForChainId,
  getChainForChainName,
  getIbcTransferInfoFromChannel,
  getNativeTokenForChainId,
  isValidWalletAddress,
} from '@dao-dao/utils'

import { chainQueries, tokenQueries } from '../../query'
import { queryClientAtom, refreshTokenCardLazyInfoAtom } from '../atoms'
import { astroportUsdPriceSelector } from './astroport'
import {
  denomMetadataSelector,
  ibcRpcClientForChainSelector,
  nativeBalancesSelector,
  nativeDelegatedBalanceSelector,
  nativeDenomBalanceSelector,
  nativeUnstakingDurationSecondsSelector,
} from './chain'
import { isDaoSelector } from './contract'
import {
  Cw20BaseSelectors,
  Cw20StakeSelectors,
  DaoDaoCoreSelectors,
  DaoVotingNativeStakedSelectors,
} from './contracts'
import { queryGenericIndexerSelector, querySnapperSelector } from './indexer'
import { osmosisUsdPriceSelector } from './osmosis'
import { skipAssetSelector } from './skip'
import { walletCw20BalancesSelector } from './wallet'
import { whiteWhaleUsdPriceSelector } from './whale'

export const genericTokenSelector = selectorFamily<
  GenericToken,
  GenericTokenSource
>({
  key: 'genericToken',
  get:
    (params) =>
    async ({ get }) => {
      const client = get(queryClientAtom)
      return await client.fetchQuery(tokenQueries.info(client, params))
    },
})

export const coinGeckoUsdPriceSelector = selectorFamily<
  GenericTokenWithUsdPrice | undefined,
  Pick<GenericToken, 'chainId' | 'type' | 'denomOrAddress'>
>({
  key: 'coinGeckoUsdPrice',
  get:
    (params) =>
    async ({ get }) => {
      if (!MAINNET) {
        return undefined
      }

      const token = get(genericTokenSelector(params))

      // Resolve Skip asset to retrieve coingecko ID.
      const asset = get(skipAssetSelector(params))
      if (!asset?.coingecko_id) {
        return
      }
      const usdPrice: number | undefined = get(
        querySnapperSelector({
          query: 'coingecko-price',
          parameters: {
            id: asset.coingecko_id,
          },
        })
      )

      return usdPrice !== undefined
        ? {
            token,
            usdPrice,
            timestamp: new Date(),
          }
        : undefined
    },
})

const priceSelectors = [
  coinGeckoUsdPriceSelector,
  osmosisUsdPriceSelector,
  astroportUsdPriceSelector,
  whiteWhaleUsdPriceSelector,
]

export const usdPriceSelector = selectorFamily<
  GenericTokenWithUsdPrice | undefined,
  Pick<GenericToken, 'chainId' | 'type' | 'denomOrAddress'>
>({
  key: 'usdPrice',
  get:
    (params) =>
    ({ get }) => {
      if (!MAINNET) {
        return
      }

      const selectors = priceSelectors.map((selector) => selector(params))

      // Load in parallel.
      const priceLoadables = get(waitForAny(selectors))
      // Get first loaded price.
      const anyPrice = priceLoadables
        .find((loadable) => loadable.valueMaybe())
        ?.valueMaybe()

      // If any price is loaded right away, use it.
      if (anyPrice) {
        return anyPrice
      }

      // If no price is loaded yet, wait for all to finish before returning
      // undefined from this selector. This forces the above to load which will
      // return the first one that is available.
      get(waitForAllSettled(selectors))
    },
})

export const genericTokenWithUsdPriceSelector = selectorFamily<
  GenericTokenWithUsdPrice,
  Pick<GenericToken, 'chainId' | 'type' | 'denomOrAddress'>
>({
  key: 'genericTokenWithUsdPrice',
  get:
    (params) =>
    async ({ get }) => {
      const token = get(genericTokenSelector(params))

      // Don't calculate price if could not load token decimals correctly.
      const { usdPrice, timestamp } =
        (token.decimals > 0 && get(usdPriceSelector(params))) || {}

      return {
        token,
        usdPrice,
        timestamp,
      }
    },
})

// Return all native and cw20 tokens for a given address. If this is a DAO, pass
// the core address and native chain ID and use the `account` filter to ensure
// cw20s are loaded.
export const genericTokenBalancesSelector = selectorFamily<
  GenericTokenBalance[],
  WithChainId<{
    address: string
    nativeGovernanceTokenDenom?: string
    cw20GovernanceTokenAddress?: string
    filter?: {
      // Only get balances for this token type.
      tokenType?: TokenType
      // Choose which account to get balances for.
      account?: Pick<Account, 'chainId' | 'address'>
    }
  }>
>({
  key: 'genericTokenBalances',
  get:
    ({
      chainId: mainChainId,
      address: mainAddress,
      nativeGovernanceTokenDenom,
      cw20GovernanceTokenAddress,
      filter,
    }) =>
    async ({ get }) => {
      const chainId = filter?.account?.chainId || mainChainId
      const address = filter?.account?.address || mainAddress

      const nativeTokenBalances =
        !filter?.tokenType || filter.tokenType === TokenType.Native
          ? get(
              nativeBalancesSelector({
                address,
                chainId,
              })
            )
          : []

      const cw20TokenBalances = (
        !filter?.tokenType || filter.tokenType === TokenType.Cw20
          ? get(
              // Neutron's modified DAOs do not support cw20s, so this may
              // error. Ignore if so.
              waitForAllSettled(
                // If is a DAO contract.
                get(
                  isDaoSelector({
                    address: mainAddress,
                    chainId: mainChainId,
                  })
                )
                  ? // Get native cw20s.
                    chainId === mainChainId && address === mainAddress
                    ? [
                        DaoDaoCoreSelectors.nativeCw20TokensWithBalancesSelector(
                          {
                            chainId: mainChainId,
                            contractAddress: mainAddress,
                            governanceTokenAddress: cw20GovernanceTokenAddress,
                          }
                        ),
                      ]
                    : // Get polytone cw20s if they exist.
                    chainId !== mainChainId
                    ? [
                        DaoDaoCoreSelectors.polytoneCw20TokensWithBalancesSelector(
                          {
                            chainId: mainChainId,
                            contractAddress: mainAddress,
                            polytoneChainId: chainId,
                          }
                        ),
                      ]
                    : []
                  : isValidWalletAddress(
                      address,
                      getChainForChainId(chainId).bech32_prefix
                    )
                  ? [
                      walletCw20BalancesSelector({
                        walletAddress: address,
                        chainId,
                      }),
                    ]
                  : []
              )
            )
          : []
      )[0]

      return [
        ...nativeTokenBalances.map((native) => ({
          ...native,
          isGovernanceToken:
            nativeGovernanceTokenDenom === native.token.denomOrAddress,
        })),
        ...(cw20TokenBalances?.state === 'hasValue'
          ? cw20TokenBalances.contents
          : []),
      ]
    },
})

export const genericTokenBalanceSelector = selectorFamily<
  GenericTokenBalance,
  Parameters<typeof genericTokenSelector>[0] & {
    address: string
  }
>({
  key: 'genericTokenBalance',
  get:
    ({ address, ...params }) =>
    async ({ get }) => {
      const token = get(genericTokenSelector(params))

      let balance = '0'
      if (token.type === TokenType.Native) {
        balance = get(
          nativeDenomBalanceSelector({
            chainId: params.chainId,
            walletAddress: address,
            denom: params.denomOrAddress,
          })
        ).amount
      } else if (token.type === TokenType.Cw20) {
        balance = get(
          Cw20BaseSelectors.balanceSelector({
            contractAddress: params.denomOrAddress,
            chainId: params.chainId,
            params: [
              {
                address,
              },
            ],
          })
        ).balance
      }

      return {
        token,
        balance,
      }
    },
})

export const genericTokenDelegatedBalanceSelector = selectorFamily<
  GenericTokenBalance,
  WithChainId<{
    address: string
  }>
>({
  key: 'genericTokenDelegatedBalance',
  get:
    ({ address, chainId }) =>
    async ({ get }) => {
      const { denom, amount: balance } = get(
        nativeDelegatedBalanceSelector({
          chainId,
          address,
        })
      )
      const token = get(
        genericTokenSelector({
          type: TokenType.Native,
          denomOrAddress: denom,
          chainId,
        })
      )

      return {
        token,
        balance,
        staked: true,
      }
    },
})

export const genericTokenUndelegatingBalancesSelector = selectorFamily<
  GenericTokenBalance[],
  WithChainId<{
    address: string
  }>
>({
  key: 'genericTokenUndelegatingBalances',
  get:
    (params) =>
    async ({ get }) => {
      const queryClient = get(queryClientAtom)
      const { unbondingDelegations } = await queryClient.fetchQuery(
        chainQueries.nativeDelegationInfo(queryClient, params)
      )

      const tokens = get(
        waitForAll(
          unbondingDelegations.map(({ balance }) =>
            genericTokenSelector({
              type: TokenType.Native,
              denomOrAddress: balance.denom,
              chainId: params.chainId,
            })
          )
        )
      )

      const tokenBalances = tokens.map(
        (token, index): GenericTokenBalance => ({
          token,
          balance: unbondingDelegations[index].balance.amount,
        })
      )

      const uniqueTokens = tokenBalances.reduce((acc, { token, balance }) => {
        let existing = acc.find(
          (t) => t.token.denomOrAddress === token.denomOrAddress
        )
        if (!existing) {
          existing = {
            token,
            balance,
            unstaking: true,
          }
          acc.push(existing)
        }
        existing.balance = (
          BigInt(existing.balance) + BigInt(balance)
        ).toString()

        return acc
      }, [] as GenericTokenBalance[])

      return uniqueTokens
    },
})

export const nativeDenomMetadataInfoSelector = selectorFamily<
  | {
      symbol: string
      decimals: number
    }
  | undefined,
  WithChainId<{ denom: string }>
>({
  key: 'nativeDenomMetadataInfo',
  get:
    (params) =>
    async ({ get }) => {
      const metadata = get(denomMetadataSelector(params))
      if (!metadata) {
        return
      }

      const { base, denomUnits, symbol, display } = metadata

      // If display is equal to the base, use the symbol denom unit if
      // available. This fixes the case where display was not updated even
      // though a nonzero exponent was created.
      const searchDenom = display === base ? symbol : display

      const displayDenom =
        denomUnits.find(({ denom }) => denom === searchDenom) ??
        denomUnits.find(({ denom }) => denom === display) ??
        denomUnits.find(({ exponent }) => exponent > 0) ??
        denomUnits[0]

      if (!displayDenom) {
        throw new Error('No denom unit found for token factory denom')
      }

      return {
        // If factory denom, extract symbol at the end.
        symbol: displayDenom.denom.startsWith('factory/')
          ? displayDenom.denom.split('/').pop()!
          : displayDenom.denom,
        decimals: displayDenom.exponent,
      }
    },
})

// Resolve a denom on a chain to its source chain and base denom. If an IBC
// asset, tries to reverse engineer IBC denom. Otherwise returns the arguments.
export const genericTokenSourceSelector = selectorFamily<
  GenericTokenSource,
  Pick<GenericToken, 'chainId' | 'type' | 'denomOrAddress'>
>({
  key: 'genericTokenSource',
  get:
    ({ chainId, type, denomOrAddress }) =>
    async ({ get }) => {
      // Check if Skip API has the info.
      const skipAsset = get(
        skipAssetSelector({
          chainId,
          type,
          denomOrAddress,
        })
      )

      if (skipAsset) {
        const sourceType = skipAsset.origin_denom.startsWith('cw20:')
          ? TokenType.Cw20
          : TokenType.Native
        return {
          chainId: skipAsset.origin_chain_id,
          type: sourceType,
          denomOrAddress:
            sourceType === TokenType.Cw20
              ? skipAsset.origin_denom.replace(/^cw20:/, '')
              : skipAsset.origin_denom,
        }
      }

      let sourceChainId = chainId
      let sourceDenom =
        (type === TokenType.Cw20 ? 'cw20:' : '') + denomOrAddress

      // Try to reverse engineer IBC denom.
      if (denomOrAddress.startsWith('ibc/')) {
        const ibc = get(ibcRpcClientForChainSelector(chainId))

        try {
          const { denomTrace } = await ibc.applications.transfer.v1.denomTrace({
            hash: denomOrAddress,
          })

          // If trace exists, resolve IBC denom.
          if (denomTrace) {
            let channels = denomTrace.path.split('transfer/').slice(1)
            // Trim trailing slash from all but last channel.
            channels = channels.map((channel, index) =>
              index === channels.length - 1 ? channel : channel.slice(0, -1)
            )
            if (channels.length) {
              // Retrace channel paths to find source chain of denom.
              sourceChainId = channels.reduce(
                (currentChainId, channel) =>
                  getChainForChainName(
                    getIbcTransferInfoFromChannel(currentChainId, channel)
                      .destinationChain.chain_name
                  ).chain_id,
                chainId
              )

              sourceDenom = denomTrace.baseDenom
            }
          }
        } catch (err) {
          console.error(err)
          // Ignore resolution error.
        }
      }

      const sourceType = sourceDenom.startsWith('cw20:')
        ? TokenType.Cw20
        : TokenType.Native

      return {
        chainId: sourceChainId,
        type: sourceType,
        denomOrAddress:
          sourceType === TokenType.Cw20
            ? sourceDenom.replace(/^cw20:/, '')
            : sourceDenom,
      }
    },
})

export const historicalUsdPriceSelector = selectorFamily<
  AmountWithTimestamp[] | undefined,
  Pick<GenericToken, 'chainId' | 'type' | 'denomOrAddress'> & {
    range: TokenPriceHistoryRange
  }
>({
  key: 'historicalUsdPrice',
  get:
    ({ chainId, type, denomOrAddress, range }) =>
    async ({ get }) => {
      if (!MAINNET) {
        return undefined
      }

      // Resolve Skip asset to retrieve coingecko ID.
      const asset = get(
        skipAssetSelector({
          type,
          chainId,
          denomOrAddress,
        })
      )

      if (!asset?.coingecko_id) {
        return
      }

      try {
        const prices: [number, number][] = get(
          querySnapperSelector({
            query: 'coingecko-price-history',
            parameters: {
              id: asset.coingecko_id,
              range,
            },
          })
        )

        return prices.map(([timestamp, amount]) => ({
          timestamp,
          amount,
        }))
      } catch (err) {
        // recoil's `get` throws a promise while loading
        if (err instanceof Promise) {
          throw err
        }

        return undefined
      }
    },
})

export const tokenCardLazyInfoSelector = selectorFamily<
  TokenCardLazyInfo,
  {
    owner: string
    token: GenericToken
    // For calculating totalBalance.
    unstakedBalance: number
  }
>({
  key: 'tokenCardLazyInfo',
  get:
    ({ owner, token, unstakedBalance }) =>
    async ({ get }) => {
      get(
        refreshTokenCardLazyInfoAtom({
          token: token.source,
          owner,
        })
      )

      const { chainId, type } = token

      let stakingInfo: TokenCardLazyInfo['stakingInfo'] = undefined
      let daosGoverned: TokenCardLazyInfo['daosGoverned'] = undefined

      const usdUnitPrice = get(
        usdPriceSelector({
          type,
          chainId,
          denomOrAddress: token.denomOrAddress,
        })
      )

      // Staking info only exists for native token.
      if (
        token.denomOrAddress ===
        getNativeTokenForChainId(chainId).denomOrAddress
      ) {
        const queryClient = get(queryClientAtom)
        const { delegations, unbondingDelegations } =
          await queryClient.fetchQuery(
            chainQueries.nativeDelegationInfo(queryClient, {
              chainId,
              address: owner,
            })
          )

        const unstakingDurationSeconds = get(
          nativeUnstakingDurationSecondsSelector({
            chainId,
          })
        )

        const unstakingTasks = unbondingDelegations.map(
          ({ balance, finishesAt }) => ({
            token,
            status: UnstakingTaskStatus.Unstaking,
            amount: convertMicroDenomToDenomWithDecimals(
              balance.amount,
              token.decimals
            ),
            date: finishesAt,
          })
        )

        const stakes = delegations.map(
          ({ validator, delegated, pendingReward }) => ({
            token,
            validator,
            amount: convertMicroDenomToDenomWithDecimals(
              delegated.amount,
              token.decimals
            ),
            rewards: convertMicroDenomToDenomWithDecimals(
              pendingReward.amount,
              token.decimals
            ),
          })
        )

        const totalStaked =
          stakes.reduce((acc, stake) => acc + stake.amount, 0) ?? 0
        const totalPendingRewards =
          stakes?.reduce((acc, stake) => acc + stake.rewards, 0) ?? 0
        const totalUnstaking =
          unstakingTasks.reduce(
            (acc, task) =>
              acc +
              // Only include balance of unstaking tasks.
              (task.status === UnstakingTaskStatus.Unstaking ? task.amount : 0),
            0
          ) ?? 0

        stakingInfo = {
          unstakingTasks,
          unstakingDurationSeconds,
          stakes,
          totalStaked,
          totalPendingRewards,
          totalUnstaking,
        }
      }

      if (owner) {
        daosGoverned = get(
          tokenDaosWithStakedBalanceSelector({
            chainId,
            type: token.type,
            denomOrAddress: token.denomOrAddress,
            walletAddress: owner,
          })
        )
          // Only include DAOs this owner has staked with.
          .filter(({ stakedBalance }) => stakedBalance > 0)
          .map(({ stakedBalance, ...rest }) => ({
            ...rest,
            // Convert to expected denom.
            stakedBalance: convertMicroDenomToDenomWithDecimals(
              stakedBalance,
              token.decimals
            ),
          }))
      }

      const totalBalance =
        unstakedBalance +
        // Add staked and unstaking balances.
        (stakingInfo
          ? stakingInfo.totalStaked + stakingInfo.totalUnstaking
          : 0) +
        // Add balances staked in DAOs, grouped by their
        // `stakingContractAddress` so we don't double-count tokens staked with
        // the same staking contract if that staking contract is used in
        // different DAOs in the list.
        Object.values(
          daosGoverned?.reduce(
            (acc, { stakingContractAddress, stakedBalance = 0 }) => ({
              ...acc,
              // If the staking contract address is already in the accumulator,
              // overwrite so we don't double-count. All staked balances for the
              // same staking contract should be the same, so overwriting should
              // do nothing.
              [stakingContractAddress]: stakedBalance,
            }),
            {} as Record<string, number>
          ) || {}
        ).reduce((acc, stakedBalance) => acc + stakedBalance, 0)

      return {
        usdUnitPrice,
        stakingInfo,
        totalBalance,
        daosGoverned,
      }
    },
})

// Get DAOs that use this native token as their governance token from the
// indexer, and load their dao-voting-native-staked contracts.
export const daosWithNativeVotingContractSelector = selectorFamily<
  {
    coreAddress: string
    votingModuleAddress: string
  }[],
  WithChainId<{
    denom: string
  }>
>({
  key: 'daosWithNativeVotingContract',
  get:
    ({ denom, chainId }) =>
    ({ get }) => {
      const daos: string[] =
        get(
          queryGenericIndexerSelector({
            chainId,
            formula: 'token/daos',
            args: {
              denom,
            },
            noFallback: true,
          })
        ) ?? []
      const votingModuleAddresses = get(
        waitForAll(
          daos.map((contractAddress) =>
            DaoDaoCoreSelectors.votingModuleSelector({
              contractAddress,
              chainId,
              params: [],
            })
          )
        )
      )

      return daos.map((coreAddress, index) => ({
        coreAddress,
        votingModuleAddress: votingModuleAddresses[index],
      }))
    },
})

// Returns a list of DAOs that use the given cw20 token as their governance
// token with the staked balance of the given wallet address for each.
export const tokenDaosWithStakedBalanceSelector = selectorFamily<
  {
    coreAddress: string
    stakingContractAddress: string
    stakedBalance: number
  }[],
  WithChainId<{
    type: TokenType
    denomOrAddress: string
    walletAddress: string
  }>
>({
  key: 'tokenDaosWithStakedBalance',
  get:
    ({ type, denomOrAddress, walletAddress, chainId }) =>
    ({ get }) => {
      const daos =
        type === TokenType.Cw20
          ? get(
              Cw20BaseSelectors.daosWithVotingAndStakingContractSelector({
                contractAddress: denomOrAddress,
                chainId,
              })
            )
          : get(
              daosWithNativeVotingContractSelector({
                denom: denomOrAddress,
                chainId,
              })
            ).map((daoWithContracts) => ({
              ...daoWithContracts,
              stakingContractAddress: daoWithContracts.votingModuleAddress,
            }))

      const daosWalletStakedTokens = get(
        waitForAll(
          daos.map(({ stakingContractAddress }) =>
            type === TokenType.Cw20
              ? Cw20StakeSelectors.stakedValueSelector({
                  contractAddress: stakingContractAddress,
                  chainId,
                  params: [
                    {
                      address: walletAddress,
                    },
                  ],
                })
              : DaoVotingNativeStakedSelectors.votingPowerAtHeightSelector({
                  contractAddress: stakingContractAddress,
                  chainId,
                  params: [
                    {
                      address: walletAddress,
                    },
                  ],
                })
          )
        )
      ).map((staked) => ('value' in staked ? staked.value : staked.power))

      const daosWithBalances = daos
        .map(({ coreAddress, stakingContractAddress }, index) => ({
          coreAddress,
          stakingContractAddress,
          stakedBalance: Number(daosWalletStakedTokens[index]),
        }))
        // Sort descending by staked tokens.
        .sort((a, b) => b.stakedBalance - a.stakedBalance)

      return daosWithBalances
    },
})
