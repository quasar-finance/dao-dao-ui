/**
 * This file was automatically generated by @cosmwasm/ts-codegen@1.10.0.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run the @cosmwasm/ts-codegen generate command to regenerate this file.
 */

import { Coin, StdFee } from '@cosmjs/amino'
import {
  CosmWasmClient,
  ExecuteResult,
  SigningCosmWasmClient,
} from '@cosmjs/cosmwasm-stargate'

import {
  ActiveThreshold,
  ActiveThresholdResponse,
  Addr,
  ArrayOfString,
  Binary,
  Boolean,
  Config,
  Duration,
  HooksResponse,
  InfoResponse,
  NftClaimsResponse,
  TotalPowerAtHeightResponse,
  VotingPowerAtHeightResponse,
} from '@dao-dao/types/contracts/DaoVotingCw721Staked'
import { CHAIN_GAS_MULTIPLIER } from '@dao-dao/utils'

export interface DaoVotingCw721StakedReadOnlyInterface {
  contractAddress: string
  config: () => Promise<Config>
  nftClaims: ({ address }: { address: string }) => Promise<NftClaimsResponse>
  hooks: () => Promise<HooksResponse>
  stakedNfts: ({
    address,
    limit,
    startAfter,
  }: {
    address: string
    limit?: number
    startAfter?: string
  }) => Promise<ArrayOfString>
  activeThreshold: () => Promise<ActiveThresholdResponse>
  isActive: () => Promise<Boolean>
  votingPowerAtHeight: ({
    address,
    height,
  }: {
    address: string
    height?: number
  }) => Promise<VotingPowerAtHeightResponse>
  totalPowerAtHeight: ({
    height,
  }: {
    height?: number
  }) => Promise<TotalPowerAtHeightResponse>
  dao: () => Promise<Addr>
  info: () => Promise<InfoResponse>
}
export class DaoVotingCw721StakedQueryClient
  implements DaoVotingCw721StakedReadOnlyInterface
{
  client: CosmWasmClient
  contractAddress: string
  constructor(client: CosmWasmClient, contractAddress: string) {
    this.client = client
    this.contractAddress = contractAddress
    this.config = this.config.bind(this)
    this.nftClaims = this.nftClaims.bind(this)
    this.hooks = this.hooks.bind(this)
    this.stakedNfts = this.stakedNfts.bind(this)
    this.activeThreshold = this.activeThreshold.bind(this)
    this.isActive = this.isActive.bind(this)
    this.votingPowerAtHeight = this.votingPowerAtHeight.bind(this)
    this.totalPowerAtHeight = this.totalPowerAtHeight.bind(this)
    this.dao = this.dao.bind(this)
    this.info = this.info.bind(this)
  }
  config = async (): Promise<Config> => {
    return this.client.queryContractSmart(this.contractAddress, {
      config: {},
    })
  }
  nftClaims = async ({
    address,
  }: {
    address: string
  }): Promise<NftClaimsResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      nft_claims: {
        address,
      },
    })
  }
  hooks = async (): Promise<HooksResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      hooks: {},
    })
  }
  stakedNfts = async ({
    address,
    limit,
    startAfter,
  }: {
    address: string
    limit?: number
    startAfter?: string
  }): Promise<ArrayOfString> => {
    return this.client.queryContractSmart(this.contractAddress, {
      staked_nfts: {
        address,
        limit,
        start_after: startAfter,
      },
    })
  }
  activeThreshold = async (): Promise<ActiveThresholdResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      active_threshold: {},
    })
  }
  isActive = async (): Promise<Boolean> => {
    return this.client.queryContractSmart(this.contractAddress, {
      is_active: {},
    })
  }
  votingPowerAtHeight = async ({
    address,
    height,
  }: {
    address: string
    height?: number
  }): Promise<VotingPowerAtHeightResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      voting_power_at_height: {
        address,
        height,
      },
    })
  }
  totalPowerAtHeight = async ({
    height,
  }: {
    height?: number
  }): Promise<TotalPowerAtHeightResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      total_power_at_height: {
        height,
      },
    })
  }
  dao = async (): Promise<Addr> => {
    return this.client.queryContractSmart(this.contractAddress, {
      dao: {},
    })
  }
  info = async (): Promise<InfoResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      info: {},
    })
  }
}
export interface DaoVotingCw721StakedInterface
  extends DaoVotingCw721StakedReadOnlyInterface {
  contractAddress: string
  sender: string
  receiveNft: (
    {
      msg,
      sender,
      tokenId,
    }: {
      msg: Binary
      sender: string
      tokenId: string
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    _funds?: Coin[]
  ) => Promise<ExecuteResult>
  unstake: (
    {
      tokenIds,
    }: {
      tokenIds: string[]
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    _funds?: Coin[]
  ) => Promise<ExecuteResult>
  claimNfts: (
    fee?: number | StdFee | 'auto',
    memo?: string,
    _funds?: Coin[]
  ) => Promise<ExecuteResult>
  updateConfig: (
    {
      duration,
    }: {
      duration?: Duration
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    _funds?: Coin[]
  ) => Promise<ExecuteResult>
  addHook: (
    {
      addr,
    }: {
      addr: string
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    _funds?: Coin[]
  ) => Promise<ExecuteResult>
  removeHook: (
    {
      addr,
    }: {
      addr: string
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    _funds?: Coin[]
  ) => Promise<ExecuteResult>
  updateActiveThreshold: (
    {
      newThreshold,
    }: {
      newThreshold?: ActiveThreshold
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    _funds?: Coin[]
  ) => Promise<ExecuteResult>
}
export class DaoVotingCw721StakedClient
  extends DaoVotingCw721StakedQueryClient
  implements DaoVotingCw721StakedInterface
{
  client: SigningCosmWasmClient
  sender: string
  contractAddress: string
  constructor(
    client: SigningCosmWasmClient,
    sender: string,
    contractAddress: string
  ) {
    super(client, contractAddress)
    this.client = client
    this.sender = sender
    this.contractAddress = contractAddress
    this.receiveNft = this.receiveNft.bind(this)
    this.unstake = this.unstake.bind(this)
    this.claimNfts = this.claimNfts.bind(this)
    this.updateConfig = this.updateConfig.bind(this)
    this.addHook = this.addHook.bind(this)
    this.removeHook = this.removeHook.bind(this)
    this.updateActiveThreshold = this.updateActiveThreshold.bind(this)
  }
  receiveNft = async (
    {
      msg,
      sender,
      tokenId,
    }: {
      msg: Binary
      sender: string
      tokenId: string
    },
    fee: number | StdFee | 'auto' = CHAIN_GAS_MULTIPLIER,
    memo?: string,
    _funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        receive_nft: {
          msg,
          sender,
          token_id: tokenId,
        },
      },
      fee,
      memo,
      _funds
    )
  }
  unstake = async (
    {
      tokenIds,
    }: {
      tokenIds: string[]
    },
    fee: number | StdFee | 'auto' = CHAIN_GAS_MULTIPLIER,
    memo?: string,
    _funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        unstake: {
          token_ids: tokenIds,
        },
      },
      fee,
      memo,
      _funds
    )
  }
  claimNfts = async (
    fee: number | StdFee | 'auto' = CHAIN_GAS_MULTIPLIER,
    memo?: string,
    _funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        claim_nfts: {},
      },
      fee,
      memo,
      _funds
    )
  }
  updateConfig = async (
    {
      duration,
    }: {
      duration?: Duration
    },
    fee: number | StdFee | 'auto' = CHAIN_GAS_MULTIPLIER,
    memo?: string,
    _funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        update_config: {
          duration,
        },
      },
      fee,
      memo,
      _funds
    )
  }
  addHook = async (
    {
      addr,
    }: {
      addr: string
    },
    fee: number | StdFee | 'auto' = CHAIN_GAS_MULTIPLIER,
    memo?: string,
    _funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        add_hook: {
          addr,
        },
      },
      fee,
      memo,
      _funds
    )
  }
  removeHook = async (
    {
      addr,
    }: {
      addr: string
    },
    fee: number | StdFee | 'auto' = CHAIN_GAS_MULTIPLIER,
    memo?: string,
    _funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        remove_hook: {
          addr,
        },
      },
      fee,
      memo,
      _funds
    )
  }
  updateActiveThreshold = async (
    {
      newThreshold,
    }: {
      newThreshold?: ActiveThreshold
    },
    fee: number | StdFee | 'auto' = CHAIN_GAS_MULTIPLIER,
    memo?: string,
    _funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        update_active_threshold: {
          new_threshold: newThreshold,
        },
      },
      fee,
      memo,
      _funds
    )
  }
}
