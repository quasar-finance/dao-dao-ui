import { FetchQueryOptions, skipToken } from '@tanstack/react-query'

import { neutronVotingRegistryQueries } from '@dao-dao/state/query'
import { ModuleInstantiateInfo } from '@dao-dao/types'
import {
  TotalPowerAtHeightResponse,
  VotingPowerAtHeightResponse,
} from '@dao-dao/types/contracts/NeutronVotingRegistry'
import { NEUTRON_VOTING_REGISTRY_CONTRACT_NAMES } from '@dao-dao/utils'

import { CwDao } from '../dao/CwDao'
import { VotingModuleBase } from './base'

export class NeutronVotingRegistryVotingModule extends VotingModuleBase<CwDao> {
  static contractNames: readonly string[] =
    NEUTRON_VOTING_REGISTRY_CONTRACT_NAMES

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

    return neutronVotingRegistryQueries.votingPowerAtHeight({
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
    return neutronVotingRegistryQueries.totalPowerAtHeight({
      chainId: this.dao.chainId,
      contractAddress: this.address,
      args: {
        height,
      },
    })
  }
}
