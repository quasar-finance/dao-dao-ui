import {
  ContractVersion,
  PreProposeModuleType,
  ProposalModuleAdapter,
} from '@dao-dao/types'
import { Vote } from '@dao-dao/types/contracts/DaoProposalSingle.common'
import {
  DAO_PROPOSAL_SINGLE_CONTRACT_NAMES,
  DaoProposalSingleAdapterId,
} from '@dao-dao/utils'

import {
  NewProposal,
  depositInfoSelector as makeDepositInfoSelector,
  makeUpdatePreProposeSingleConfigActionMaker,
  makeUpdateProposalConfigV1ActionMaker,
  makeUpdateProposalConfigV2ActionMaker,
  makeUsePublishProposal,
  maxVotingPeriodSelector,
  proposalCountSelector,
  reversePreProposeCompletedProposalInfosSelector,
  reversePreProposePendingProposalInfosSelector,
  reverseProposalInfosSelector,
} from './common'
import {
  PreProposeApprovalInnerContentDisplay,
  PreProposeApprovalProposalLine,
  PreProposeApprovalProposalStatusAndInfo,
  ProposalInnerContentDisplay,
  ProposalLine,
  ProposalStatusAndInfo,
  ProposalVoteTally,
  ProposalVoter,
  ProposalVotes,
  ProposalWalletVote,
} from './components'
import { ThresholdVotingConfigItem, getInstantiateInfo } from './daoCreation'
import {
  fetchPrePropose,
  fetchVetoConfig,
  makeGetProposalInfo,
} from './functions'
import {
  useCastVote,
  useLoadingPreProposeApprovalProposal,
  useLoadingProposalExecutionTxHash,
  useLoadingProposalStatus,
  useLoadingVoteOptions,
  useLoadingWalletVoteInfo,
  useProposalDaoInfoCards,
  useProposalRefreshers,
} from './hooks'
import { DaoCreationExtraVotingConfig, NewProposalForm } from './types'

export const DaoProposalSingleAdapter: ProposalModuleAdapter<
  DaoCreationExtraVotingConfig,
  Vote,
  NewProposalForm
> = {
  id: DaoProposalSingleAdapterId,
  contractNames: DAO_PROPOSAL_SINGLE_CONTRACT_NAMES,

  loadCommon: ({ proposalModule }) => {
    // Make here so we can pass into common hooks and components that need it.
    const depositInfoSelector = makeDepositInfoSelector({
      chainId: proposalModule.dao.chainId,
      proposalModuleAddress: proposalModule.address,
      version: proposalModule.version,
      preProposeAddress: proposalModule.prePropose?.address ?? null,
    })

    const usePublishProposal = makeUsePublishProposal({
      proposalModule,
      depositInfoSelector,
    })

    return {
      // Fields
      fields: {
        makeDefaultNewProposalForm: () => ({
          title: '',
          description: '',
          actionData: [],
        }),
        newProposalFormTitleKey: 'title',
        updateConfigActionMaker: (proposalModule.version === ContractVersion.V1
          ? makeUpdateProposalConfigV1ActionMaker
          : makeUpdateProposalConfigV2ActionMaker)(proposalModule),
        updatePreProposeConfigActionMaker:
          makeUpdatePreProposeSingleConfigActionMaker(proposalModule),
      },

      // Selectors
      selectors: {
        proposalCount: proposalCountSelector({
          chainId: proposalModule.dao.chainId,
          proposalModuleAddress: proposalModule.address,
        }),
        reverseProposalInfos: (props) =>
          reverseProposalInfosSelector({
            chainId: proposalModule.dao.chainId,
            proposalModuleAddress: proposalModule.address,
            proposalModulePrefix: proposalModule.prefix,
            ...props,
          }),
        depositInfo: depositInfoSelector,
        ...(proposalModule.prePropose?.type === PreProposeModuleType.Approval
          ? {
              reversePreProposePendingProposalInfos: (props) =>
                reversePreProposePendingProposalInfosSelector({
                  chainId: proposalModule.dao.chainId,
                  proposalModuleAddress: proposalModule.prePropose!.address,
                  proposalModulePrefix: proposalModule.prefix,
                  ...props,
                }),
              reversePreProposeCompletedProposalInfos: (props) =>
                reversePreProposeCompletedProposalInfosSelector({
                  chainId: proposalModule.dao.chainId,
                  proposalModuleAddress: proposalModule.prePropose!.address,
                  proposalModulePrefix: proposalModule.prefix,
                  ...props,
                }),
            }
          : {}),
        maxVotingPeriod: maxVotingPeriodSelector({
          chainId: proposalModule.dao.chainId,
          proposalModuleAddress: proposalModule.address,
        }),
      },

      // Hooks
      hooks: {
        useProposalDaoInfoCards,
      },

      // Components
      components: {
        NewProposal: (props) => (
          <NewProposal
            proposalModule={proposalModule}
            usePublishProposal={usePublishProposal}
            {...props}
          />
        ),
      },
    }
  },

  load: (options) => ({
    // Functions
    functions: {
      getProposalInfo: makeGetProposalInfo(options),
    },

    // Hooks
    hooks: {
      useCastVote,
      useProposalRefreshers,
      useLoadingProposalExecutionTxHash,
      useLoadingProposalStatus,
      useLoadingVoteOptions,
      useLoadingWalletVoteInfo,

      useLoadingPreProposeApprovalProposal,
    },

    // Components
    components: {
      ProposalStatusAndInfo,
      ProposalVoter,
      ProposalInnerContentDisplay,
      ProposalWalletVote,
      ProposalVotes,
      ProposalVoteTally,
      ProposalLine,

      PreProposeApprovalProposalStatusAndInfo,
      PreProposeApprovalInnerContentDisplay,
      PreProposeApprovalProposalLine,
    },
  }),

  queries: {
    proposalCount: {
      indexerFormula: 'daoProposalSingle/proposalCount',
      cosmWasmQuery: {
        proposal_count: {},
      },
    },
  },

  functions: {
    fetchPrePropose,
    fetchVetoConfig,
  },

  daoCreation: {
    extraVotingConfig: {
      default: {
        quorumEnabled: true,
        threshold: {
          majority: true,
          value: 67,
        },
      },

      advancedItems: [ThresholdVotingConfigItem],
    },

    getInstantiateInfo,
  },
}
