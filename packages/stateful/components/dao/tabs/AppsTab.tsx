import { AccountData, StdSignDoc } from '@cosmjs/amino'
import { fromBech32 } from '@cosmjs/encoding'
import { DirectSignDoc, SimpleAccount, WalletAccount } from '@cosmos-kit/core'
import { useIframe } from '@cosmos-kit/react-lite'
import cloneDeep from 'lodash.clonedeep'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useRecoilState, useSetRecoilState } from 'recoil'
import useDeepCompareEffect from 'use-deep-compare-effect'
import { v4 as uuidv4 } from 'uuid'

import { OverrideHandler } from '@dao-dao/cosmiframe'
import {
  proposalCreatedCardPropsAtom,
  proposalDraftsAtom,
  refreshProposalsIdAtom,
} from '@dao-dao/state/recoil'
import {
  Loader,
  Modal,
  ProfileImage,
  ProfileNameDisplayAndEditor,
  AppsTab as StatelessAppsTab,
  StatusCard,
  useDaoInfoContext,
} from '@dao-dao/stateless'
import {
  AccountType,
  ActionKeyAndData,
  ActionKeyAndDataNoId,
  BaseNewProposalProps,
  ProposalDraft,
  UnifiedCosmosMsg,
  decodedStargateMsgToCw,
  getAminoTypes,
  protobufToCwMsg,
} from '@dao-dao/types'
import { TxBody } from '@dao-dao/types/protobuf/codegen/cosmos/tx/v1beta1/tx'
import {
  DaoProposalSingleAdapterId,
  SITE_TITLE,
  SITE_URL,
  decodeMessages,
  getAccountAddress,
  getAccountChainId,
  getChainForChainId,
  getDisplayNameForChainId,
  maybeMakePolytoneExecuteMessage,
} from '@dao-dao/utils'

import { useActionsForMatching } from '../../../actions'
import { useProfile } from '../../../hooks'
import {
  ProposalModuleAdapterCommonProvider,
  matchAdapter as matchProposalModuleAdapter,
} from '../../../proposal-module-adapter'
import { NewProposalForm as NewSingleChoiceProposalForm } from '../../../proposal-module-adapter/adapters/DaoProposalSingle/types'
import { useProposalModuleAdapterCommonContext } from '../../../proposal-module-adapter/react/context'
import { ConnectWallet } from '../../ConnectWallet'
import { SuspenseLoader } from '../../SuspenseLoader'
import { ProposalDaoInfoCards } from '../ProposalDaoInfoCards'

// Wallet account secp256k1 public keys are expected to be 33 bytes starting
// with 0x02 or 0x03. This will be used when simulating requests, but not when
// signing since we intercept messages. This may cause problems with some dApps
// if simulation fails...
const EMPTY_PUB_KEY = new Uint8Array([0x02, ...[...new Array(32)].map(() => 0)])

export const AppsTab = () => {
  const { t } = useTranslation()
  const {
    name,
    chainId: currentChainId,
    coreAddress,
    polytoneProxies,
    proposalModules,
    accounts,
  } = useDaoInfoContext()

  // Select the single choice proposal module to use for proposals.
  const singleChoiceProposalModule = proposalModules.find(
    ({ contractName }) =>
      matchProposalModuleAdapter(contractName)?.id ===
      DaoProposalSingleAdapterId
  )

  const [msgs, setMsgs] = useState<UnifiedCosmosMsg[]>()
  const [fullScreen, setFullScreen] = useState(false)

  const addressForChainId = (chainId: string) => {
    const address =
      getAccountAddress({
        accounts,
        chainId,
        types: [AccountType.Native, AccountType.Polytone],
      }) ||
      // Fallback to ICA if exists, but don't use if a native or polytone
      // account exists.
      getAccountAddress({
        accounts,
        chainId,
        types: [AccountType.Ica],
      })
    if (!address) {
      // If chain ID is empty (user or client error I believe), just return
      // core DAO address since the error won't be helpful.
      if (!chainId) {
        console.error(
          'DAO DAO app `chainId` should not be empty in `addressForChainId`, but it is. Returning core DAO address.'
        )
        return coreAddress
      }

      throw new Error(
        t('error.daoMissingAccountsOnChains', {
          daoName: name,
          chains: `${getDisplayNameForChainId(chainId)} (${chainId})`,
          count: 1,
        })
      )
    }
    return address
  }
  const chainIdForAddress = (address: string) =>
    getAccountChainId({
      accounts,
      address,
    })

  const decodeDirect = (sender: string, signDocBodyBytes: Uint8Array) => {
    const chainId = chainIdForAddress(sender)
    if (!chainId) {
      toast.error(t('error.daoAccountNotFound'))
      return
    }

    const encodedMessages = TxBody.decode(signDocBodyBytes).messages
    const messages = encodedMessages.map((msg) =>
      maybeMakePolytoneExecuteMessage(
        currentChainId,
        chainId,
        protobufToCwMsg(getChainForChainId(chainId), msg, false).msg
      )
    )
    setMsgs(messages)
  }
  const decodeAmino = (sender: string, signDoc: StdSignDoc) => {
    const chainId = chainIdForAddress(sender)
    if (!chainId) {
      toast.error(t('error.daoAccountNotFound'))
      return
    }

    const messages = signDoc.msgs.map((msg) =>
      maybeMakePolytoneExecuteMessage(
        currentChainId,
        chainId,
        decodedStargateMsgToCw(
          getChainForChainId(chainId),
          getAminoTypes().fromAmino(msg)
        ).msg
      )
    )
    setMsgs(messages)
  }

  const enableAndConnect = (chainIds: string | string[]): OverrideHandler =>
    [chainIds].flat().some((chainId) => {
      try {
        // Throws error if account not found.
        addressForChainId(chainId)

        return true
      } catch {
        return false
      }
    })
      ? {
          type: 'success',
        }
      : {
          type: 'error',
          error: t('error.daoMissingAccountsOnChains', {
            daoName: name,
            chains: [chainIds]
              .flat()
              .map(
                (chainId) => `${getDisplayNameForChainId(chainId)} (${chainId})`
              )
              .join(', '),
            count: [chainIds].flat().length,
          }),
        }

  const { wallet, iframeRef } = useIframe({
    metadata: {
      name: SITE_TITLE,
      imageUrl: SITE_URL + '/daodao.png',
    },
    walletClientOverrides: {
      // @ts-ignore
      signAmino: (_chainId: string, signer: string, signDoc: StdSignDoc) => {
        decodeAmino(signer, signDoc)
      },
      // @ts-ignore
      signDirect: (
        _chainId: string,
        signer: string,
        signDoc: DirectSignDoc
      ) => {
        if (!signDoc?.bodyBytes) {
          return {
            type: 'execute',
          }
        }

        decodeDirect(signer, signDoc.bodyBytes)
      },
      enable: enableAndConnect,
      connect: enableAndConnect,
      sign: () => ({
        type: 'error',
        value: 'Unsupported.',
      }),
      signArbitrary: () => ({
        type: 'error',
        value: 'Unsupported.',
      }),
      suggestToken: () => ({
        type: 'success',
      }),
      addChain: () => ({
        type: 'success',
      }),
      getAccount: async (chainId: string) => ({
        type: 'success',
        value: {
          address: addressForChainId(chainId),
          algo: 'secp256k1',
          pubkey: EMPTY_PUB_KEY,
          username: name,
        } as WalletAccount,
      }),
      getSimpleAccount: (chainId: string) => ({
        type: 'success',
        value: {
          namespace: 'cosmos',
          chainId,
          address: addressForChainId(chainId),
          username: name,
        } as SimpleAccount,
      }),
      // Needed by Graz and other Keplr clients.
      getKey: async (chainId: string) => {
        let bech32Address = ''
        // Ignore invalid chains for now.
        try {
          bech32Address = addressForChainId(chainId)
        } catch {}

        return {
          type: 'success',
          value: {
            name,
            algo: 'secp256k1',
            pubkey: EMPTY_PUB_KEY,
            address: bech32Address
              ? fromBech32(bech32Address).data
              : new Uint8Array([]),
            bech32Address,
            isNanoLedger: false,
            isKeystone: false,
          },
        }
      },
    },
    signerOverrides: {
      signDirect: (signerAddress, signDoc) => {
        decodeDirect(signerAddress, signDoc.bodyBytes)

        return {
          type: 'error',
          error: 'Handled by DAO.',
        }
      },
      signAmino: (signerAddress, signDoc) => {
        decodeAmino(signerAddress, signDoc)

        return {
          type: 'error',
          error: 'Handled by DAO.',
        }
      },
      getAccounts: async () => ({
        type: 'success',
        value: [
          {
            address: coreAddress,
            algo: 'secp256k1',
            pubkey: EMPTY_PUB_KEY,
          },
          ...Object.values(polytoneProxies).map((address) => ({
            address,
            algo: 'secp256k1',
            pubkey: EMPTY_PUB_KEY,
          })),
        ] as AccountData[],
      }),
    },
  })

  // Connect to iframe wallet on load if disconnected.
  const connectingRef = useRef(false)
  useEffect(() => {
    if (wallet && !wallet.isWalletConnected && !connectingRef.current) {
      connectingRef.current = true
      try {
        wallet.connect(false)
      } finally {
        connectingRef.current = false
      }
    }
  }, [wallet])

  return singleChoiceProposalModule ? (
    <>
      <StatelessAppsTab
        fullScreen={fullScreen}
        iframeRef={iframeRef}
        setFullScreen={setFullScreen}
      />

      {msgs && (
        <ProposalModuleAdapterCommonProvider
          proposalModuleAddress={singleChoiceProposalModule.address}
        >
          <ActionMatcherAndProposer
            key={JSON.stringify(msgs)}
            msgs={msgs}
            setMsgs={setMsgs}
          />
        </ProposalModuleAdapterCommonProvider>
      )}
    </>
  ) : (
    <StatusCard
      content={t('error.noSingleChoiceProposalModuleAppsDisabled')}
      style="warning"
    />
  )
}

type ActionMatcherAndProposerProps = {
  msgs: UnifiedCosmosMsg[]
  setMsgs: (msgs: UnifiedCosmosMsg[] | undefined) => void
}

const ActionMatcherAndProposer = ({
  msgs,
  setMsgs,
}: ActionMatcherAndProposerProps) => {
  const { t } = useTranslation()
  const { coreAddress } = useDaoInfoContext()
  const { connected, profile } = useProfile()

  const {
    id: proposalModuleAdapterCommonId,
    common: {
      fields: { newProposalFormTitleKey },
      components: { NewProposal },
    },
  } = useProposalModuleAdapterCommonContext()

  const actionsForMatching = useActionsForMatching()

  const decodedMessages = useMemo(() => decodeMessages(msgs), [msgs])

  // Call relevant action hooks in the same order every time.
  const actionData: ActionKeyAndDataNoId[] = decodedMessages.map((message) => {
    const actionMatch = actionsForMatching
      .map((action) => ({
        action,
        ...action.useDecodedCosmosMsg(message),
      }))
      .find(({ match }) => match)

    // There should always be a match since custom matches all. This should
    // never happen as long as the Custom action exists.
    if (!actionMatch?.match) {
      throw new Error(t('error.loadingData'))
    }

    return {
      actionKey: actionMatch.action.key,
      data: actionMatch.data,
    }
  })

  const formMethods = useForm<NewSingleChoiceProposalForm>({
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      actionData: actionData.map(
        (data): ActionKeyAndData => ({
          _id: uuidv4(),
          ...data,
        })
      ),
    },
  })
  const proposalData = formMethods.watch()

  // If contents of matched action data change, update form.
  useDeepCompareEffect(() => {
    formMethods.reset({
      title: proposalData.title,
      description: proposalData.description,
      actionData: actionData.map(
        (data): ActionKeyAndData => ({
          _id: uuidv4(),
          ...data,
        })
      ),
    })
  }, [actionData])

  const setProposalCreatedCardProps = useSetRecoilState(
    proposalCreatedCardPropsAtom
  )

  const setRefreshProposalsId = useSetRecoilState(refreshProposalsIdAtom)
  const refreshProposals = useCallback(
    () => setRefreshProposalsId((id) => id + 1),
    [setRefreshProposalsId]
  )

  const [drafts, setDrafts] = useRecoilState(proposalDraftsAtom(coreAddress))
  const [draftIndex, setDraftIndex] = useState<number>()
  const draft =
    draftIndex !== undefined && drafts.length > draftIndex
      ? drafts[draftIndex]
      : undefined
  const deleteDraft = useCallback(
    (deleteIndex: number) => {
      setDrafts((drafts) => drafts.filter((_, index) => index !== deleteIndex))
      setDraftIndex(undefined)
    },
    [setDrafts]
  )
  const unloadDraft = () => setDraftIndex(undefined)

  const proposalName = formMethods.watch(newProposalFormTitleKey as any)
  const saveDraft = useCallback(() => {
    // Already saving to a selected draft.
    if (draft) {
      return
    }

    const newDraft: ProposalDraft = {
      name: proposalName,
      createdAt: Date.now(),
      lastUpdatedAt: Date.now(),
      proposal: {
        id: proposalModuleAdapterCommonId,
        data: proposalData,
      },
    }

    setDrafts([newDraft, ...drafts])
    setDraftIndex(0)
  }, [
    draft,
    drafts,
    proposalData,
    proposalModuleAdapterCommonId,
    setDrafts,
    proposalName,
  ])

  // Debounce saving draft every 3 seconds.
  const [draftSaving, setDraftSaving] = useState(false)
  useEffect(() => {
    if (draftIndex === undefined) {
      return
    }

    // Save after 3 seconds.
    setDraftSaving(true)
    const timeout = setTimeout(() => {
      setDrafts((drafts) =>
        drafts.map((savedDraft, index) =>
          index === draftIndex
            ? {
                ...savedDraft,
                name: proposalName,
                lastUpdatedAt: Date.now(),
                proposal: {
                  id: proposalModuleAdapterCommonId,
                  // Deep clone to prevent values from becoming readOnly.
                  data: cloneDeep(proposalData),
                },
              }
            : savedDraft
        )
      )
      setDraftSaving(false)
    }, 3000)
    // Debounce.
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Instance changes every time, so compare stringified verison.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(proposalData),
    draftIndex,
    setDrafts,
    proposalName,
    proposalModuleAdapterCommonId,
  ])

  const onCreateSuccess: BaseNewProposalProps['onCreateSuccess'] = useCallback(
    (info) => {
      // Show modal.
      setProposalCreatedCardProps(info)

      // Delete draft.
      if (draftIndex !== undefined) {
        deleteDraft(draftIndex)
      }

      // Refresh proposals state.
      refreshProposals()

      // Close modal.
      setMsgs(undefined)
    },
    [
      deleteDraft,
      draftIndex,
      refreshProposals,
      setMsgs,
      setProposalCreatedCardProps,
    ]
  )

  return (
    <Modal
      backdropClassName="!z-[39]"
      containerClassName="sm:!max-w-[min(90dvw,64rem)] !w-full"
      footerContainerClassName="flex flex-row justify-end"
      footerContent={
        connected ? (
          <>
            <div className="flex min-w-0 flex-row items-center gap-2">
              {/* Image */}
              <ProfileImage
                imageUrl={profile.loading ? undefined : profile.data.imageUrl}
                loading={profile.loading}
                size="sm"
              />

              {/* Name */}
              <ProfileNameDisplayAndEditor profile={profile} />
            </div>
          </>
        ) : (
          <ConnectWallet size="md" />
        )
      }
      header={{
        title: t('title.createProposal'),
        subtitle: t('info.appsProposalDescription'),
      }}
      onClose={() => setMsgs(undefined)}
      visible
    >
      <FormProvider {...formMethods}>
        <SuspenseLoader fallback={<Loader />}>
          <NewProposal
            ProposalDaoInfoCards={ProposalDaoInfoCards}
            actionsReadOnlyMode
            deleteDraft={deleteDraft}
            draft={draft}
            draftSaving={draftSaving}
            drafts={drafts}
            onCreateSuccess={onCreateSuccess}
            proposalModuleSelector={null}
            saveDraft={saveDraft}
            unloadDraft={unloadDraft}
          />
        </SuspenseLoader>
      </FormProvider>
    </Modal>
  )
}
