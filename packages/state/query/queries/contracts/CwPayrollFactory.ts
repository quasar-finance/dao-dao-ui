/**
 * This file was automatically generated by @cosmwasm/ts-codegen@1.10.0.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run the @cosmwasm/ts-codegen generate command to regenerate this file.
 */

import { QueryClient, UseQueryOptions } from '@tanstack/react-query'

import {
  ArrayOfVestingContract,
  OwnershipForAddr,
  Uint64,
} from '@dao-dao/types/contracts/CwPayrollFactory'
import { getCosmWasmClientForChainId } from '@dao-dao/utils'

import { CwPayrollFactoryQueryClient } from '../../../contracts/CwPayrollFactory'
import { indexerQueries } from '../indexer'

export const cwPayrollFactoryQueryKeys = {
  contract: [
    {
      contract: 'cwPayrollFactory',
    },
  ] as const,
  address: (chainId: string, contractAddress: string) =>
    [
      {
        ...cwPayrollFactoryQueryKeys.contract[0],
        chainId,
        address: contractAddress,
      },
    ] as const,
  listVestingContracts: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...cwPayrollFactoryQueryKeys.address(chainId, contractAddress)[0],
        method: 'list_vesting_contracts',
        args,
      },
    ] as const,
  listVestingContractsReverse: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...cwPayrollFactoryQueryKeys.address(chainId, contractAddress)[0],
        method: 'list_vesting_contracts_reverse',
        args,
      },
    ] as const,
  listVestingContractsByInstantiator: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...cwPayrollFactoryQueryKeys.address(chainId, contractAddress)[0],
        method: 'list_vesting_contracts_by_instantiator',
        args,
      },
    ] as const,
  listVestingContractsByInstantiatorReverse: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...cwPayrollFactoryQueryKeys.address(chainId, contractAddress)[0],
        method: 'list_vesting_contracts_by_instantiator_reverse',
        args,
      },
    ] as const,
  listVestingContractsByRecipient: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...cwPayrollFactoryQueryKeys.address(chainId, contractAddress)[0],
        method: 'list_vesting_contracts_by_recipient',
        args,
      },
    ] as const,
  listVestingContractsByRecipientReverse: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...cwPayrollFactoryQueryKeys.address(chainId, contractAddress)[0],
        method: 'list_vesting_contracts_by_recipient_reverse',
        args,
      },
    ] as const,
  ownership: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...cwPayrollFactoryQueryKeys.address(chainId, contractAddress)[0],
        method: 'ownership',
        args,
      },
    ] as const,
  codeId: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...cwPayrollFactoryQueryKeys.address(chainId, contractAddress)[0],
        method: 'code_id',
        args,
      },
    ] as const,
}
export const cwPayrollFactoryQueries = {
  listVestingContracts: <TData = ArrayOfVestingContract>(
    queryClient: QueryClient,
    {
      chainId,
      contractAddress,
      args,
      options,
    }: CwPayrollFactoryListVestingContractsQuery<TData>
  ): UseQueryOptions<ArrayOfVestingContract, Error, TData> => ({
    queryKey: cwPayrollFactoryQueryKeys.listVestingContracts(
      chainId,
      contractAddress,
      args
    ),
    queryFn: async () => {
      try {
        // Attempt to fetch data from the indexer.
        return await queryClient.fetchQuery(
          indexerQueries.queryContract(queryClient, {
            chainId,
            contractAddress,
            formula: 'cwPayrollFactory/listVestingContracts',
            args,
          })
        )
      } catch (error) {
        console.error(error)
      }

      // If indexer query fails, fallback to contract query.
      return new CwPayrollFactoryQueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).listVestingContracts({
        limit: args.limit,
        startAfter: args.startAfter,
      })
    },
    ...options,
  }),
  listVestingContractsReverse: <TData = ArrayOfVestingContract>(
    queryClient: QueryClient,
    {
      chainId,
      contractAddress,
      args,
      options,
    }: CwPayrollFactoryListVestingContractsReverseQuery<TData>
  ): UseQueryOptions<ArrayOfVestingContract, Error, TData> => ({
    queryKey: cwPayrollFactoryQueryKeys.listVestingContractsReverse(
      chainId,
      contractAddress,
      args
    ),
    queryFn: async () => {
      try {
        // Attempt to fetch data from the indexer.
        return await queryClient.fetchQuery(
          indexerQueries.queryContract(queryClient, {
            chainId,
            contractAddress,
            formula: 'cwPayrollFactory/listVestingContractsReverse',
            args,
          })
        )
      } catch (error) {
        console.error(error)
      }

      // If indexer query fails, fallback to contract query.
      return new CwPayrollFactoryQueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).listVestingContractsReverse({
        limit: args.limit,
        startBefore: args.startBefore,
      })
    },
    ...options,
  }),
  listVestingContractsByInstantiator: <TData = ArrayOfVestingContract>(
    queryClient: QueryClient,
    {
      chainId,
      contractAddress,
      args,
      options,
    }: CwPayrollFactoryListVestingContractsByInstantiatorQuery<TData>
  ): UseQueryOptions<ArrayOfVestingContract, Error, TData> => ({
    queryKey: cwPayrollFactoryQueryKeys.listVestingContractsByInstantiator(
      chainId,
      contractAddress,
      args
    ),
    queryFn: async () => {
      try {
        // Attempt to fetch data from the indexer.
        return await queryClient.fetchQuery(
          indexerQueries.queryContract(queryClient, {
            chainId,
            contractAddress,
            formula: 'cwPayrollFactory/listVestingContractsByInstantiator',
            args,
          })
        )
      } catch (error) {
        console.error(error)
      }

      // If indexer query fails, fallback to contract query.
      return new CwPayrollFactoryQueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).listVestingContractsByInstantiator({
        instantiator: args.instantiator,
        limit: args.limit,
        startAfter: args.startAfter,
      })
    },
    ...options,
  }),
  listVestingContractsByInstantiatorReverse: <TData = ArrayOfVestingContract>(
    queryClient: QueryClient,
    {
      chainId,
      contractAddress,
      args,
      options,
    }: CwPayrollFactoryListVestingContractsByInstantiatorReverseQuery<TData>
  ): UseQueryOptions<ArrayOfVestingContract, Error, TData> => ({
    queryKey:
      cwPayrollFactoryQueryKeys.listVestingContractsByInstantiatorReverse(
        chainId,
        contractAddress,
        args
      ),
    queryFn: async () => {
      try {
        // Attempt to fetch data from the indexer.
        return await queryClient.fetchQuery(
          indexerQueries.queryContract(queryClient, {
            chainId,
            contractAddress,
            formula:
              'cwPayrollFactory/listVestingContractsByInstantiatorReverse',
            args,
          })
        )
      } catch (error) {
        console.error(error)
      }

      // If indexer query fails, fallback to contract query.
      return new CwPayrollFactoryQueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).listVestingContractsByInstantiatorReverse({
        instantiator: args.instantiator,
        limit: args.limit,
        startBefore: args.startBefore,
      })
    },
    ...options,
  }),
  listVestingContractsByRecipient: <TData = ArrayOfVestingContract>(
    queryClient: QueryClient,
    {
      chainId,
      contractAddress,
      args,
      options,
    }: CwPayrollFactoryListVestingContractsByRecipientQuery<TData>
  ): UseQueryOptions<ArrayOfVestingContract, Error, TData> => ({
    queryKey: cwPayrollFactoryQueryKeys.listVestingContractsByRecipient(
      chainId,
      contractAddress,
      args
    ),
    queryFn: async () => {
      try {
        // Attempt to fetch data from the indexer.
        return await queryClient.fetchQuery(
          indexerQueries.queryContract(queryClient, {
            chainId,
            contractAddress,
            formula: 'cwPayrollFactory/listVestingContractsByRecipient',
            args,
          })
        )
      } catch (error) {
        console.error(error)
      }

      // If indexer query fails, fallback to contract query.
      return new CwPayrollFactoryQueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).listVestingContractsByRecipient({
        limit: args.limit,
        recipient: args.recipient,
        startAfter: args.startAfter,
      })
    },
    ...options,
  }),
  listVestingContractsByRecipientReverse: <TData = ArrayOfVestingContract>(
    queryClient: QueryClient,
    {
      chainId,
      contractAddress,
      args,
      options,
    }: CwPayrollFactoryListVestingContractsByRecipientReverseQuery<TData>
  ): UseQueryOptions<ArrayOfVestingContract, Error, TData> => ({
    queryKey: cwPayrollFactoryQueryKeys.listVestingContractsByRecipientReverse(
      chainId,
      contractAddress,
      args
    ),
    queryFn: async () => {
      try {
        // Attempt to fetch data from the indexer.
        return await queryClient.fetchQuery(
          indexerQueries.queryContract(queryClient, {
            chainId,
            contractAddress,
            formula: 'cwPayrollFactory/listVestingContractsByRecipientReverse',
            args,
          })
        )
      } catch (error) {
        console.error(error)
      }

      // If indexer query fails, fallback to contract query.
      return new CwPayrollFactoryQueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).listVestingContractsByRecipientReverse({
        limit: args.limit,
        recipient: args.recipient,
        startBefore: args.startBefore,
      })
    },
    ...options,
  }),
  ownership: <TData = OwnershipForAddr>(
    queryClient: QueryClient,
    { chainId, contractAddress, options }: CwPayrollFactoryOwnershipQuery<TData>
  ): UseQueryOptions<OwnershipForAddr, Error, TData> => ({
    queryKey: cwPayrollFactoryQueryKeys.ownership(chainId, contractAddress),
    queryFn: async () => {
      try {
        // Attempt to fetch data from the indexer.
        return await queryClient.fetchQuery(
          indexerQueries.queryContract(queryClient, {
            chainId,
            contractAddress,
            formula: 'cwPayrollFactory/ownership',
          })
        )
      } catch (error) {
        console.error(error)
      }

      // If indexer query fails, fallback to contract query.
      return new CwPayrollFactoryQueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).ownership()
    },
    ...options,
  }),
  codeId: <TData = Uint64>(
    queryClient: QueryClient,
    { chainId, contractAddress, options }: CwPayrollFactoryCodeIdQuery<TData>
  ): UseQueryOptions<Uint64, Error, TData> => ({
    queryKey: cwPayrollFactoryQueryKeys.codeId(chainId, contractAddress),
    queryFn: async () => {
      try {
        // Attempt to fetch data from the indexer.
        return await queryClient.fetchQuery(
          indexerQueries.queryContract(queryClient, {
            chainId,
            contractAddress,
            formula: 'cwPayrollFactory/codeId',
          })
        )
      } catch (error) {
        console.error(error)
      }

      // If indexer query fails, fallback to contract query.
      return new CwPayrollFactoryQueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).codeId()
    },
    ...options,
  }),
}
export interface CwPayrollFactoryReactQuery<TResponse, TData = TResponse> {
  chainId: string
  contractAddress: string
  options?: Omit<
    UseQueryOptions<TResponse, Error, TData>,
    'queryKey' | 'queryFn' | 'initialData'
  > & {
    initialData?: undefined
  }
}
export interface CwPayrollFactoryCodeIdQuery<TData>
  extends CwPayrollFactoryReactQuery<Uint64, TData> {}
export interface CwPayrollFactoryOwnershipQuery<TData>
  extends CwPayrollFactoryReactQuery<OwnershipForAddr, TData> {}
export interface CwPayrollFactoryListVestingContractsByRecipientReverseQuery<
  TData
> extends CwPayrollFactoryReactQuery<ArrayOfVestingContract, TData> {
  args: {
    limit?: number
    recipient: string
    startBefore?: string
  }
}
export interface CwPayrollFactoryListVestingContractsByRecipientQuery<TData>
  extends CwPayrollFactoryReactQuery<ArrayOfVestingContract, TData> {
  args: {
    limit?: number
    recipient: string
    startAfter?: string
  }
}
export interface CwPayrollFactoryListVestingContractsByInstantiatorReverseQuery<
  TData
> extends CwPayrollFactoryReactQuery<ArrayOfVestingContract, TData> {
  args: {
    instantiator: string
    limit?: number
    startBefore?: string
  }
}
export interface CwPayrollFactoryListVestingContractsByInstantiatorQuery<TData>
  extends CwPayrollFactoryReactQuery<ArrayOfVestingContract, TData> {
  args: {
    instantiator: string
    limit?: number
    startAfter?: string
  }
}
export interface CwPayrollFactoryListVestingContractsReverseQuery<TData>
  extends CwPayrollFactoryReactQuery<ArrayOfVestingContract, TData> {
  args: {
    limit?: number
    startBefore?: string
  }
}
export interface CwPayrollFactoryListVestingContractsQuery<TData>
  extends CwPayrollFactoryReactQuery<ArrayOfVestingContract, TData> {
  args: {
    limit?: number
    startAfter?: string
  }
}
