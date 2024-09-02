import { toHex } from '@cosmjs/encoding'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { profileQueries } from '@dao-dao/state'
import {
  AddChainsFunction,
  AddChainsStatus,
  LoadingData,
  OtherProfile,
  PfpkProfileUpdate,
  PfpkProfileUpdateFunction,
  UnifiedProfile,
} from '@dao-dao/types'
import {
  PFPK_API_BASE,
  SignedBody,
  getDisplayNameForChainId,
  makeCombineQueryResultsIntoLoadingData,
  makeEmptyUnifiedProfile,
  makeManuallyResolvedPromise,
  signOffChainAuth,
} from '@dao-dao/utils'

import { useQueryLoadingData } from './query/useQueryLoadingData'
import { useCfWorkerAuthPostRequest } from './useCfWorkerAuthPostRequest'
import { useRefreshProfile } from './useRefreshProfile'
import { useWallet } from './useWallet'

export type UseManageProfileOptions = {
  /**
   * Optionally specify the chain to load the profile for on the currently
   * connected wallet. A wallet has different addresses/public keys on different
   * chains, so there may be multiple profiles for the same wallet. Defaults to
   * the current chain context.
   */
  chainId?: string
}

export type UseManageProfileReturn = {
  /**
   * The current chain the profile is loading from for the connected wallet.
   */
  chainId: string
  /**
   * Whether or not the current wallet is connected. When an address is passed,
   * this will be false.
   */
  connected: boolean
  /**
   * The profile for the currently connected wallet. If not connected and no
   * address was passed, this will be in the loading state. The unified profile
   * loads data from backup sources in case profile information is missing and
   * substitutes a default profile on error.
   */
  profile: LoadingData<UnifiedProfile>
  /**
   * Refresh the profile for the currently connected wallet.
   */
  refreshProfile: () => void
  /**
   * Update profile information.
   */
  updateProfile: {
    /**
     * Whether or not the profile is loaded and ready to be updated.
     */
    ready: boolean
    /**
     * Whether or not the profile is being updated.
     */
    updating: boolean
    /**
     * Update profile information.
     */
    go: PfpkProfileUpdateFunction
  }
  /**
   * Add chains to the profile.
   */
  addChains: {
    /**
     * Whether or not the add chains process is ready.
     */
    ready: boolean
    /**
     * Add chain process status.
     */
    status: AddChainsStatus
    /**
     * Add chains to the profile.
     */
    go: AddChainsFunction
  }
  /**
   * Data required to merge profiles.
   */
  merge: {
    /**
     * Profiles on all the chains the current wallet is connected to where the
     * current chain wallet is not registered. These are all the profiles that
     * should be merged into this one if chosen.
     *
     * This may include the current chain wallet if it has not yet been added to
     * the current profile. This can occur because a public key resolves to a
     * profile even when that public key hasn't been assigned to this particular
     * chain. Thus, an address on a chain will resolve to a profile when
     * searched by public key or address, regardless of if that public
     * key/address has been added for that chain.
     */
    profilesToMerge: OtherProfile[]
    /**
     * The merge options presented to the user based on all the profiles found.
     * This combines the current profile and the other profiles, de-dupes them,
     * and prioritizes based on a few heuristics, such as a name being set and
     * the number of chains added to a profile.
     *
     * This is only populated if other profiles exist. Otherwise, this will be
     * empty.
     */
    options: OtherProfile[]
    /**
     * Whether or not merge is needed. This is equivalent to
     * `profilesToMerge.length > 0`
     */
    needsMerge: boolean
  }
}

/**
 * A hook to help manage the profile for the currently connected wallet.
 */
export const useManageProfile = ({
  chainId,
}: UseManageProfileOptions = {}): UseManageProfileReturn => {
  const { t } = useTranslation()
  const {
    address = '',
    isWalletConnected,
    chain: { chain_id: walletChainId },
    chainWallet: currentChainWallet,
    hexPublicKey: currentHexPublicKey,
  } = useWallet({
    chainId,
    loadAccount: true,
  })

  const profile = useQueryLoadingData(
    profileQueries.unified(useQueryClient(), {
      chainId: walletChainId,
      address,
    }),
    makeEmptyUnifiedProfile(walletChainId, address)
  )

  const refreshProfile = useRefreshProfile(address, profile)

  const pfpkApi = useCfWorkerAuthPostRequest(PFPK_API_BASE, '', walletChainId)

  const ready =
    !profile.loading &&
    !profile.updating &&
    // Ensure we have a profile loaded from the server. The nonce is -1 if it
    // failed to load.
    profile.data.nonce >= 0 &&
    !!currentChainWallet &&
    !currentHexPublicKey.loading &&
    pfpkApi.ready

  const [updating, setUpdating] = useState(false)
  const [updatingNonce, setUpdatingNonce] = useState<number>()
  const onUpdateRef = useRef<() => void>()

  const profileNonce = profile.loading ? -1 : profile.data.nonce
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateProfile = useCallback(
    // Delay resolving the profile update promise until the new profile is
    // loaded in state after a successful refresh.
    makeManuallyResolvedPromise(
      async (profileUpdates: Omit<PfpkProfileUpdate, 'nonce'>) => {
        if (!ready || profileNonce < 0) {
          return false
        }

        setUpdating(true)
        try {
          const profileUpdate: PfpkProfileUpdate = {
            ...profileUpdates,
            nonce: profileNonce,
          }

          await pfpkApi.postRequest(
            '/',
            {
              profile: profileUpdate,
            },
            'DAO DAO Profile | Update'
          )

          refreshProfile()

          // On success, the updating state is cleared when the promise
          // resolves.
        } catch (err) {
          setUpdating(false)

          // Rethrow error.
          throw err
        }
      },
      (resolve) => {
        // Set onUpdate handler.
        onUpdateRef.current = () => {
          resolve()
          setUpdating(false)
        }
        setUpdatingNonce(profileNonce)
      }
    ),
    [pfpkApi, profileNonce, ready, refreshProfile]
  )

  // Listen for nonce to incremenent to clear updating state, since we want the
  // new profile to be ready on the same render that we stop loading.
  useEffect(() => {
    if (updatingNonce === undefined || profile.loading) {
      return
    }

    // If nonce incremented, clear updating state and call onUpdate handler if
    // exists.
    if (profile.data.nonce > updatingNonce) {
      onUpdateRef.current?.()
      onUpdateRef.current = undefined

      setUpdatingNonce(undefined)
    }
  }, [updatingNonce, profile])

  const [addChainsStatus, setAddChainsStatus] =
    useState<AddChainsStatus>('idle')
  const addChains: AddChainsFunction = async (
    chainIds,
    { setChainStatus } = {}
  ) => {
    if (!currentChainWallet) {
      throw new Error(t('error.logInToContinue'))
    }

    // Type-check.
    if (!ready || currentHexPublicKey.loading) {
      throw new Error(t('error.loadingData'))
    }

    if (chainIds.length > 0) {
      setAddChainsStatus('chains')

      let error: unknown
      try {
        // Get chain wallets.
        const allChainWallets =
          currentChainWallet.mainWallet.getChainWalletList(false)
        const chainWallets = chainIds.map(
          (chainId) => allChainWallets.find((cw) => cw.chainId === chainId)!
        )

        // Stop if missing chain wallets.
        const missingChainWallets = chainIds.filter(
          (_, index) => !chainWallets[index]
        )
        if (missingChainWallets.length > 0) {
          throw new Error(
            t('error.unexpectedlyMissingChains', {
              chains: missingChainWallets
                .map((chainId) => getDisplayNameForChainId(chainId))
                .join(', '),
            })
          )
        }

        // Load nonce from API.
        const nonce = await pfpkApi.getNonce()

        const allowances: SignedBody<{}>[] = []

        // For each chain, sign allowance.
        for (const chainWallet of chainWallets) {
          setChainStatus?.(chainWallet.chainId, 'loading')

          // Make sure the chain is connected.
          if (!chainWallet.isWalletConnected) {
            await chainWallet.connect(false)
          }

          // If still not connected, error.
          if (!chainWallet.isWalletConnected) {
            throw new Error(t('error.failedToConnect'))
          }

          // Get the account public key.
          const { address, pubkey: pubkeyData } =
            (await chainWallet.client.getAccount?.(chainWallet.chainId)) ?? {}
          if (!address || !pubkeyData) {
            throw new Error(t('error.failedToGetAccountFromWallet'))
          }

          const offlineSignerAmino =
            await chainWallet.client.getOfflineSignerAmino?.(
              chainWallet.chainId
            )
          // If no amino signer, error that wallet is unsupported. This should
          // only happen if there's no amino signer getter defined.
          if (!offlineSignerAmino) {
            throw new Error(t('error.unsupportedWallet'))
          }

          const hexPublicKey = toHex(pubkeyData)

          // Sign allowance for main wallet to register this public key for this
          // chain.
          const body = await signOffChainAuth({
            type: 'DAO DAO Profile | Add Chain Allowance',
            nonce,
            chainId: chainWallet.chainId,
            address,
            hexPublicKey,
            data: {
              allow: currentHexPublicKey.data,
              chainIds: [chainWallet.chainId],
            },
            offlineSignerAmino,
            // No signature required if we're registering a new chain for the
            // same public key already attached to the profile, which is the
            // public key signing the entire registration request.
            generateOnly: hexPublicKey === currentHexPublicKey.data,
          })

          allowances.push(body)

          setChainStatus?.(chainWallet.chainId, 'done')
        }

        setAddChainsStatus('registering')

        // Submit allowances. Throws error on failure.
        await pfpkApi.postRequest(
          '/register',
          {
            publicKeys: allowances,
          },
          'DAO DAO Profile | Add Chains'
        )
      } catch (err) {
        // Reset all chain statuses on error.
        if (setChainStatus) {
          chainIds.forEach((chainId) => setChainStatus?.(chainId, 'idle'))
        }

        // Set error to be thrown after finally block.
        error = err
      } finally {
        // Refresh profile.
        refreshProfile()

        // Reset status.
        setAddChainsStatus('idle')
      }

      // Throw error on failure. This allows the finally block above to run by
      // throwing the error after the entire try clause.
      if (error) {
        throw error
      }
    }
  }

  // Find whichever chain wallets are currently connected so we can check all
  // the profiles attached to the current wallet. Different chains may use
  // different public keys, so we need to check all of them in order to prompt
  // to merge them. Also check the same chain as the current chain wallet in
  // case the current chain has not yet been added to the profile. Profiles
  // resolve by public key / bech32 hash, which means a profile may resolve for
  // an address even if the address has not yet been added. We should still
  // prompt to add the current chain wallet to its profile if it's missing.
  const otherConnectedChainWallets = (
    currentChainWallet?.mainWallet.getChainWalletList() || []
  ).filter(
    (chainWallet) => !!chainWallet.isWalletConnected && !!chainWallet.address
  )
  const queryClient = useQueryClient()
  const otherChainWalletProfiles = useQueries({
    queries: otherConnectedChainWallets.map((chainWallet) =>
      profileQueries.unified(queryClient, {
        chainId: chainWallet.chainId,
        address: chainWallet.address!,
      })
    ),
    combine: makeCombineQueryResultsIntoLoadingData<UnifiedProfile>({
      firstLoad: 'none',
    }),
  })

  const merge: UseManageProfileReturn['merge'] = useMemo(() => {
    // Get all profiles attached to this wallet that are different from the
    // current chain wallet profile.
    const profilesToMerge =
      currentChainWallet &&
      !profile.loading &&
      !otherChainWalletProfiles.loading
        ? otherChainWalletProfiles.data.flatMap((chainProfile) => {
            if (
              // If profile exists, UUID matches current chain wallet profile
              // and this chain wallet has been added to the profile, ignore. If
              // profile does not exist or chain has not been explicitly added,
              // we want to merge it into the current profile.
              chainProfile.uuid &&
              chainProfile.uuid === profile.data.uuid &&
              profile.data.chains[chainProfile.source.chainId]?.address ===
                chainProfile.source.address
            ) {
              return []
            }

            return {
              ...chainProfile.source,
              profile: chainProfile,
            }
          })
        : []

    // Merge options are only needed if other profiles exist.
    let options: OtherProfile[] = []
    if (profilesToMerge.length > 0) {
      options = [
        // Current chain wallet profile.
        ...(profile.loading
          ? []
          : [
              {
                chainId: walletChainId,
                address,
                profile: profile.data,
              },
            ]),
        // Other profiles attached to this wallet that differ from the current
        // chain wallet.
        ...profilesToMerge,
      ]
        .sort((a, b) => {
          // Priority:
          // - name set
          // - NFT set
          // - number of chains
          if (a.profile.name && !b.profile.name) {
            return -1
          } else if (!a.profile.name && b.profile.name) {
            return 1
          } else if (a.profile.nft && !b.profile.nft) {
            return -1
          } else if (!a.profile.nft && b.profile.nft) {
            return 1
          }

          const aChains = Object.keys(a.profile.chains).length
          const bChains = Object.keys(b.profile.chains).length
          if (aChains > bChains) {
            return -1
          } else if (aChains < bChains) {
            return 1
          }

          // If all else equal, sort by nonce as a heuristic for which is older.
          return b.profile.nonce - a.profile.nonce
        })
        // Remove duplicates. Since they are all the same profile, we only need
        // one.
        .reduce((acc, otherProfile) => {
          if (
            !acc.some(
              ({ chainId, address, profile }) =>
                // Check same chain/address.
                (chainId === otherProfile.chainId &&
                  address === otherProfile.address) ||
                // Check same profile UUID.
                (!!profile.uuid && profile.uuid === otherProfile.profile.uuid)
            )
          ) {
            acc.push(otherProfile)
          }

          return acc
        }, [] as OtherProfile[])

      // If any profiles in the list have been used before, remove any that
      // haven't.
      if (options.some(({ profile }) => profile.nonce > 0)) {
        options = options.filter(({ profile }) => profile.nonce > 0)
      }
      // If no profile in the list has been used before, remove all but one
      // since it doesn't matter which is chosen.
      else {
        options = options.slice(0, 1)
      }
    }

    return {
      profilesToMerge,
      options,
      needsMerge: profilesToMerge.length > 0,
    }
  }, [
    address,
    currentChainWallet,
    otherChainWalletProfiles,
    profile,
    walletChainId,
  ])

  return {
    chainId: walletChainId,
    // Connected is only relevant when using the currently connected wallet. If
    // an address is passed, set connected to false.
    connected: address ? false : isWalletConnected,
    profile,
    refreshProfile,
    updateProfile: {
      ready,
      updating,
      go: updateProfile,
    },
    addChains: {
      ready,
      status: addChainsStatus,
      go: addChains,
    },
    merge,
  }
}
