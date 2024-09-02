import { Coin, StdFee } from '@cosmjs/amino'
import { ExecuteResult, SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate'

import { Binary } from '@dao-dao/types/contracts/common'
import { CHAIN_GAS_MULTIPLIER } from '@dao-dao/utils'

export interface CwAdminFactoryInterface {
  contractAddress: string
  sender: string
  instantiateContractWithSelfAdmin: (
    {
      codeId,
      instantiateMsg,
      label,
    }: {
      codeId: number
      instantiateMsg: Binary
      label: string
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    funds?: Coin[]
  ) => Promise<ExecuteResult>
  instantiate2ContractWithSelfAdmin: (
    {
      codeId,
      instantiateMsg,
      label,
      salt,
      expect,
    }: {
      codeId: number
      instantiateMsg: Binary
      label: string
      salt: Binary
      expect?: string | null
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    funds?: Coin[]
  ) => Promise<ExecuteResult>
}
export class CwAdminFactoryClient implements CwAdminFactoryInterface {
  client: SigningCosmWasmClient
  sender: string
  contractAddress: string

  constructor(
    client: SigningCosmWasmClient,
    sender: string,
    contractAddress: string
  ) {
    this.client = client
    this.sender = sender
    this.contractAddress = contractAddress
    this.instantiateContractWithSelfAdmin =
      this.instantiateContractWithSelfAdmin.bind(this)
    this.instantiate2ContractWithSelfAdmin =
      this.instantiate2ContractWithSelfAdmin.bind(this)
  }
  instantiateContractWithSelfAdmin = async (
    {
      codeId,
      instantiateMsg,
      label,
    }: {
      codeId: number
      instantiateMsg: Binary
      label: string
    },
    fee: number | StdFee | 'auto' = CHAIN_GAS_MULTIPLIER,
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        instantiate_contract_with_self_admin: {
          code_id: codeId,
          instantiate_msg: instantiateMsg,
          label,
        },
      },
      fee,
      memo,
      funds
    )
  }
  instantiate2ContractWithSelfAdmin = async (
    {
      codeId,
      instantiateMsg,
      label,
      salt,
      expect,
    }: {
      codeId: number
      instantiateMsg: Binary
      label: string
      salt: Binary
      expect?: string | null
    },
    fee: number | StdFee | 'auto' = CHAIN_GAS_MULTIPLIER,
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        instantiate2_contract_with_self_admin: {
          code_id: codeId,
          instantiate_msg: instantiateMsg,
          label,
          salt,
          expect,
        },
      },
      fee,
      memo,
      funds
    )
  }
}
