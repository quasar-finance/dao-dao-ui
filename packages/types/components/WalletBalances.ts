import { ComponentType } from 'react'

import { Account } from '../account'
import { LoadingData, LoadingDataWithError } from '../misc'
import { LazyNftCardInfo } from '../nft'
import { TokenCardInfo } from '../token'
import { ValenceAccountDisplayProps } from './ValenceAccountDisplay'

export type WalletBalancesProps<
  T extends TokenCardInfo,
  N extends LazyNftCardInfo
> = {
  accounts: LoadingDataWithError<Account[]>
  tokens: LoadingDataWithError<T[]>
  // List of token denomOrAddress fields that should be hidden.
  hiddenTokens: LoadingData<string[]>
  TokenLine: ComponentType<T>
  nfts: LoadingDataWithError<N[]>
  NftCard: ComponentType<N>
} & Pick<
  ValenceAccountDisplayProps<T>,
  | 'ButtonLink'
  | 'IconButtonLink'
  | 'configureRebalancerHref'
  | 'TreasuryHistoryGraph'
>
