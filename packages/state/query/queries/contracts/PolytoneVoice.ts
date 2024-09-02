import { QueryClient, UseQueryOptions } from '@tanstack/react-query'

import { SenderInfo } from '@dao-dao/types/contracts/PolytoneVoice'
import { getCosmWasmClientForChainId } from '@dao-dao/utils'

import { PolytoneVoiceQueryClient } from '../../../contracts/PolytoneVoice'
import { indexerQueries } from '../indexer'

export const polytoneVoiceQueryKeys = {
  contract: [
    {
      contract: 'polytoneVoice',
    },
  ] as const,
  address: (chainId: string, contractAddress: string) =>
    [
      {
        ...polytoneVoiceQueryKeys.contract[0],
        chainId,
        address: contractAddress,
      },
    ] as const,
  senderInfoForProxy: (
    chainId: string,
    contractAddress: string,
    args?: Record<string, unknown>
  ) =>
    [
      {
        ...polytoneVoiceQueryKeys.address(chainId, contractAddress)[0],
        method: 'sender_info_for_proxy',
        ...(args && { args }),
      },
    ] as const,
}
export const polytoneVoiceQueries = {
  senderInfoForProxy: <TData = SenderInfo>(
    queryClient: QueryClient,
    {
      chainId,
      contractAddress,
      args,
      options,
    }: PolytoneVoiceSenderInfoForProxyQuery<TData>
  ): UseQueryOptions<SenderInfo, Error, TData> => ({
    queryKey: polytoneVoiceQueryKeys.senderInfoForProxy(
      chainId,
      contractAddress,
      args
    ),
    queryFn: async () => {
      let indexerNonExistent = false
      try {
        const senderInfo = await queryClient.fetchQuery(
          indexerQueries.queryContract<SenderInfo>(queryClient, {
            chainId,
            contractAddress,
            formula: 'polytone/voice/senderInfoForProxy',
            args: {
              address: args.proxy,
            },
          })
        )
        if (senderInfo) {
          return senderInfo
        } else {
          indexerNonExistent = true
        }
      } catch (error) {
        console.error(error)
      }

      // Contract throws error if instantiator not found, so we should too if
      // the indexer query succeeds but the instantiator is not found.
      if (indexerNonExistent) {
        throw new Error('Sender info not found')
      }

      // If indexer query fails, fallback to contract query.
      return new PolytoneVoiceQueryClient(
        await getCosmWasmClientForChainId(chainId),
        contractAddress
      ).senderInfoForProxy(args)
    },
    ...options,
  }),
}
export interface PolytoneVoiceReactQuery<TResponse, TData = TResponse> {
  chainId: string
  contractAddress: string
  options?: Omit<
    UseQueryOptions<TResponse, Error, TData>,
    'queryKey' | 'queryFn' | 'initialData'
  > & {
    initialData?: undefined
  }
}
export interface PolytoneVoiceSenderInfoForProxyQuery<TData>
  extends PolytoneVoiceReactQuery<SenderInfo, TData> {
  args: {
    proxy: string
  }
}
