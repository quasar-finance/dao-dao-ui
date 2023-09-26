import { asset_lists } from '@chain-registry/assets'

import { GenericToken, TokenType } from '@dao-dao/types'

import { getChainForChainId, getNativeTokenForChainId } from './chain'
import { concatAddressStartEnd } from './conversion'
import { getFallbackImage } from './getFallbackImage'

// Cache once loaded.
const chainAssetsMap: Record<
  string,
  | (GenericToken & {
      id: string
      description?: string
      denomAliases?: string[]
    })[]
  | undefined
> = {}
export const getChainAssets = (chainId: string) => {
  if (!chainAssetsMap[chainId]) {
    chainAssetsMap[chainId] =
      asset_lists
        .find(
          ({ chain_name }) =>
            chain_name === getChainForChainId(chainId).chain_name
        )
        ?.assets.map(
          ({
            base,
            symbol,
            logo_URIs: { png, svg, jpeg } = {},
            name,
            display,
            denom_units,
          }) => ({
            chainId,
            id: display,
            type: TokenType.Native,
            denomOrAddress: base,
            denomAliases:
              denom_units.find(({ denom }) => denom === base)?.aliases ?? [],
            symbol,
            decimals:
              denom_units.find(({ denom }) => denom === display)?.exponent ??
              denom_units.find(({ exponent }) => exponent > 0)?.exponent ??
              denom_units[0]?.exponent ??
              0,
            imageUrl: svg || png || jpeg || getFallbackImage(base),
            description: symbol === name ? undefined : name,
            // This will be wrong when this is an IBC asset.
            source: {
              chainId,
              denomOrAddress: base,
            },
          })
        )
        .sort((a, b) => a.symbol.localeCompare(b.symbol)) ?? []
  }

  return chainAssetsMap[chainId]!
}

// Native token exists if it is the native denom or any of the IBC assets.
export const nativeTokenExists = (chainId: string, denom: string) =>
  denom === getNativeTokenForChainId(chainId).denomOrAddress ||
  getChainAssets(chainId).some(({ denomOrAddress }) => denomOrAddress === denom)

export const getNativeIbcUsdc = (chainId: string) =>
  getChainAssets(chainId).find(
    ({ id, symbol }) => id === 'usdc' && symbol === 'USDC'
  ) || getChainAssets(chainId).find(({ id }) => id === 'usdc')

// Returns true if this denom is the IBC denom for USDC on the current chain.
export const isNativeIbcUsdc = (chainId: string, ibcDenom: string): boolean =>
  ibcDenom === getNativeIbcUsdc(chainId)?.denomOrAddress

// Processes symbol and converts into readable format (cut out middle and add
// ellipses) if long IBC string. Used in `TokenCard` and `TokenDepositModal`.
export const transformIbcSymbol = (
  symbol: string
): { isIbc: boolean; tokenSymbol: string; originalTokenSymbol: string } => {
  const isIbc = symbol.toLowerCase().startsWith('ibc')
  // Truncate IBC denominations to prevent overflow.
  const tokenSymbol = isIbc ? concatAddressStartEnd(symbol, 7, 3) : symbol

  return {
    isIbc,
    tokenSymbol,
    originalTokenSymbol: symbol,
  }
}
