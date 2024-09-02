import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'

import { DaoProposalCommonSelectors, isContractSelector } from '@dao-dao/state'
import {
  ControlKnobsEmoji,
  useCachedLoadingWithError,
} from '@dao-dao/stateless'
import {
  ActionComponent,
  ActionKey,
  ActionMaker,
  UseDecodedCosmosMsg,
  UseDefaults,
  UseTransformToCosmos,
} from '@dao-dao/types/actions'
import {
  ContractName,
  decodeCw1WhitelistExecuteMsg,
  decodePolytoneExecuteMsg,
  getChainAddressForActionOptions,
  makeCw1WhitelistExecuteMessage,
  makeExecuteSmartContractMessage,
  maybeMakePolytoneExecuteMessage,
  objectMatchesStructure,
} from '@dao-dao/utils'

import {
  AddressInput,
  EntityDisplay,
  ProposalLine,
} from '../../../../components'
import { useQueryLoadingDataWithError } from '../../../../hooks'
import { daoQueries } from '../../../../queries/dao'
import { daosWithVetoableProposalsSelector } from '../../../../recoil'
import { useActionOptions } from '../../../react'
import {
  VetoOrEarlyExecuteDaoProposalComponent as StatelessVetoOrEarlyExecuteDaoProposalComponent,
  VetoOrEarlyExecuteDaoProposalData,
} from './Component'

const Component: ActionComponent<
  undefined,
  VetoOrEarlyExecuteDaoProposalData
> = (props) => {
  const { isCreating, fieldNamePrefix } = props
  const {
    chain: { chain_id: daoChainId },
    address,
  } = useActionOptions()
  const { watch, setValue } =
    useFormContext<VetoOrEarlyExecuteDaoProposalData>()

  const chainId = watch((props.fieldNamePrefix + 'chainId') as 'chainId')
  const coreAddress = watch(
    (props.fieldNamePrefix + 'coreAddress') as 'coreAddress'
  )
  const proposalModuleAddress = watch(
    (props.fieldNamePrefix + 'proposalModuleAddress') as 'proposalModuleAddress'
  )
  const proposalId = watch(
    (props.fieldNamePrefix + 'proposalId') as 'proposalId'
  )

  const daoVetoableProposals = useCachedLoadingWithError(
    daosWithVetoableProposalsSelector({
      chainId: daoChainId,
      coreAddress: address,
      // Include even those not registered in the DAO's list.
      includeAll: true,
    })
  )

  // If no DAO selected, autoselect first one.
  useEffect(() => {
    if (
      !isCreating ||
      (chainId && coreAddress) ||
      daoVetoableProposals.loading ||
      daoVetoableProposals.errored ||
      daoVetoableProposals.data.length === 0
    ) {
      return
    }

    setValue(
      (fieldNamePrefix + 'chainId') as 'chainId',
      daoVetoableProposals.data[0].chainId
    )
    setValue(
      (fieldNamePrefix + 'coreAddress') as 'coreAddress',
      daoVetoableProposals.data[0].dao
    )
  }, [
    chainId,
    coreAddress,
    daoVetoableProposals,
    fieldNamePrefix,
    isCreating,
    setValue,
  ])

  const queryClient = useQueryClient()
  const selectedDaoInfo = useQueryLoadingDataWithError(
    daoQueries.info(
      queryClient,
      chainId && coreAddress
        ? {
            chainId,
            coreAddress,
          }
        : undefined
    )
  )

  // Select first proposal once loaded if nothing selected.
  useEffect(() => {
    if (
      isCreating &&
      !daoVetoableProposals.loading &&
      !daoVetoableProposals.errored &&
      !proposalId &&
      daoVetoableProposals.data.length > 0
    ) {
      setValue(
        (fieldNamePrefix + 'chainId') as 'chainId',
        daoVetoableProposals.data[0].chainId
      )
      setValue(
        (fieldNamePrefix + 'coreAddress') as 'coreAddress',
        daoVetoableProposals.data[0].dao
      )
      setValue(
        (fieldNamePrefix + 'proposalModuleAddress') as 'proposalModuleAddress',
        daoVetoableProposals.data[0].proposalsWithModule[0].proposalModule
          .address
      )
      setValue(
        (fieldNamePrefix + 'proposalId') as 'proposalId',
        daoVetoableProposals.data[0].proposalsWithModule[0].proposals[0].id
      )
    }
  }, [isCreating, proposalId, setValue, fieldNamePrefix, daoVetoableProposals])

  // Load cw1-whitelist vetoer for proposal.
  const proposalLoading = useCachedLoadingWithError(
    proposalModuleAddress && !isNaN(proposalId) && proposalId > -1
      ? DaoProposalCommonSelectors.proposalSelector({
          chainId,
          contractAddress: proposalModuleAddress,
          params: [
            {
              proposalId,
            },
          ],
        })
      : undefined
  )
  const isCw1WhitelistLoading = useCachedLoadingWithError(
    !proposalLoading.loading &&
      !proposalLoading.errored &&
      proposalLoading.data.proposal.veto?.vetoer
      ? isContractSelector({
          chainId,
          contractAddress: proposalLoading.data.proposal.veto.vetoer,
          name: ContractName.Cw1Whitelist,
        })
      : undefined
  )
  useEffect(() => {
    if (
      !proposalLoading.loading &&
      !proposalLoading.errored &&
      !isCw1WhitelistLoading.loading &&
      !isCw1WhitelistLoading.errored &&
      isCw1WhitelistLoading.data
    ) {
      setValue(
        (fieldNamePrefix + 'cw1WhitelistVetoer') as 'cw1WhitelistVetoer',
        isCw1WhitelistLoading.data
          ? proposalLoading.data.proposal.veto?.vetoer
          : undefined
      )
    }
  }, [fieldNamePrefix, isCw1WhitelistLoading, proposalLoading, setValue])

  return (
    <StatelessVetoOrEarlyExecuteDaoProposalComponent
      {...props}
      options={{
        selectedDaoInfo,
        daoVetoableProposals,
        AddressInput,
        EntityDisplay,
        ProposalLine,
      }}
    />
  )
}

export const makeVetoOrEarlyExecuteDaoProposalAction: ActionMaker<
  VetoOrEarlyExecuteDaoProposalData
> = (options) => {
  const {
    t,
    chain: { chain_id: currentChainId },
    address,
  } = options

  const useDefaults: UseDefaults<VetoOrEarlyExecuteDaoProposalData> = () => ({
    chainId: currentChainId,
    coreAddress: '',
    proposalModuleAddress: '',
    proposalId: -1,
    action: 'veto',
    vetoerIsCw1Whitelist: false,
  })

  const useTransformToCosmos: UseTransformToCosmos<
    VetoOrEarlyExecuteDaoProposalData
  > = () =>
    useCallback(
      ({
        chainId,
        proposalModuleAddress,
        proposalId,
        action,
        cw1WhitelistVetoer,
      }) => {
        const actionSender =
          getChainAddressForActionOptions(options, chainId) || ''

        const msg = makeExecuteSmartContractMessage({
          chainId,
          sender: cw1WhitelistVetoer || actionSender,
          contractAddress: proposalModuleAddress,
          msg: {
            [action === 'veto' ? 'veto' : 'execute']: {
              proposal_id: proposalId,
            },
          },
        })

        return maybeMakePolytoneExecuteMessage(
          currentChainId,
          chainId,
          cw1WhitelistVetoer
            ? makeCw1WhitelistExecuteMessage({
                chainId,
                sender: actionSender,
                cw1WhitelistContract: cw1WhitelistVetoer,
                msg,
              })
            : msg
        )
      },
      []
    )

  const useDecodedCosmosMsg: UseDecodedCosmosMsg<
    VetoOrEarlyExecuteDaoProposalData
  > = (msg: Record<string, any>) => {
    let chainId = currentChainId
    const decodedPolytone = decodePolytoneExecuteMsg(chainId, msg)
    if (decodedPolytone.match) {
      chainId = decodedPolytone.chainId
      msg = decodedPolytone.msg
    }

    // If this is a cw1-whitelist execute msg, check msg inside of it.
    const decodedCw1Whitelist = decodeCw1WhitelistExecuteMsg(msg, 'one')
    if (decodedCw1Whitelist) {
      msg = decodedCw1Whitelist.msgs[0]
    }

    const isWasmExecuteMessage = objectMatchesStructure(msg, {
      wasm: {
        execute: {
          contract_addr: {},
          funds: {},
          msg: {},
        },
      },
    })

    const isVeto =
      isWasmExecuteMessage &&
      objectMatchesStructure(msg.wasm.execute.msg, {
        veto: {
          proposal_id: {},
        },
      })
    const isExecute =
      isWasmExecuteMessage &&
      objectMatchesStructure(msg.wasm.execute.msg, {
        execute: {
          proposal_id: {},
        },
      })

    const proposalId = isVeto
      ? msg.wasm.execute.msg.veto.proposal_id
      : isExecute
      ? msg.wasm.execute.msg.execute.proposal_id
      : -1

    // Get DAO that this proposal module is attached to.
    const daoLoading = useCachedLoadingWithError(
      isWasmExecuteMessage
        ? DaoProposalCommonSelectors.daoSelector({
            chainId,
            contractAddress: msg.wasm.execute.contract_addr,
          })
        : undefined
    )

    const proposalLoading = useCachedLoadingWithError(
      isWasmExecuteMessage
        ? DaoProposalCommonSelectors.proposalSelector({
            chainId,
            contractAddress: msg.wasm.execute.contract_addr,
            params: [
              {
                proposalId,
              },
            ],
          })
        : undefined
    )

    const isCw1WhitelistLoading = useCachedLoadingWithError(
      !proposalLoading.loading &&
        !proposalLoading.errored &&
        proposalLoading.data.proposal.veto?.vetoer
        ? isContractSelector({
            chainId,
            contractAddress: proposalLoading.data.proposal.veto.vetoer,
            name: ContractName.Cw1Whitelist,
          })
        : undefined
    )

    if (
      daoLoading.loading ||
      daoLoading.errored ||
      proposalLoading.loading ||
      proposalLoading.errored ||
      isCw1WhitelistLoading.loading ||
      isCw1WhitelistLoading.errored ||
      (!isVeto &&
        (!isExecute ||
          // If executing, it's not an early-execute if we are not the vetoer.
          proposalLoading.data.proposal.veto?.vetoer !== address))
    ) {
      return {
        match: false,
      }
    }

    return {
      match: true,
      data: {
        chainId,
        coreAddress: daoLoading.data,
        proposalModuleAddress: msg.wasm.execute.contract_addr,
        proposalId,
        action: isVeto ? 'veto' : 'earlyExecute',
        cw1WhitelistVetoer: isCw1WhitelistLoading.data
          ? proposalLoading.data.proposal.veto?.vetoer
          : undefined,
      },
    }
  }

  return {
    key: ActionKey.VetoOrEarlyExecuteDaoProposal,
    Icon: ControlKnobsEmoji,
    label: t('title.vetoOrEarlyExecute'),
    description: t('info.vetoOrEarlyExecuteDescription'),
    Component,
    useDefaults,
    useTransformToCosmos,
    useDecodedCosmosMsg,
  }
}
