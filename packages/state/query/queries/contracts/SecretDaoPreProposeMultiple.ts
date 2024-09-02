/**
 * This file was automatically generated by @cosmwasm/ts-codegen@1.10.0.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run the @cosmwasm/ts-codegen generate command to regenerate this file.
 */

import { UseQueryOptions } from '@tanstack/react-query'

import {
  AnyContractInfo,
  Binary,
  Config,
  DepositInfoResponse,
  Empty,
  HooksResponse,
} from '@dao-dao/types/contracts/SecretDaoPreProposeMultiple'
import { getCosmWasmClientForChainId } from '@dao-dao/utils'

import { SecretDaoPreProposeMultipleQueryClient } from '../../../contracts/SecretDaoPreProposeMultiple'
import { contractQueries } from '../contract'

export const secretDaoPreProposeMultipleQueryKeys = {
  contract: [
    {
      contract: 'secretDaoPreProposeMultiple',
    },
  ] as const,
  address: (chainId: string, contractAddress: string) =>
    [
      {
        ...secretDaoPreProposeMultipleQueryKeys.contract[0],
        chainId,
        address: contractAddress,
      },
    ] as const,
  proposalModule: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...secretDaoPreProposeMultipleQueryKeys.address(
          chainId,
          contractAddress
        )[0],
        method: 'proposal_module',
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
        ...secretDaoPreProposeMultipleQueryKeys.address(
          chainId,
          contractAddress
        )[0],
        method: 'dao',
        args,
      },
    ] as const,
  config: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...secretDaoPreProposeMultipleQueryKeys.address(
          chainId,
          contractAddress
        )[0],
        method: 'config',
        args,
      },
    ] as const,
  depositInfo: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...secretDaoPreProposeMultipleQueryKeys.address(
          chainId,
          contractAddress
        )[0],
        method: 'deposit_info',
        args,
      },
    ] as const,
  proposalSubmittedHooks: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...secretDaoPreProposeMultipleQueryKeys.address(
          chainId,
          contractAddress
        )[0],
        method: 'proposal_submitted_hooks',
        args,
      },
    ] as const,
  queryExtension: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...secretDaoPreProposeMultipleQueryKeys.address(
          chainId,
          contractAddress
        )[0],
        method: 'query_extension',
        args,
      },
    ] as const,
}
export const secretDaoPreProposeMultipleQueries = {
  proposalModule: <TData = AnyContractInfo>({
    chainId,
    contractAddress,
    options,
  }: SecretDaoPreProposeMultipleProposalModuleQuery<TData>): UseQueryOptions<
    AnyContractInfo,
    Error,
    TData
  > => ({
    queryKey: secretDaoPreProposeMultipleQueryKeys.proposalModule(
      chainId,
      contractAddress
    ),
    queryFn: async () =>
      new SecretDaoPreProposeMultipleQueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).proposalModule(),
    ...options,
  }),
  dao: <TData = AnyContractInfo>({
    chainId,
    contractAddress,
    options,
  }: SecretDaoPreProposeMultipleDaoQuery<TData>): UseQueryOptions<
    AnyContractInfo,
    Error,
    TData
  > => ({
    queryKey: secretDaoPreProposeMultipleQueryKeys.dao(
      chainId,
      contractAddress
    ),
    queryFn: async () =>
      new SecretDaoPreProposeMultipleQueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).dao(),
    ...options,
  }),
  config: <TData = Config>({
    chainId,
    contractAddress,
    options,
  }: SecretDaoPreProposeMultipleConfigQuery<TData>): UseQueryOptions<
    Config,
    Error,
    TData
  > => ({
    queryKey: secretDaoPreProposeMultipleQueryKeys.config(
      chainId,
      contractAddress
    ),
    queryFn: async () =>
      new SecretDaoPreProposeMultipleQueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).config(),
    ...options,
  }),
  depositInfo: <TData = DepositInfoResponse>({
    chainId,
    contractAddress,
    args,
    options,
  }: SecretDaoPreProposeMultipleDepositInfoQuery<TData>): UseQueryOptions<
    DepositInfoResponse,
    Error,
    TData
  > => ({
    queryKey: secretDaoPreProposeMultipleQueryKeys.depositInfo(
      chainId,
      contractAddress,
      args
    ),
    queryFn: async () =>
      new SecretDaoPreProposeMultipleQueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).depositInfo({
        proposalId: args.proposalId,
      }),
    ...options,
  }),
  proposalSubmittedHooks: <TData = HooksResponse>({
    chainId,
    contractAddress,
    options,
  }: SecretDaoPreProposeMultipleProposalSubmittedHooksQuery<TData>): UseQueryOptions<
    HooksResponse,
    Error,
    TData
  > => ({
    queryKey: secretDaoPreProposeMultipleQueryKeys.proposalSubmittedHooks(
      chainId,
      contractAddress
    ),
    queryFn: async () =>
      new SecretDaoPreProposeMultipleQueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).proposalSubmittedHooks(),
    ...options,
  }),
  queryExtension: <TData = Binary>({
    chainId,
    contractAddress,
    args,
    options,
  }: SecretDaoPreProposeMultipleQueryExtensionQuery<TData>): UseQueryOptions<
    Binary,
    Error,
    TData
  > => ({
    queryKey: secretDaoPreProposeMultipleQueryKeys.queryExtension(
      chainId,
      contractAddress,
      args
    ),
    queryFn: async () =>
      new SecretDaoPreProposeMultipleQueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).queryExtension({
        msg: args.msg,
      }),
    ...options,
  }),
  info: contractQueries.info,
}
export interface SecretDaoPreProposeMultipleReactQuery<
  TResponse,
  TData = TResponse
> {
  chainId: string
  contractAddress: string
  options?: Omit<
    UseQueryOptions<TResponse, Error, TData>,
    'queryKey' | 'queryFn' | 'initialData'
  > & {
    initialData?: undefined
  }
}
export interface SecretDaoPreProposeMultipleQueryExtensionQuery<TData>
  extends SecretDaoPreProposeMultipleReactQuery<Binary, TData> {
  args: {
    msg: Empty
  }
}
export interface SecretDaoPreProposeMultipleProposalSubmittedHooksQuery<TData>
  extends SecretDaoPreProposeMultipleReactQuery<HooksResponse, TData> {}
export interface SecretDaoPreProposeMultipleDepositInfoQuery<TData>
  extends SecretDaoPreProposeMultipleReactQuery<DepositInfoResponse, TData> {
  args: {
    proposalId: number
  }
}
export interface SecretDaoPreProposeMultipleConfigQuery<TData>
  extends SecretDaoPreProposeMultipleReactQuery<Config, TData> {}
export interface SecretDaoPreProposeMultipleDaoQuery<TData>
  extends SecretDaoPreProposeMultipleReactQuery<AnyContractInfo, TData> {}
export interface SecretDaoPreProposeMultipleProposalModuleQuery<TData>
  extends SecretDaoPreProposeMultipleReactQuery<AnyContractInfo, TData> {}
