import { FetchQueryOptions, QueryClient } from '@tanstack/react-query'

import {
  ContractVersion,
  ContractVersionInfo,
  IDaoBase,
  IVotingModuleBase,
} from '@dao-dao/types'
import {
  TotalPowerAtHeightResponse,
  VotingPowerAtHeightResponse,
} from '@dao-dao/types/contracts/DaoDaoCore'
import { parseContractVersion } from '@dao-dao/utils'

export abstract class VotingModuleBase<Dao extends IDaoBase = IDaoBase>
  implements IVotingModuleBase
{
  /**
   * The contract names that this module supports.
   */
  static contractNames: readonly string[]

  constructor(
    protected readonly queryClient: QueryClient,
    public readonly dao: Dao,
    public readonly address: string,
    protected readonly info: ContractVersionInfo
  ) {}

  /**
   * Contract version.
   */
  get version(): ContractVersion {
    return parseContractVersion(this.info.version)
  }

  /**
   * Contract name.
   */
  get contractName(): string {
    return this.info.contract
  }

  /**
   * Query options to fetch the voting power for a given address. Optionally
   * specify a block height. If undefined, the latest block height will be used.
   * If address is undefined, will return query in loading state.
   */
  abstract getVotingPowerQuery(
    address?: string,
    height?: number
  ): FetchQueryOptions<VotingPowerAtHeightResponse>

  /**
   * Fetch the voting power for a given address. Optionally specify a block
   * height. If undefined, the latest block height will be used.
   */
  async getVotingPower(
    ...params: Parameters<IVotingModuleBase['getVotingPowerQuery']>
  ): Promise<string> {
    return (
      await this.queryClient.fetchQuery(this.getVotingPowerQuery(...params))
    ).power
  }

  /**
   * Query options to fetch the total voting power. Optionally specify a block
   * height. If undefined, the latest block height will be used.
   */
  abstract getTotalVotingPowerQuery(
    height?: number
  ): FetchQueryOptions<TotalPowerAtHeightResponse>

  /**
   * Fetch the total voting power. Optional specify a block height. If
   * undefined, the latest block height will be used.
   */
  async getTotalVotingPower(
    ...params: Parameters<IVotingModuleBase['getTotalVotingPowerQuery']>
  ): Promise<string> {
    return (
      await this.queryClient.fetchQuery(
        this.getTotalVotingPowerQuery(...params)
      )
    ).power
  }
}
