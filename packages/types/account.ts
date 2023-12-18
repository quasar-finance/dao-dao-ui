import { ComponentType } from 'react'

import { ActionKeyAndData } from './actions'
import {
  ParsedTarget,
  RebalancerConfig,
} from './contracts/ValenceServiceRebalancer'
import { GenericTokenSource } from './token'

/**
 * The type of account given whatever the relevant context is.
 */
export enum AccountType {
  /**
   * context.
   */
  Native = 'native',
  /**
   * A Polytone account controlled by an account on another chain.
   */
  Polytone = 'polytone',
  /**
   * An ICA controlled by an account on another chain.
   */
  Ica = 'ica',
  /**
   * A Timewave Valence account.
   */
  Valence = 'valence',
}

export type NativeAccountTypeConfig = {
  type: AccountType.Native
  config?: undefined
}

export type PolytoneAccountTypeConfig = {
  type: AccountType.Polytone
  config?: undefined
}

export type ValenceAccountTypeConfig = {
  type: AccountType.Valence
  config: ValenceAccountConfig
}

export type IcaAccountTypeConfig = {
  type: AccountType.Ica
  config?: undefined
}

export type ValenceAccountConfig = {
  // If rebalancer setup, this will be defined.
  rebalancer?: {
    config: RebalancerConfig
    // Process targest.
    targets: ValenceAccountRebalancerTarget[]
  }
}

export type ValenceAccountRebalancerTarget = {
  // The source that uniquely identifies a token.
  source: GenericTokenSource
  // Target changes over time for this token.
  targets: ({
    timestamp: number
  } & ParsedTarget)[]
}

export type BaseAccount = {
  chainId: string
  address: string
}

export type NativeAccount = BaseAccount & NativeAccountTypeConfig
export type PolytoneAccount = BaseAccount & PolytoneAccountTypeConfig
export type ValenceAccount = BaseAccount & ValenceAccountTypeConfig
export type IcaAccount = BaseAccount & IcaAccountTypeConfig

export type Account =
  | NativeAccount
  | PolytoneAccount
  | IcaAccount
  | ValenceAccount

/**
 * Unique identifier for account tabs, which is used in the URL path.
 */
export enum AccountTabId {
  Balances = 'balances',
  Daos = 'daos',
  TransactionBuilder = 'tx',
}

export type AccountTab = {
  id: AccountTabId
  label: string
  Icon: ComponentType<{ className: string }>
  Component: ComponentType
}

export type AccountTxForm = {
  actions: ActionKeyAndData[]
}

export type AccountTxSave = AccountTxForm & {
  name: string
  description?: string
}

/**
 * The details that describe a cryptographic multisig.
 */
export type CryptographicMultisigDetails = {
  /**
   * The multisig's chain ID.
   */
  chainId: string
  /**
   * The multisig's address.
   */
  address: string
  /**
   * The member addresses of the multisig.
   */
  addresses: string[]
  /**
   * The number of members that must sign a transaction for it to be valid.
   */
  threshold: number
}
