import { selectorFamily } from 'recoil'

import { WithChainId } from '@dao-dao/types'
import {
  ClaimsResponse,
  Config,
  ListStakersResponse,
  TotalPowerAtHeightResponse,
  VotingPowerAtHeightResponse,
} from '@dao-dao/types/contracts/DaoVotingNativeStaked'

import {
  DaoVotingNativeStakedClient,
  DaoVotingNativeStakedQueryClient,
} from '../../../contracts/DaoVotingNativeStaked'
import { signingCosmWasmClientAtom } from '../../atoms'
import {
  refreshClaimsIdAtom,
  refreshDaoVotingPowerAtom,
  refreshWalletBalancesIdAtom,
} from '../../atoms/refresh'
import { cosmWasmClientForChainSelector } from '../chain'
import { contractInfoSelector } from '../contract'
import { queryContractIndexerSelector } from '../indexer'

type QueryClientParams = WithChainId<{
  contractAddress: string
}>

export const queryClient = selectorFamily<
  DaoVotingNativeStakedQueryClient,
  QueryClientParams
>({
  key: 'daoVotingNativeStakedQueryClient',
  get:
    ({ contractAddress, chainId }) =>
    ({ get }) => {
      const client = get(cosmWasmClientForChainSelector(chainId))
      return new DaoVotingNativeStakedQueryClient(client, contractAddress)
    },
  dangerouslyAllowMutability: true,
})

export type ExecuteClientParams = WithChainId<{
  contractAddress: string
  sender: string
}>

export const executeClient = selectorFamily<
  DaoVotingNativeStakedClient | undefined,
  ExecuteClientParams
>({
  key: 'daoVotingNativeStakedExecuteClient',
  get:
    ({ chainId, contractAddress, sender }) =>
    ({ get }) => {
      const client = get(signingCosmWasmClientAtom({ chainId }))
      if (!client) return
      return new DaoVotingNativeStakedClient(client, sender, contractAddress)
    },
  dangerouslyAllowMutability: true,
})

export const daoSelector = selectorFamily<
  string,
  QueryClientParams & {
    params: Parameters<DaoVotingNativeStakedQueryClient['dao']>
  }
>({
  key: 'daoVotingNativeStakedDao',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const dao = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoVotingNativeStaked/dao',
        })
      )
      if (dao) {
        return dao
      }

      // If indexer query fails, fallback to contract query.
      const client = get(queryClient(queryClientParams))
      return await client.dao(...params)
    },
})
export const getConfigSelector = selectorFamily<
  Config,
  QueryClientParams & {
    params: Parameters<DaoVotingNativeStakedQueryClient['getConfig']>
  }
>({
  key: 'daoVotingNativeStakedGetConfig',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const config = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoVotingNativeStaked/config',
        })
      )
      if (config) {
        return config
      }

      // If indexer query fails, fallback to contract query.
      const client = get(queryClient(queryClientParams))
      return await client.getConfig(...params)
    },
})
export const claimsSelector = selectorFamily<
  ClaimsResponse,
  QueryClientParams & {
    params: Parameters<DaoVotingNativeStakedQueryClient['claims']>
  }
>({
  key: 'daoVotingNativeStakedClaims',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const id = get(refreshClaimsIdAtom(params[0].address))

      const claims = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoVotingNativeStaked/claims',
          args: params[0],
          id,
        })
      )
      // Null when indexer fails. Undefined if no claims.
      if (claims !== null) {
        return { claims: claims || [] }
      }

      // If indexer query fails, fallback to contract query.
      const client = get(queryClient(queryClientParams))
      return await client.claims(...params)
    },
})
export const listStakersSelector = selectorFamily<
  ListStakersResponse,
  QueryClientParams & {
    params: Parameters<DaoVotingNativeStakedQueryClient['listStakers']>
  }
>({
  key: 'daoVotingNativeStakedListStakers',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const stakers = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoVotingNativeStaked/listStakers',
          args: params[0],
        })
      )
      if (stakers) {
        return { stakers }
      }

      // If indexer query fails, fallback to contract query.
      const client = get(queryClient(queryClientParams))
      return await client.listStakers(...params)
    },
})
export const votingPowerAtHeightSelector = selectorFamily<
  VotingPowerAtHeightResponse,
  QueryClientParams & {
    params: Parameters<DaoVotingNativeStakedQueryClient['votingPowerAtHeight']>
  }
>({
  key: 'daoVotingNativeStakedVotingPowerAtHeight',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const id = get(refreshWalletBalancesIdAtom(params[0].address))

      const votingPowerAtHeight = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoVotingNativeStaked/votingPowerAtHeight',
          args: {
            address: params[0].address,
          },
          block: params[0].height ? { height: params[0].height } : undefined,
          id,
        })
      )
      if (votingPowerAtHeight) {
        return votingPowerAtHeight
      }

      // If indexer query fails, fallback to contract query.
      const client = get(queryClient(queryClientParams))
      return await client.votingPowerAtHeight(...params)
    },
})
export const totalPowerAtHeightSelector = selectorFamily<
  TotalPowerAtHeightResponse,
  QueryClientParams & {
    params: Parameters<DaoVotingNativeStakedQueryClient['totalPowerAtHeight']>
  }
>({
  key: 'daoVotingNativeStakedTotalPowerAtHeight',
  get:
    ({ params, ...queryClientParams }) =>
    async ({ get }) => {
      const id =
        get(refreshWalletBalancesIdAtom(undefined)) +
        get(refreshDaoVotingPowerAtom(queryClientParams.contractAddress))

      const totalPowerAtHeight = get(
        queryContractIndexerSelector({
          ...queryClientParams,
          formula: 'daoVotingNativeStaked/totalPowerAtHeight',
          block: params[0].height ? { height: params[0].height } : undefined,
          id,
        })
      )
      if (totalPowerAtHeight) {
        return totalPowerAtHeight
      }

      // If indexer query fails, fallback to contract query.
      const client = get(queryClient(queryClientParams))
      return await client.totalPowerAtHeight(...params)
    },
})
export const infoSelector = contractInfoSelector
