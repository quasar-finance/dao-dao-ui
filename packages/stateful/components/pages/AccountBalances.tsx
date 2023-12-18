import { useRouter } from 'next/router'

import { walletHexPublicKeySelector } from '@dao-dao/state'
import { useCachedLoading, useChain } from '@dao-dao/stateless'

import { WalletBalances, WalletLazyNftCard } from '../wallet'

export const AccountBalances = () => {
  const { chain_id: chainId } = useChain()
  const { query: { address } = {} } = useRouter()

  // Type-check. This should already be validated in the Wallet component.
  if (typeof address !== 'string' || !address) {
    throw new Error('Invalid address.')
  }

  const hexPublicKey = useCachedLoading(
    walletHexPublicKeySelector({
      chainId,
      walletAddress: address,
    }),
    undefined
  )

  return (
    <WalletBalances
      NftCard={WalletLazyNftCard}
      address={address}
      editable
      hexPublicKey={hexPublicKey}
    />
  )
}
