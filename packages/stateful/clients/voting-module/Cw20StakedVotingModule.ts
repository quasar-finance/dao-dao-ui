import { FetchQueryOptions, skipToken } from '@tanstack/react-query'

import { daoVotingCw20StakedQueries } from '@dao-dao/state/query'
import { ActiveThreshold, ModuleInstantiateInfo } from '@dao-dao/types'
import {
  Cw20Coin,
  InstantiateMarketingInfo,
} from '@dao-dao/types/contracts/Cw20Base'
import {
  Duration,
  InstantiateMsg,
  TotalPowerAtHeightResponse,
  VotingPowerAtHeightResponse,
} from '@dao-dao/types/contracts/DaoVotingCw20Staked'
import {
  DAO_VOTING_CW20_STAKED_CONTRACT_NAMES,
  encodeJsonToBase64,
  mustGetSupportedChainConfig,
} from '@dao-dao/utils'

import { CwDao } from '../dao/CwDao'
import { VotingModuleBase } from './base'

export class Cw20StakedVotingModule extends VotingModuleBase<CwDao> {
  static contractNames: readonly string[] =
    DAO_VOTING_CW20_STAKED_CONTRACT_NAMES

  /**
   * Generate the module instantiate info to plug into the DAO instantiate info
   * generator function.
   */
  static generateModuleInstantiateInfo(
    chainId: string,
    config: {
      activeThreshold?: ActiveThreshold | null
      token:
        | {
            /**
             * Use an existing cw20 token.
             */
            existing: {
              address: string
              stakingContract:
                | {
                    /**
                     * Use an existing cw20 staking contract.
                     */
                    existing: {
                      address: string
                    }
                  }
                | {
                    /**
                     * Create a new cw20 staking contract.
                     */
                    new: {
                      unstakingDuration?: Duration | null
                    }
                  }
            }
          }
        | {
            /**
             * Create a new cw20 token.
             */
            new: {
              symbol: string
              decimals: number
              name: string
              initialBalances: Cw20Coin[]
              initialDaoBalance?: string
              marketingInfo?: InstantiateMarketingInfo | null
              unstakingDuration?: Duration | null
            }
          }
    }
  ): ModuleInstantiateInfo {
    const { codeIds } = mustGetSupportedChainConfig(chainId)
    if (
      !codeIds.DaoVotingCw20Staked ||
      ((('existing' in config.token &&
        'new' in config.token.existing.stakingContract) ||
        'new' in config.token) &&
        !codeIds.Cw20Stake) ||
      ('new' in config.token && !codeIds.Cw20Base)
    ) {
      throw new Error('Codes not configured for chain ' + chainId)
    }

    return {
      admin: { core_module: {} },
      code_id: codeIds.DaoVotingCw20Staked,
      label: `dao-voting-cw20-staked_${Date.now()}`,
      msg: encodeJsonToBase64({
        active_threshold: config.activeThreshold,
        token_info:
          'existing' in config.token
            ? {
                existing: {
                  address: config.token.existing.address,
                  staking_contract:
                    'existing' in config.token.existing.stakingContract
                      ? {
                          existing: {
                            staking_contract_address:
                              config.token.existing.stakingContract.existing,
                          },
                        }
                      : {
                          new: {
                            // Type-checked above.
                            staking_code_id: codeIds.Cw20Stake!,
                            unstaking_duration:
                              config.token.existing.stakingContract.new
                                .unstakingDuration,
                          },
                        },
                },
              }
            : {
                new: {
                  // Type-checked above.
                  code_id: codeIds.Cw20Base!,
                  decimals: config.token.new.decimals,
                  initial_balances: config.token.new.initialBalances,
                  initial_dao_balance: config.token.new.initialDaoBalance,
                  label: config.token.new.name,
                  marketing: config.token.new.marketingInfo,
                  name: config.token.new.name,
                  // Type-checked above.
                  staking_code_id: codeIds.Cw20Stake!,
                  symbol: config.token.new.symbol,
                  unstaking_duration: config.token.new.unstakingDuration,
                },
              },
      } as InstantiateMsg),
      funds: [],
    }
  }

  getVotingPowerQuery(
    address?: string,
    height?: number
  ): FetchQueryOptions<VotingPowerAtHeightResponse> {
    // If no address, return query in loading state.
    if (!address) {
      return {
        queryKey: [],
        queryFn: skipToken,
      }
    }

    return daoVotingCw20StakedQueries.votingPowerAtHeight(this.queryClient, {
      chainId: this.dao.chainId,
      contractAddress: this.address,
      args: {
        address,
        height,
      },
    })
  }

  getTotalVotingPowerQuery(
    height?: number
  ): FetchQueryOptions<TotalPowerAtHeightResponse> {
    return daoVotingCw20StakedQueries.totalPowerAtHeight(this.queryClient, {
      chainId: this.dao.chainId,
      contractAddress: this.address,
      args: {
        height,
      },
    })
  }
}
