import cloneDeep from 'lodash.clonedeep'
import { atom, atomFamily } from 'recoil'
import { v4 as uuidv4 } from 'uuid'

import { localStorageEffectJSON } from '@dao-dao/state/recoil/effects'
import {
  DaoCreatedCardProps,
  DepositRefundPolicy,
  DurationUnits,
  NewDao,
} from '@dao-dao/types'
import {
  DaoProposalMultipleAdapterId,
  DaoProposalSingleAdapterId,
  MembershipBasedCreatorId,
  convertCosmosVetoConfigToVeto,
  getNativeTokenForChainId,
  getSupportedChainConfig,
} from '@dao-dao/utils'

import { MembershipBasedCreator } from '../../creators/MembershipBased'
import {
  DaoProposalMultipleAdapter,
  DaoProposalSingleAdapter,
} from '../../proposal-module-adapter'

// Avoid cyclic dependencies issues with the adapter modules by using a lazy
// maker function.
export const makeDefaultNewDao = (chainId: string): NewDao => ({
  uuid: uuidv4(),
  chainId,
  name: '',
  description: '',
  imageUrl: undefined,
  creator: {
    id: MembershipBasedCreatorId,
    data: cloneDeep(
      MembershipBasedCreator.makeDefaultConfig(
        getSupportedChainConfig(chainId)!
      )
    ),
  },
  // Default to single and multiple choice proposal configuration.
  proposalModuleAdapters: [
    {
      id: DaoProposalSingleAdapterId,
      data: cloneDeep(
        DaoProposalSingleAdapter.daoCreation.extraVotingConfig?.default ?? {}
      ),
    },
    {
      id: DaoProposalMultipleAdapterId,
      data: cloneDeep(
        DaoProposalMultipleAdapter.daoCreation.extraVotingConfig?.default ?? {}
      ),
    },
  ],
  votingConfig: {
    quorum: {
      majority: false,
      value: 20,
    },
    votingDuration: {
      value: 1,
      units: DurationUnits.Weeks,
    },
    proposalDeposit: {
      enabled: false,
      amount: 10,
      type: 'native',
      denomOrAddress: getNativeTokenForChainId(chainId).denomOrAddress,
      token: undefined,
      refundPolicy: DepositRefundPolicy.OnlyPassed,
    },
    anyoneCanPropose: false,
    onlyMembersExecute: true,
    allowRevoting: false,
    enableMultipleChoice: true,
    approver: {
      enabled: false,
      address: '',
    },
    // Get default veto config by passing null.
    veto: convertCosmosVetoConfigToVeto(null),
  },
  advancedVotingConfigEnabled: false,
  widgets: {},
})

export const newDaoAtom = atomFamily<
  NewDao,
  {
    chainId: string
    parentDaoAddress?: string
  }
>({
  key: 'newDao',
  default: ({ chainId }) => makeDefaultNewDao(chainId),
  effects: [localStorageEffectJSON],
})

// When set, shows DAO created modal with these props for the DaoCard shown.
export const daoCreatedCardPropsAtom = atom<DaoCreatedCardProps | undefined>({
  key: 'daoCreatedCardProps',
  default: undefined,
})
