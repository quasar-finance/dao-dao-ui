import { fromBase64 } from '@cosmjs/encoding'
import { Coin } from '@cosmjs/stargate'
import { QueryClient, queryOptions, skipToken } from '@tanstack/react-query'
import uniq from 'lodash.uniq'

import {
  ChainId,
  Delegation,
  GovProposalVersion,
  GovProposalWithDecodedContent,
  NativeDelegationInfo,
  ProposalV1,
  ProposalV1Beta1,
  UnbondingDelegation,
  Validator,
} from '@dao-dao/types'
import { ModuleAccount } from '@dao-dao/types/protobuf/codegen/cosmos/auth/v1beta1/auth'
import { Metadata } from '@dao-dao/types/protobuf/codegen/cosmos/bank/v1beta1/bank'
import { DecCoin } from '@dao-dao/types/protobuf/codegen/cosmos/base/v1beta1/coin'
import { ProposalStatus } from '@dao-dao/types/protobuf/codegen/cosmos/gov/v1beta1/gov'
import {
  NONEXISTENT_QUERY_ERROR_SUBSTRINGS,
  cosmosProtoRpcClientRouter,
  cosmosSdkVersionIs46OrHigher,
  cosmosSdkVersionIs47OrHigher,
  cosmosValidatorToValidator,
  cosmwasmProtoRpcClientRouter,
  decodeGovProposal,
  feemarketProtoRpcClientRouter,
  getAllRpcResponse,
  getCosmWasmClientForChainId,
  getNativeTokenForChainId,
  isSecretNetwork,
  isValidBech32Address,
  osmosisProtoRpcClientRouter,
  secretCosmWasmClientRouter,
  stargateClientRouter,
} from '@dao-dao/utils'

import {
  SearchGovProposalsOptions,
  searchGovProposals,
} from '../../indexer/search'

/**
 * Fetch the module address associated with the specified name.
 */
const fetchChainModuleAddress = async ({
  chainId,
  name,
}: {
  chainId: string
  name: string
}): Promise<string> => {
  const client = await cosmosProtoRpcClientRouter.connect(chainId)

  let account: ModuleAccount | undefined
  try {
    const response = await client.auth.v1beta1.moduleAccountByName({
      name,
    })
    account = response?.account
  } catch (err) {
    // Some chains don't support getting a module account by name directly, so
    // fallback to getting all module accounts.
    if (err instanceof Error && err.message.includes('unknown query path')) {
      const { accounts } = await client.auth.v1beta1.moduleAccounts({})
      account = accounts.find(
        (acc) =>
          'name' in acc && (acc as unknown as ModuleAccount).name === name
      ) as unknown as ModuleAccount | undefined
    } else {
      // Rethrow other errors.
      throw err
    }
  }

  if (!account) {
    throw new Error(`Failed to find ${name} module address.`)
  }

  return 'baseAccount' in account ? account.baseAccount?.address ?? '' : ''
}

/**
 * Fetch the module name associated with the specified address. Returns null if
 * not a module account.
 */
const fetchChainModuleName = async ({
  chainId,
  address,
}: {
  chainId: string
  address: string
}): Promise<string | null> => {
  const client = await cosmosProtoRpcClientRouter.connect(chainId)

  try {
    const { account } = await client.auth.v1beta1.account({
      address,
    })

    if (!account) {
      return null
    }

    // If not decoded automatically...
    if (account.typeUrl === ModuleAccount.typeUrl) {
      return ModuleAccount.decode(account.value).name

      // If decoded automatically...
    } else if (account.$typeUrl === ModuleAccount.typeUrl) {
      return (account as unknown as ModuleAccount).name
    }
  } catch (err) {
    // If no account found, return null.
    if (
      err instanceof Error &&
      err.message.includes('not found: key not found')
    ) {
      return null
    }

    // Rethrow other errors.
    throw err
  }

  return null
}

/**
 * Check whether or not the address is a chain module, optionally with a
 * specific name.
 */
export const isAddressModule = async (
  queryClient: QueryClient,
  {
    chainId,
    address,
    moduleName,
  }: {
    chainId: string
    address: string
    /**
     * If defined, check that the module address matches the specified name.
     */
    moduleName?: string
  }
): Promise<boolean> => {
  if (!isValidBech32Address(address)) {
    return false
  }

  try {
    const name = await queryClient.fetchQuery(
      chainQueries.moduleName({
        chainId,
        address,
      })
    )

    // Null if not a module.
    if (!name) {
      return false
    }

    // If name to check provided, check it. Otherwise, return true.
    return !moduleName || name === moduleName
  } catch (err) {
    // If invalid address, return false. Should never happen because of the
    // check at the beginning, but just in case.
    if (
      err instanceof Error &&
      err.message.includes('decoding bech32 failed')
    ) {
      return false
    }

    // Rethrow other errors.
    throw err
  }
}

/**
 * Fetch the timestamp for a given block height.
 */
export const fetchBlockTimestamp = async ({
  chainId,
  height,
}: {
  chainId: string
  height: number
}): Promise<number> => {
  const client = await getCosmWasmClientForChainId(chainId)
  return new Date((await client.getBlock(height)).header.time).getTime()
}

/**
 * Fetch the native token balance for a given address.
 */
export const fetchNativeBalance = async ({
  chainId,
  address,
}: {
  chainId: string
  address: string
}): Promise<Coin> => {
  const client = await stargateClientRouter.connect(chainId)
  return await client.getBalance(
    address,
    getNativeTokenForChainId(chainId).denomOrAddress
  )
}

/**
 * Fetch the sum of native tokens staked across all validators.
 */
export const fetchNativeStakedBalance = async ({
  chainId,
  address,
}: {
  chainId: string
  address: string
}): Promise<Coin> => {
  // Neutron does not have staking.
  if (
    chainId === ChainId.NeutronMainnet ||
    chainId === ChainId.NeutronTestnet
  ) {
    return {
      amount: '0',
      denom: getNativeTokenForChainId(chainId).denomOrAddress,
    }
  }

  const client = await stargateClientRouter.connect(chainId)
  const balance = await client.getBalanceStaked(address)

  return (
    balance ?? {
      amount: '0',
      denom: getNativeTokenForChainId(chainId).denomOrAddress,
    }
  )
}

/**
 * Fetch the total native tokens staked across the whole chain.
 */
export const fetchTotalNativeStakedBalance = async ({
  chainId,
}: {
  chainId: string
}): Promise<string> => {
  // Neutron does not have staking.
  if (
    chainId === ChainId.NeutronMainnet ||
    chainId === ChainId.NeutronTestnet
  ) {
    return '0'
  }

  const client = await cosmosProtoRpcClientRouter.connect(chainId)
  const { pool } = await client.staking.v1beta1.pool()

  if (!pool) {
    throw new Error('No staking pool found')
  }

  return pool.bondedTokens
}

/**
 * Fetch native delegation info.
 */
export const fetchNativeDelegationInfo = async (
  queryClient: QueryClient,
  {
    chainId,
    address,
  }: {
    chainId: string
    address: string
  }
): Promise<NativeDelegationInfo> => {
  // Neutron does not support staking.
  if (
    chainId === ChainId.NeutronMainnet ||
    chainId === ChainId.NeutronTestnet
  ) {
    return {
      delegations: [],
      unbondingDelegations: [],
    }
  }

  const client = await cosmosProtoRpcClientRouter.connect(chainId)

  try {
    const delegations = await getAllRpcResponse(
      client.staking.v1beta1.delegatorDelegations,
      {
        delegatorAddr: address,
        pagination: undefined,
      },
      'delegationResponses'
    )
    const rewards = (
      await client.distribution.v1beta1.delegationTotalRewards({
        delegatorAddress: address,
      })
    ).rewards
    const unbondingDelegations = await getAllRpcResponse(
      client.staking.v1beta1.delegatorUnbondingDelegations,
      {
        delegatorAddr: address,
        pagination: undefined,
      },
      'unbondingResponses'
    )

    const uniqueValidators = uniq([
      ...delegations.flatMap(
        ({ delegation }) => delegation?.validatorAddress || []
      ),
      ...unbondingDelegations.map(({ validatorAddress }) => validatorAddress),
    ])
    const validators = await Promise.all(
      uniqueValidators.map((address) =>
        queryClient.fetchQuery(
          chainQueries.validator({
            chainId,
            address,
          })
        )
      )
    )

    return {
      delegations: delegations.flatMap(
        ({
          delegation: { validatorAddress: address } = {
            validatorAddress: '',
          },
          balance: delegationBalance,
        }): Delegation | [] => {
          if (
            !delegationBalance ||
            delegationBalance.denom !==
              getNativeTokenForChainId(chainId).denomOrAddress
          ) {
            return []
          }

          const validator = validators.find((v) => v.address === address)
          let pendingReward = rewards
            .find(({ validatorAddress }) => validatorAddress === address)
            ?.reward.find(
              ({ denom }) =>
                denom === getNativeTokenForChainId(chainId).denomOrAddress
            )

          if (!validator || !pendingReward) {
            return []
          }

          // Truncate.
          pendingReward.amount = pendingReward.amount.split('.')[0]

          return {
            validator,
            delegated: delegationBalance,
            pendingReward,
          }
        }
      ),

      // Only returns native token unbondings, no need to check.
      unbondingDelegations: unbondingDelegations.flatMap(
        ({ validatorAddress, entries }) => {
          const validator = validators.find(
            (v) => v.address === validatorAddress
          )
          if (!validator) {
            return []
          }

          return entries.map(
            ({
              creationHeight,
              completionTime,
              balance,
            }): UnbondingDelegation => ({
              validator,
              balance: {
                amount: balance,
                denom: getNativeTokenForChainId(chainId).denomOrAddress,
              },
              startedAtHeight: Number(creationHeight),
              finishesAt: completionTime || new Date(0),
            })
          )
        }
      ),
    }
  } catch (err) {
    // Fails on chains without staking.
    if (
      err instanceof Error &&
      NONEXISTENT_QUERY_ERROR_SUBSTRINGS.some((substring) =>
        (err as Error).message.includes(substring)
      )
    ) {
      return {
        delegations: [],
        unbondingDelegations: [],
      }
    }

    // Rethrow error if anything else, like a network error.
    throw err
  }
}

/**
 * Fetch a validator.
 */
export const fetchValidator = async ({
  chainId,
  address,
}: {
  chainId: string
  address: string
}): Promise<Validator> => {
  const client = await cosmosProtoRpcClientRouter.connect(chainId)

  const { validator } = await client.staking.v1beta1.validator({
    validatorAddr: address,
  })
  if (!validator) {
    throw new Error('Validator not found')
  }

  return cosmosValidatorToValidator(validator)
}

/**
 * Fetch the dynamic gas price for the native fee token.
 */
export const fetchDynamicGasPrice = async ({
  chainId,
}: {
  chainId: string
}): Promise<DecCoin> => {
  // Osmosis uses osmosis.txfees module.
  if (
    chainId === ChainId.OsmosisMainnet ||
    chainId === ChainId.OsmosisTestnet
  ) {
    const client = await osmosisProtoRpcClientRouter.connect(chainId)
    const { baseFee } = await client.txfees.v1beta1.getEipBaseFee()
    return {
      amount: baseFee,
      denom: getNativeTokenForChainId(chainId).denomOrAddress,
    }
  }

  // Neutron, Cosmos Hub, and probably others use Skip's feemarket module.
  const client = await feemarketProtoRpcClientRouter.connect(chainId)
  const { price } = await client.feemarket.v1.gasPrice({
    denom: getNativeTokenForChainId(chainId).denomOrAddress,
  })

  if (!price) {
    throw new Error('No dynamic gas price found')
  }

  return price
}

/**
 * Fetch the wasm contract-level admin for a contract.
 */
export const fetchWasmContractAdmin = async ({
  chainId,
  address,
}: {
  chainId: string
  address: string
}): Promise<string | null> => {
  if (isSecretNetwork(chainId)) {
    const client = await secretCosmWasmClientRouter.connect(chainId)
    return (await client.getContract(address))?.admin ?? null
  }

  // CosmWasmClient.getContract is not compatible with Terra Classic for some
  // reason, so use protobuf query directly.
  const client = await cosmwasmProtoRpcClientRouter.connect(chainId)
  return (
    (
      await client.wasm.v1.contractInfo({
        address,
      })
    )?.contractInfo?.admin ?? null
  )
}

/**
 * Fetch the on-chain metadata for a denom if it exists. Returns null if denom
 * not found. This likely exists for token factory denoms.
 */
export const fetchDenomMetadata = async ({
  chainId,
  denom,
}: {
  chainId: string
  denom: string
}): Promise<{
  metadata: Metadata
  preferredSymbol: string
  preferredDecimals: number
} | null> => {
  const client = await cosmosProtoRpcClientRouter.connect(chainId)
  try {
    const { metadata } = await client.bank.v1beta1.denomMetadata({ denom })

    if (metadata) {
      const { base, denomUnits, symbol, display } = metadata

      // If display is equal to the base, use the symbol denom unit if
      // available. This fixes the case where display was not updated even
      // though a nonzero exponent was created.
      const searchDenom = display === base ? symbol : display

      const displayDenom =
        denomUnits.find(({ denom }) => denom === searchDenom) ??
        denomUnits.find(({ denom }) => denom === display) ??
        denomUnits.find(({ exponent }) => exponent > 0) ??
        denomUnits[0]

      const extractedSymbol = displayDenom
        ? displayDenom.denom.startsWith('factory/')
          ? displayDenom.denom.split('/').pop()!
          : displayDenom.denom
        : metadata.symbol

      return {
        metadata,
        // If factory denom, extract symbol at the end.
        preferredSymbol:
          // convert `utoken` to `TOKEN`
          (extractedSymbol.startsWith('u') &&
          extractedSymbol.toLowerCase() === extractedSymbol
            ? extractedSymbol.substring(1).toUpperCase()
            : extractedSymbol) || denom,
        preferredDecimals:
          displayDenom?.exponent ||
          (chainId === ChainId.KujiraMainnet ||
          chainId === ChainId.KujiraTestnet
            ? // Kujira does not let setting token metadata, so default to 6.
              6
            : 0),
      }
    }
  } catch (err) {
    // If denom not found, return null.
    if (err instanceof Error && err.message.includes('key not found')) {
      return null
    }

    // Rethrow other errors.
    throw err
  }

  return null
}

/**
 * Fetch the cosmos-sdk version of a chain.
 */
export const fetchChainCosmosSdkVersion = async ({
  chainId,
}: {
  chainId: string
}): Promise<string> => {
  const protoClient = await cosmosProtoRpcClientRouter.connect(chainId)

  const { applicationVersion } =
    await protoClient.base.tendermint.v1beta1.getNodeInfo()

  // Remove `v` prefix.
  return applicationVersion?.cosmosSdkVersion.slice(1) || '0.0.0'
}

/**
 * Fetch whether or not a chain supports the v1 gov module.
 */
export const fetchChainSupportsV1GovModule = async (
  queryClient: QueryClient,
  {
    chainId,
    require47 = false,
  }: {
    chainId: string
    /**
     * Whether or not v0.47 or higher is required. V1 gov is supported by
     * v0.46+, but some other things, like unified gov params, are supported
     * only on v0.47+.
     *
     * Defaults to false.
     */
    require47?: boolean
  }
): Promise<boolean> => {
  const cosmosSdkVersion = await queryClient.fetchQuery(
    chainQueries.cosmosSdkVersion({ chainId })
  )

  const checker = require47
    ? cosmosSdkVersionIs47OrHigher
    : cosmosSdkVersionIs46OrHigher
  if (!checker(cosmosSdkVersion)) {
    return false
  }

  const client = await cosmosProtoRpcClientRouter.connect(chainId)

  // Double-check by testing a v1 gov route.
  try {
    await client.gov.v1.params({
      paramsType: 'voting',
    })
    return true
  } catch {
    return false
  }
}

/**
 * Search chain governance proposals and decode their content.
 */
export const searchAndDecodeGovProposals = async (
  queryClient: QueryClient,
  options: SearchGovProposalsOptions
): Promise<{
  proposals: GovProposalWithDecodedContent[]
  total: number
}> => {
  const [supportsV1Gov, { results, total }] = await Promise.all([
    queryClient.fetchQuery(
      chainQueries.supportsV1GovModule(queryClient, {
        chainId: options.chainId,
      })
    ),
    queryClient.fetchQuery(chainQueries.searchGovProposals(options)),
  ])

  const proposals = (
    await Promise.allSettled(
      results.map(async ({ value: { id, data } }) =>
        decodeGovProposal(
          options.chainId,
          supportsV1Gov
            ? {
                version: GovProposalVersion.V1,
                id: BigInt(id),
                proposal: ProposalV1.decode(fromBase64(data)),
              }
            : {
                version: GovProposalVersion.V1_BETA_1,
                id: BigInt(id),
                proposal: ProposalV1Beta1.decode(
                  fromBase64(data),
                  undefined,
                  true
                ),
              }
        )
      )
    )
  ).flatMap((p) => (p.status === 'fulfilled' ? p.value : []))

  return {
    proposals,
    total,
  }
}

/**
 * Fetch the governance proposals for a chain, defaulting to those that are
 * currently open for voting.
 */
export const fetchGovProposals = async (
  queryClient: QueryClient,
  {
    chainId,
    status,
    offset,
    limit,
  }: {
    chainId: string
    status?: ProposalStatus
    offset?: number
    limit?: number
  }
): Promise<{
  proposals: GovProposalWithDecodedContent[]
  total: number
}> => {
  const indexerProposals = await queryClient
    .fetchQuery(
      chainQueries.searchAndDecodeGovProposals(queryClient, {
        chainId,
        status,
        offset,
        limit,
      })
    )
    .catch(() => undefined)

  if (indexerProposals?.proposals.length) {
    return indexerProposals
  }

  // Fallback to querying chain if indexer failed.
  const [client, supportsV1Gov] = await Promise.all([
    cosmosProtoRpcClientRouter.connect(chainId),
    queryClient.fetchQuery(
      chainQueries.supportsV1GovModule(queryClient, {
        chainId,
      })
    ),
  ])

  let v1Proposals: ProposalV1[] | undefined
  let v1Beta1Proposals: ProposalV1Beta1[] | undefined
  let total = 0

  if (supportsV1Gov) {
    try {
      if (limit === undefined && offset === undefined) {
        v1Proposals =
          (await getAllRpcResponse(
            client.gov.v1.proposals,
            {
              proposalStatus:
                status || ProposalStatus.PROPOSAL_STATUS_UNSPECIFIED,
              voter: '',
              depositor: '',
              pagination: undefined,
            },
            'proposals',
            true
          )) || []
        total = v1Proposals.length
      } else {
        const response = await client.gov.v1.proposals({
          proposalStatus: status || ProposalStatus.PROPOSAL_STATUS_UNSPECIFIED,
          voter: '',
          depositor: '',
          pagination: {
            key: new Uint8Array(),
            offset: BigInt(offset || 0),
            limit: BigInt(limit || 0),
            countTotal: true,
            reverse: true,
          },
        })
        v1Proposals = response.proposals
        total = Number(response.pagination?.total || 0)
      }
    } catch (err) {
      // Fallback to v1beta1 query if v1 not supported.
      if (
        !(err instanceof Error) ||
        !err.message.includes('unknown query path')
      ) {
        // Rethrow other errors.
        throw err
      }
    }
  }

  if (!v1Proposals) {
    if (limit === undefined && offset === undefined) {
      v1Beta1Proposals =
        (await getAllRpcResponse(
          client.gov.v1beta1.proposals,
          {
            proposalStatus:
              status || ProposalStatus.PROPOSAL_STATUS_UNSPECIFIED,
            voter: '',
            depositor: '',
            pagination: undefined,
          },
          'proposals',
          true,
          true
        )) || []
      total = v1Beta1Proposals.length
    } else {
      const response = await client.gov.v1beta1.proposals(
        {
          proposalStatus: status || ProposalStatus.PROPOSAL_STATUS_UNSPECIFIED,
          voter: '',
          depositor: '',
          pagination: {
            key: new Uint8Array(),
            offset: BigInt(offset || 0),
            limit: BigInt(limit || 0),
            countTotal: true,
            reverse: true,
          },
        },
        true
      )
      v1Beta1Proposals = response.proposals
      total = Number(response.pagination?.total || 0)
    }
  }

  const proposals = await Promise.all([
    ...(v1Beta1Proposals || []).map((proposal) =>
      decodeGovProposal(chainId, {
        version: GovProposalVersion.V1_BETA_1,
        id: proposal.proposalId,
        proposal,
      })
    ),
    ...(v1Proposals || []).map((proposal) =>
      decodeGovProposal(chainId, {
        version: GovProposalVersion.V1,
        id: proposal.id,
        proposal,
      })
    ),
  ])

  return {
    proposals,
    total,
  }
}

export const chainQueries = {
  /**
   * Fetch the module address associated with the specified name.
   */
  moduleAddress: (options: Parameters<typeof fetchChainModuleAddress>[0]) =>
    queryOptions({
      queryKey: ['chain', 'moduleAddress', options],
      queryFn: () => fetchChainModuleAddress(options),
    }),
  /**
   * Fetch the module name associated with the specified address. Returns null
   * if not a module account.
   */
  moduleName: (options: Parameters<typeof fetchChainModuleName>[0]) =>
    queryOptions({
      queryKey: ['chain', 'moduleName', options],
      queryFn: () => fetchChainModuleName(options),
    }),
  /**
   * Check whether or not the address is a chain module, optionally with a
   * specific name.
   */
  isAddressModule: (
    queryClient: QueryClient,
    options: Parameters<typeof isAddressModule>[1]
  ) =>
    queryOptions({
      queryKey: ['chain', 'isAddressModule', options],
      queryFn: () => isAddressModule(queryClient, options),
    }),
  /**
   * Fetch the timestamp for a given block height.
   */
  blockTimestamp: (options: Parameters<typeof fetchBlockTimestamp>[0]) =>
    queryOptions({
      queryKey: ['chain', 'blockTimestamp', options],
      queryFn: () => fetchBlockTimestamp(options),
    }),
  /**
   * Fetch the native token balance for a given address.
   */
  nativeBalance: (options?: Parameters<typeof fetchNativeBalance>[0]) =>
    queryOptions({
      queryKey: ['chain', 'nativeBalance', options],
      queryFn: options ? () => fetchNativeBalance(options) : skipToken,
    }),
  /**
   * Fetch the sum of native tokens staked across all validators.
   */
  nativeStakedBalance: (
    options?: Parameters<typeof fetchNativeStakedBalance>[0]
  ) =>
    queryOptions({
      queryKey: ['chain', 'nativeStakedBalance', options],
      queryFn: options ? () => fetchNativeStakedBalance(options) : skipToken,
    }),
  /**
   * Fetch the total native tokens staked across the whole chain.
   */
  totalNativeStakedBalance: (
    options: Parameters<typeof fetchTotalNativeStakedBalance>[0]
  ) =>
    queryOptions({
      queryKey: ['chain', 'totalNativeStakedBalance', options],
      queryFn: () => fetchTotalNativeStakedBalance(options),
    }),
  /**
   * Fetch native delegation info.
   */
  nativeDelegationInfo: (
    queryClient: QueryClient,
    options: Parameters<typeof fetchNativeDelegationInfo>[1]
  ) =>
    queryOptions({
      queryKey: ['chain', 'nativeDelegationInfo', options],
      queryFn: () => fetchNativeDelegationInfo(queryClient, options),
    }),
  /**
   * Fetch a validator.
   */
  validator: (options: Parameters<typeof fetchValidator>[0]) =>
    queryOptions({
      queryKey: ['chain', 'validator', options],
      queryFn: () => fetchValidator(options),
    }),
  /**
   * Fetch the dynamic gas price for the native fee token.
   */
  dynamicGasPrice: (options: Parameters<typeof fetchDynamicGasPrice>[0]) =>
    queryOptions({
      queryKey: ['chain', 'dynamicGasPrice', options],
      queryFn: () => fetchDynamicGasPrice(options),
    }),
  /**
   * Fetch the wasm contract-level admin for a contract.
   */
  wasmContractAdmin: (options: Parameters<typeof fetchWasmContractAdmin>[0]) =>
    queryOptions({
      queryKey: ['chain', 'wasmContractAdmin', options],
      queryFn: () => fetchWasmContractAdmin(options),
    }),
  /**
   * Fetch the on-chain metadata for a denom if it exists.
   */
  denomMetadata: (options: Parameters<typeof fetchDenomMetadata>[0]) =>
    queryOptions({
      queryKey: ['chain', 'denomMetadata', options],
      queryFn: () => fetchDenomMetadata(options),
    }),
  /**
   * Fetch the cosmos-sdk version of a chain.
   */
  cosmosSdkVersion: (
    options: Parameters<typeof fetchChainCosmosSdkVersion>[0]
  ) =>
    queryOptions({
      queryKey: ['chain', 'cosmosSdkVersion', options],
      queryFn: () => fetchChainCosmosSdkVersion(options),
    }),
  /**
   * Fetch whether or not a chain supports the v1 gov module.
   */
  supportsV1GovModule: (
    queryClient: QueryClient,
    options: Parameters<typeof fetchChainSupportsV1GovModule>[1]
  ) =>
    queryOptions({
      queryKey: ['chain', 'supportsV1GovModule', options],
      queryFn: () => fetchChainSupportsV1GovModule(queryClient, options),
    }),
  /**
   * Search chain governance proposals.
   */
  searchGovProposals: (options: SearchGovProposalsOptions) =>
    queryOptions({
      queryKey: ['chain', 'searchGovProposals', options],
      queryFn: () => searchGovProposals(options),
    }),
  /**
   * Search chain governance proposals and decode their content.
   */
  searchAndDecodeGovProposals: (
    queryClient: QueryClient,
    options: Parameters<typeof searchAndDecodeGovProposals>[1]
  ) =>
    queryOptions({
      queryKey: ['chain', 'searchAndDecodeGovProposals', options],
      queryFn: () => searchAndDecodeGovProposals(queryClient, options),
    }),
  /**
   * Fetch the governance proposals for a chain, defaulting to those that are
   * currently open for voting.
   */
  govProposals: (
    queryClient: QueryClient,
    options: Parameters<typeof fetchGovProposals>[1]
  ) =>
    queryOptions({
      queryKey: ['chain', 'govProposals', options],
      queryFn: () => fetchGovProposals(queryClient, options),
    }),
}
