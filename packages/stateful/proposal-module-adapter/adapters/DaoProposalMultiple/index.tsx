import { ProposalModuleAdapter } from '@dao-dao/types'
import { MultipleChoiceVote } from '@dao-dao/types/contracts/DaoProposalMultiple'
import {
  DAO_PROPOSAL_MULTIPLE_CONTRACT_NAMES,
  DaoProposalMultipleAdapterId,
} from '@dao-dao/utils'

import {
  NewProposal,
  depositInfoSelector as makeDepositInfoSelector,
  makeUpdatePreProposeConfigActionMaker,
  makeUpdateProposalConfigActionMaker,
  makeUsePublishProposal,
  maxVotingPeriodSelector,
  proposalCountSelector,
  reverseProposalInfosSelector,
} from './common'
import {
  ProposalInnerContentDisplay,
  ProposalLine,
  ProposalStatusAndInfo,
  ProposalVoteTally,
  ProposalVoter,
  ProposalVotes,
  ProposalWalletVote,
} from './components'
import { getInstantiateInfo } from './daoCreation'
import {
  fetchPrePropose,
  fetchVetoConfig,
  makeGetProposalInfo,
} from './functions'
import {
  useCastVote,
  useLoadingProposalExecutionTxHash,
  useLoadingProposalStatus,
  useLoadingVoteOptions,
  useLoadingWalletVoteInfo,
  useProposalDaoInfoCards,
  useProposalRefreshers,
} from './hooks'
import { DaoCreationExtraVotingConfig, NewProposalForm } from './types'

export const DaoProposalMultipleAdapter: ProposalModuleAdapter<
  DaoCreationExtraVotingConfig,
  MultipleChoiceVote,
  NewProposalForm
> = {
  id: DaoProposalMultipleAdapterId,
  contractNames: DAO_PROPOSAL_MULTIPLE_CONTRACT_NAMES,

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
          choices: [],
        }),
        newProposalFormTitleKey: 'title',
        updateConfigActionMaker:
          makeUpdateProposalConfigActionMaker(proposalModule),
        updatePreProposeConfigActionMaker:
          makeUpdatePreProposeConfigActionMaker(proposalModule),
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

      // No multiple choice approval flow yet.
      useLoadingPreProposeApprovalProposal: () => ({
        loading: false,
        data: undefined,
      }),
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
    },
  }),

  queries: {
    proposalCount: {
      indexerFormula: 'daoProposalMultiple/proposalCount',
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
    getInstantiateInfo,
  },
}
