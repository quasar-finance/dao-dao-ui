import { ComponentType } from 'react'

import { ActionKeyAndData } from './actions'
import { Threshold } from './contracts/DaoProposalSingle.common'
import { ParsedTarget, RebalancerConfig } from './contracts/ValenceRebalancer'
import { GenericToken } from './token'

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
   * A cryptographic multisig.
   */
  CryptographicMultisig = 'cryptographicMultisig',
  /**
   * A cw3 smart-contract-based multisig.
   */
  Cw3Multisig = 'cw3Multisig',
  /**
   * A Timewave Valence account.
   */
  Valence = 'valence',
}

export type BaseAccount = {
  chainId: string
  address: string
}

export type NativeAccount = BaseAccount & {
  type: AccountType.Native
  config?: undefined
}

export type PolytoneAccount = BaseAccount & {
  type: AccountType.Polytone
  config?: undefined
}

export type IcaAccount = BaseAccount & {
  type: AccountType.Ica
  config?: undefined
}

export type CryptographicMultisigAccount = BaseAccount & {
  type: AccountType.CryptographicMultisig
  config: {
    /**
     * The members of the multisig.
     */
    members: {
      address: string
      weight: number
    }[]
    /**
     * The threshold of members that must sign a transaction for it to be valid.
     */
    threshold: Threshold
    /**
     * The sum of all members' weights.
     */
    totalWeight: number
  }
}

export type Cw3MultisigAccount = BaseAccount & {
  type: AccountType.Cw3Multisig
  config: CryptographicMultisigAccount['config']
}

export type MultisigAccount = CryptographicMultisigAccount | Cw3MultisigAccount

export type ValenceAccount = BaseAccount & {
  type: AccountType.Valence
  config: ValenceAccountConfig
}

export type ValenceAccountConfig = {
  // If rebalancer setup, this will be defined.
  rebalancer: {
    config: RebalancerConfig
    // Process targest.
    targets: ValenceAccountRebalancerTarget[]
  } | null
}

export type ValenceAccountRebalancerTarget = {
  /**
   * The token being rebalanced.
   */
  token: GenericToken
  /**
   * Target changes over time for this token.
   */
  targets: ({
    timestamp: number
  } & ParsedTarget)[]
}

export type Account =
  | NativeAccount
  | PolytoneAccount
  | IcaAccount
  | CryptographicMultisigAccount
  | Cw3MultisigAccount
  | ValenceAccount

/**
 * Unique identifier for account tabs, which is used in the URL path.
 */
export enum AccountTabId {
  Wallet = 'wallet',
  Daos = 'daos',
  Actions = 'actions',
}

export type AccountTab = {
  id: AccountTabId
  label: string
  Icon: ComponentType<{ className: string }>
  Component: ComponentType<any>
}

export type AccountTxForm = {
  actions: ActionKeyAndData[]
}

export type AccountTxSave = AccountTxForm & {
  name: string
  description?: string
}
