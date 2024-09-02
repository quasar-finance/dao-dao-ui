/**
 * This file was automatically generated by @cosmwasm/ts-codegen@1.10.0.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run the @cosmwasm/ts-codegen generate command to regenerate this file.
 */

import { UseQueryOptions } from '@tanstack/react-query'

import { Addr } from '@dao-dao/types'
import {
  ArrayOfTupleOfAddrAndRebalancerConfig,
  ManagersAddrsResponse,
  NullableCoin,
  PauseData,
  QueryFeeAction,
  RebalancerConfig,
  SystemRebalanceStatus,
  WhitelistsResponse,
} from '@dao-dao/types/contracts/ValenceRebalancer'
import { getCosmWasmClientForChainId } from '@dao-dao/utils'

import { ValenceRebalancerQueryClient } from '../../../contracts/ValenceRebalancer'

export const valenceRebalancerQueryKeys = {
  contract: [
    {
      contract: 'valenceRebalancer',
    },
  ] as const,
  address: (chainId: string, contractAddress: string) =>
    [
      {
        ...valenceRebalancerQueryKeys.contract[0],
        chainId,
        address: contractAddress,
      },
    ] as const,
  getConfig: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...valenceRebalancerQueryKeys.address(chainId, contractAddress)[0],
        method: 'get_config',
        args,
      },
    ] as const,
  getAllConfigs: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...valenceRebalancerQueryKeys.address(chainId, contractAddress)[0],
        method: 'get_all_configs',
        args,
      },
    ] as const,
  getPausedConfig: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...valenceRebalancerQueryKeys.address(chainId, contractAddress)[0],
        method: 'get_paused_config',
        args,
      },
    ] as const,
  getSystemStatus: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...valenceRebalancerQueryKeys.address(chainId, contractAddress)[0],
        method: 'get_system_status',
        args,
      },
    ] as const,
  getServiceFee: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...valenceRebalancerQueryKeys.address(chainId, contractAddress)[0],
        method: 'get_service_fee',
        args,
      },
    ] as const,
  getWhiteLists: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...valenceRebalancerQueryKeys.address(chainId, contractAddress)[0],
        method: 'get_white_lists',
        args,
      },
    ] as const,
  getManagersAddrs: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...valenceRebalancerQueryKeys.address(chainId, contractAddress)[0],
        method: 'get_managers_addrs',
        args,
      },
    ] as const,
  getAdmin: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...valenceRebalancerQueryKeys.address(chainId, contractAddress)[0],
        method: 'get_admin',
        args,
      },
    ] as const,
}
export const valenceRebalancerQueries = {
  getConfig: <TData = RebalancerConfig>({
    chainId,
    contractAddress,
    args,
    options,
  }: ValenceRebalancerGetConfigQuery<TData>): UseQueryOptions<
    RebalancerConfig,
    Error,
    TData
  > => ({
    queryKey: valenceRebalancerQueryKeys.getConfig(
      chainId,
      contractAddress,
      args
    ),
    queryFn: async () => {
      return new ValenceRebalancerQueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).getConfig({
        addr: args.addr,
      })
    },
    ...options,
  }),
  getAllConfigs: <TData = ArrayOfTupleOfAddrAndRebalancerConfig>({
    chainId,
    contractAddress,
    args,
    options,
  }: ValenceRebalancerGetAllConfigsQuery<TData>): UseQueryOptions<
    ArrayOfTupleOfAddrAndRebalancerConfig,
    Error,
    TData
  > => ({
    queryKey: valenceRebalancerQueryKeys.getAllConfigs(
      chainId,
      contractAddress,
      args
    ),
    queryFn: async () => {
      return new ValenceRebalancerQueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).getAllConfigs({
        limit: args.limit,
        startAfter: args.startAfter,
      })
    },
    ...options,
  }),
  getPausedConfig: <TData = PauseData>({
    chainId,
    contractAddress,
    args,
    options,
  }: ValenceRebalancerGetPausedConfigQuery<TData>): UseQueryOptions<
    PauseData,
    Error,
    TData
  > => ({
    queryKey: valenceRebalancerQueryKeys.getPausedConfig(
      chainId,
      contractAddress,
      args
    ),
    queryFn: async () => {
      return new ValenceRebalancerQueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).getPausedConfig({
        addr: args.addr,
      })
    },
    ...options,
  }),
  getSystemStatus: <TData = SystemRebalanceStatus>({
    chainId,
    contractAddress,
    options,
  }: ValenceRebalancerGetSystemStatusQuery<TData>): UseQueryOptions<
    SystemRebalanceStatus,
    Error,
    TData
  > => ({
    queryKey: valenceRebalancerQueryKeys.getSystemStatus(
      chainId,
      contractAddress
    ),
    queryFn: async () => {
      return new ValenceRebalancerQueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).getSystemStatus()
    },
    ...options,
  }),
  getServiceFee: <TData = NullableCoin>({
    chainId,
    contractAddress,
    args,
    options,
  }: ValenceRebalancerGetServiceFeeQuery<TData>): UseQueryOptions<
    NullableCoin,
    Error,
    TData
  > => ({
    queryKey: valenceRebalancerQueryKeys.getServiceFee(
      chainId,
      contractAddress,
      args
    ),
    queryFn: async () => {
      return new ValenceRebalancerQueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).getServiceFee({
        account: args.account,
        action: args.action,
      })
    },
    ...options,
  }),
  getWhiteLists: <TData = WhitelistsResponse>({
    chainId,
    contractAddress,
    options,
  }: ValenceRebalancerGetWhiteListsQuery<TData>): UseQueryOptions<
    WhitelistsResponse,
    Error,
    TData
  > => ({
    queryKey: valenceRebalancerQueryKeys.getWhiteLists(
      chainId,
      contractAddress
    ),
    queryFn: async () => {
      return new ValenceRebalancerQueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).getWhiteLists()
    },
    ...options,
  }),
  getManagersAddrs: <TData = ManagersAddrsResponse>({
    chainId,
    contractAddress,
    options,
  }: ValenceRebalancerGetManagersAddrsQuery<TData>): UseQueryOptions<
    ManagersAddrsResponse,
    Error,
    TData
  > => ({
    queryKey: valenceRebalancerQueryKeys.getManagersAddrs(
      chainId,
      contractAddress
    ),
    queryFn: async () => {
      return new ValenceRebalancerQueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).getManagersAddrs()
    },
    ...options,
  }),
  getAdmin: <TData = Addr>({
    chainId,
    contractAddress,
    options,
  }: ValenceRebalancerGetAdminQuery<TData>): UseQueryOptions<
    Addr,
    Error,
    TData
  > => ({
    queryKey: valenceRebalancerQueryKeys.getAdmin(chainId, contractAddress),
    queryFn: async () => {
      return new ValenceRebalancerQueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).getAdmin()
    },
    ...options,
  }),
}
export interface ValenceRebalancerReactQuery<TResponse, TData = TResponse> {
  chainId: string
  contractAddress: string
  options?: Omit<
    UseQueryOptions<TResponse, Error, TData>,
    'queryKey' | 'queryFn' | 'initialData'
  > & {
    initialData?: undefined
  }
}
export interface ValenceRebalancerGetServiceFeeQuery<TData>
  extends ValenceRebalancerReactQuery<NullableCoin, TData> {
  args: {
    account: string
    action: QueryFeeAction
  }
}
export interface ValenceRebalancerGetPausedConfigQuery<TData>
  extends ValenceRebalancerReactQuery<PauseData, TData> {
  args: {
    addr: string
  }
}
export interface ValenceRebalancerGetSystemStatusQuery<TData>
  extends ValenceRebalancerReactQuery<SystemRebalanceStatus, TData> {}
export interface ValenceRebalancerGetAllConfigsQuery<TData>
  extends ValenceRebalancerReactQuery<
    ArrayOfTupleOfAddrAndRebalancerConfig,
    TData
  > {
  args: {
    limit?: number
    startAfter?: string
  }
}
export interface ValenceRebalancerGetConfigQuery<TData>
  extends ValenceRebalancerReactQuery<RebalancerConfig, TData> {
  args: {
    addr: string
  }
}
export interface ValenceRebalancerGetWhiteListsQuery<TData>
  extends ValenceRebalancerReactQuery<WhitelistsResponse, TData> {}
export interface ValenceRebalancerGetManagersAddrsQuery<TData>
  extends ValenceRebalancerReactQuery<ManagersAddrsResponse, TData> {}
export interface ValenceRebalancerGetAdminQuery<TData>
  extends ValenceRebalancerReactQuery<Addr, TData> {}
