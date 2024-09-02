import { FetchQueryOptions, skipToken } from '@tanstack/react-query'

import { daoVotingSgCommunityNftQueries } from '@dao-dao/state/query'
import { ModuleInstantiateInfo } from '@dao-dao/types'
import {
  TotalPowerAtHeightResponse,
  VotingPowerAtHeightResponse,
} from '@dao-dao/types/contracts/DaoVotingSgCommunityNft'
import { DAO_VOTING_SG_COMMUNITY_NFT_CONTRACT_NAMES } from '@dao-dao/utils'

import { CwDao } from '../dao/CwDao'
import { VotingModuleBase } from './base'

export class SgCommunityNftVotingModule extends VotingModuleBase<CwDao> {
  static contractNames: readonly string[] =
    DAO_VOTING_SG_COMMUNITY_NFT_CONTRACT_NAMES

  /**
   * Generate the module instantiate info to plug into the DAO instantiate info
   * generator function.
   */
  static generateModuleInstantiateInfo(): ModuleInstantiateInfo {
    throw new Error('Not implemented')
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

    return daoVotingSgCommunityNftQueries.votingPowerAtHeight(
      this.queryClient,
      {
        chainId: this.dao.chainId,
        contractAddress: this.address,
        args: {
          address,
          height,
        },
      }
    )
  }

  getTotalVotingPowerQuery(
    height?: number
  ): FetchQueryOptions<TotalPowerAtHeightResponse> {
    return daoVotingSgCommunityNftQueries.totalPowerAtHeight(this.queryClient, {
      chainId: this.dao.chainId,
      contractAddress: this.address,
      args: {
        height,
      },
    })
  }
}
