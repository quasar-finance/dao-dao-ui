import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate'
import { toHex } from '@cosmjs/encoding'
import { useQueryClient } from '@tanstack/react-query'
import cloneDeep from 'lodash.clonedeep'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useRecoilState, useSetRecoilState } from 'recoil'

import {
  makeGetSignerOptions,
  meTransactionAtom,
  refreshSavedTxsAtom,
  savedTxsSelector,
  temporarySavedTxsAtom,
} from '@dao-dao/state'
import { useLoadedActionsAndCategories } from '@dao-dao/stateful/actions'
import {
  ProfileActionsProps,
  ProfileActions as StatelessProfileActions,
  useCachedLoading,
  useHoldingKey,
} from '@dao-dao/stateless'
import {
  AccountTxForm,
  AccountTxSave,
  cwMsgToEncodeObject,
} from '@dao-dao/types'
import {
  CHAIN_GAS_MULTIPLIER,
  KVPK_API_BASE,
  ME_SAVED_TX_PREFIX,
  decodeJsonFromBase64,
  getRpcForChainId,
  objectMatchesStructure,
  processError,
} from '@dao-dao/utils'

import { useCfWorkerAuthPostRequest, useWallet } from '../../hooks'
import { SuspenseLoader } from '../SuspenseLoader'
import { WalletChainSwitcher } from '../wallet'

export const ProfileActions = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const {
    address: walletAddress = '',
    hexPublicKey,
    getOfflineSignerAmino,
    getOfflineSignerDirect,
    chain,
  } = useWallet({
    loadAccount: true,
  })

  const { loadedActions, categories } = useLoadedActionsAndCategories()

  const [_meTransactionAtom, setWalletTransactionAtom] = useRecoilState(
    meTransactionAtom(chain.chain_id)
  )

  const formMethods = useForm<AccountTxForm>({
    mode: 'onChange',
    // Don't clone every render.
    defaultValues: useMemo(
      () => cloneDeep(_meTransactionAtom),
      [_meTransactionAtom]
    ),
  })
  // Trigger validation on first render, in case loaded from localStorage.
  useEffect(() => {
    formMethods.trigger()
  }, [formMethods])

  // Load from prefill query.
  const router = useRouter()
  useEffect(() => {
    const potentialPrefill = router.query.prefill
    if (typeof potentialPrefill !== 'string' || !potentialPrefill) {
      return
    }

    // Try to parse as JSON.
    let prefillData
    try {
      prefillData = JSON.parse(potentialPrefill)
    } catch (error) {
      console.error(error)
    }

    // Try to parse as base64.
    if (!prefillData) {
      try {
        prefillData = decodeJsonFromBase64(potentialPrefill)
      } catch (error) {
        console.error(error)
      }
    }

    // If prefillData looks valid, use it.
    if (
      objectMatchesStructure(prefillData, {
        actions: {},
      })
    ) {
      formMethods.reset(prefillData)
    }
  }, [formMethods, router.query])

  const meTransaction = formMethods.watch()
  // Debounce saving latest data to atom and thus localStorage every second.
  useEffect(() => {
    // Deep clone to prevent values from becoming readOnly.
    const timeout = setTimeout(
      () => setWalletTransactionAtom(cloneDeep(meTransaction)),
      1000
    )
    return () => clearTimeout(timeout)
  }, [setWalletTransactionAtom, meTransaction])

  const holdingAltForDirectSign = useHoldingKey({ key: 'alt' })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [txHash, setTxHash] = useState('')
  const execute: ProfileActionsProps['execute'] = useCallback(
    async (data) => {
      if (!walletAddress) {
        setError(t('error.logInToContinue'))
        return
      }

      setLoading(true)
      setError('')
      setTxHash('')

      try {
        const signer = holdingAltForDirectSign
          ? getOfflineSignerDirect()
          : getOfflineSignerAmino()

        const signingCosmWasmClient =
          await SigningCosmWasmClient.connectWithSigner(
            getRpcForChainId(chain.chain_id),
            signer,
            makeGetSignerOptions(queryClient)(chain)
          )

        const encodeObjects = data.map((msg) =>
          cwMsgToEncodeObject(chain.chain_id, msg, walletAddress)
        )
        const tx = await signingCosmWasmClient.signAndBroadcast(
          walletAddress,
          encodeObjects,
          CHAIN_GAS_MULTIPLIER
        )

        toast.success(t('success.transactionExecuted'))
        setTxHash(tx.transactionHash)
      } catch (err) {
        console.error(err)
        const error = processError(err)
        setError(error)
      } finally {
        setLoading(false)
      }
    },
    [
      chain,
      getOfflineSignerAmino,
      getOfflineSignerDirect,
      holdingAltForDirectSign,
      queryClient,
      t,
      walletAddress,
    ]
  )

  const { ready: txSavesReady, postRequest: postTxSavesRequest } =
    useCfWorkerAuthPostRequest(KVPK_API_BASE, 'Transaction Saves')

  const setRefreshSaves = useSetRecoilState(refreshSavedTxsAtom)
  const refreshSaves = useCallback(
    () => setRefreshSaves((id) => id + 1),
    [setRefreshSaves]
  )

  const setTemporarySaves = useSetRecoilState(
    temporarySavedTxsAtom(hexPublicKey.loading ? '' : hexPublicKey.data)
  )
  const savesLoading = useCachedLoading(
    !hexPublicKey.loading ? savedTxsSelector(hexPublicKey.data) : undefined,
    []
  )
  const [saving, setSaving] = useState(false)

  const save = async (save: AccountTxSave) => {
    if (!txSavesReady) {
      toast.error(t('error.logInToContinue'))
      return false
    }

    setSaving(true)
    try {
      const nameHash = toHex(
        new Uint8Array(
          await crypto.subtle.digest(
            'SHA-512',
            new TextEncoder().encode(save.name)
          )
        )
      )

      const key = ME_SAVED_TX_PREFIX + nameHash
      await postTxSavesRequest('/set', {
        key,
        value: save,
      })

      setTemporarySaves((prev) => ({
        ...prev,
        [key]: save,
      }))
      refreshSaves()

      return true
    } catch (err) {
      console.error(err)
      toast.error(processError(err))
    } finally {
      setSaving(false)
    }

    return false
  }
  const deleteSave = async (save: AccountTxSave) => {
    if (!txSavesReady) {
      toast.error(t('error.logInToContinue'))
      return false
    }

    try {
      const nameHash = toHex(
        new Uint8Array(
          await crypto.subtle.digest(
            'SHA-512',
            new TextEncoder().encode(save.name)
          )
        )
      )

      const key = ME_SAVED_TX_PREFIX + nameHash
      await postTxSavesRequest('/set', {
        key,
        value: null,
      })

      setTemporarySaves((prev) => ({
        ...prev,
        [key]: null,
      }))
      refreshSaves()

      return true
    } catch (err) {
      console.error(err)
      toast.error(processError(err))
    }

    return false
  }

  return (
    <StatelessProfileActions
      SuspenseLoader={SuspenseLoader}
      WalletChainSwitcher={WalletChainSwitcher}
      categories={categories}
      deleteSave={deleteSave}
      error={error}
      execute={execute}
      formMethods={formMethods}
      holdingAltForDirectSign={holdingAltForDirectSign}
      loadedActions={loadedActions}
      loading={loading}
      save={save}
      saves={savesLoading}
      saving={saving}
      txHash={txHash}
    />
  )
}
