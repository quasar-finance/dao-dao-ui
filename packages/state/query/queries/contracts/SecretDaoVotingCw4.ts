/**
 * This file was automatically generated by @cosmwasm/ts-codegen@1.10.0.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run the @cosmwasm/ts-codegen generate command to regenerate this file.
 */

import { UseQueryOptions } from '@tanstack/react-query'

import {
  AnyContractInfo,
  Auth,
  InfoResponse,
  TotalPowerAtHeightResponse,
  VotingPowerAtHeightResponse,
} from '@dao-dao/types/contracts/SecretDaoVotingCw4'
import { getCosmWasmClientForChainId } from '@dao-dao/utils'

import { SecretDaoVotingCw4QueryClient } from '../../../contracts/SecretDaoVotingCw4'

export const secretDaoVotingCw4QueryKeys = {
  contract: [
    {
      contract: 'secretDaoVotingCw4',
    },
  ] as const,
  address: (chainId: string, contractAddress: string) =>
    [
      {
        ...secretDaoVotingCw4QueryKeys.contract[0],
        chainId,
        address: contractAddress,
      },
    ] as const,
  groupContract: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...secretDaoVotingCw4QueryKeys.address(chainId, contractAddress)[0],
        method: 'group_contract',
        args,
      },
    ] as const,
  votingPowerAtHeight: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...secretDaoVotingCw4QueryKeys.address(chainId, contractAddress)[0],
        method: 'voting_power_at_height',
        args,
      },
    ] as const,
  totalPowerAtHeight: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...secretDaoVotingCw4QueryKeys.address(chainId, contractAddress)[0],
        method: 'total_power_at_height',
        args,
      },
    ] as const,
  dao: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...secretDaoVotingCw4QueryKeys.address(chainId, contractAddress)[0],
        method: 'dao',
        args,
      },
    ] as const,
  info: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...secretDaoVotingCw4QueryKeys.address(chainId, contractAddress)[0],
        method: 'info',
        args,
      },
    ] as const,
}
export const secretDaoVotingCw4Queries = {
  groupContract: <TData = AnyContractInfo>({
    chainId,
    contractAddress,
    options,
  }: SecretDaoVotingCw4GroupContractQuery<TData>): UseQueryOptions<
    AnyContractInfo,
    Error,
    TData
  > => ({
    queryKey: secretDaoVotingCw4QueryKeys.groupContract(
      chainId,
      contractAddress
    ),
    queryFn: async () =>
      new SecretDaoVotingCw4QueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).groupContract(),
    ...options,
  }),
  votingPowerAtHeight: <TData = VotingPowerAtHeightResponse>({
    chainId,
    contractAddress,
    args,
    options,
  }: SecretDaoVotingCw4VotingPowerAtHeightQuery<TData>): UseQueryOptions<
    VotingPowerAtHeightResponse,
    Error,
    TData
  > => ({
    queryKey: secretDaoVotingCw4QueryKeys.votingPowerAtHeight(
      chainId,
      contractAddress,
      args
    ),
    queryFn: async () =>
      new SecretDaoVotingCw4QueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).votingPowerAtHeight({
        auth: args.auth,
        height: args.height,
      }),
    ...options,
  }),
  totalPowerAtHeight: <TData = TotalPowerAtHeightResponse>({
    chainId,
    contractAddress,
    args,
    options,
  }: SecretDaoVotingCw4TotalPowerAtHeightQuery<TData>): UseQueryOptions<
    TotalPowerAtHeightResponse,
    Error,
    TData
  > => ({
    queryKey: secretDaoVotingCw4QueryKeys.totalPowerAtHeight(
      chainId,
      contractAddress,
      args
    ),
    queryFn: async () =>
      new SecretDaoVotingCw4QueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).totalPowerAtHeight({
        height: args.height,
      }),
    ...options,
  }),
  dao: <TData = AnyContractInfo>({
    chainId,
    contractAddress,
    options,
  }: SecretDaoVotingCw4DaoQuery<TData>): UseQueryOptions<
    AnyContractInfo,
    Error,
    TData
  > => ({
    queryKey: secretDaoVotingCw4QueryKeys.dao(chainId, contractAddress),
    queryFn: async () =>
      new SecretDaoVotingCw4QueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).dao(),
    ...options,
  }),
  info: <TData = InfoResponse>({
    chainId,
    contractAddress,
    options,
  }: SecretDaoVotingCw4InfoQuery<TData>): UseQueryOptions<
    InfoResponse,
    Error,
    TData
  > => ({
    queryKey: secretDaoVotingCw4QueryKeys.info(chainId, contractAddress),
    queryFn: async () =>
      new SecretDaoVotingCw4QueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).info(),
    ...options,
  }),
}
export interface SecretDaoVotingCw4ReactQuery<TResponse, TData = TResponse> {
  chainId: string
  contractAddress: string
  options?: Omit<
    UseQueryOptions<TResponse, Error, TData>,
    'queryKey' | 'queryFn' | 'initialData'
  > & {
    initialData?: undefined
  }
}
export interface SecretDaoVotingCw4InfoQuery<TData>
  extends SecretDaoVotingCw4ReactQuery<InfoResponse, TData> {}
export interface SecretDaoVotingCw4DaoQuery<TData>
  extends SecretDaoVotingCw4ReactQuery<AnyContractInfo, TData> {}
export interface SecretDaoVotingCw4TotalPowerAtHeightQuery<TData>
  extends SecretDaoVotingCw4ReactQuery<TotalPowerAtHeightResponse, TData> {
  args: {
    height?: number
  }
}
export interface SecretDaoVotingCw4VotingPowerAtHeightQuery<TData>
  extends SecretDaoVotingCw4ReactQuery<VotingPowerAtHeightResponse, TData> {
  args: {
    auth: Auth
    height?: number
  }
}
export interface SecretDaoVotingCw4GroupContractQuery<TData>
  extends SecretDaoVotingCw4ReactQuery<AnyContractInfo, TData> {}
