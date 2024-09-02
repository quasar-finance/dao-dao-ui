import { DaoCreationCommonVotingConfigItems } from '@dao-dao/types'

import { makeAllowRevotingVotingConfigItem } from './AllowRevotingVotingConfigItem'
import { makeApproverVotingConfigItem } from './ApproverVotingConfigItem'
import { makeMultipleChoiceVotingConfigItem } from './MultipleChoiceVotingConfigItem'
import { makeProposalDepositVotingConfigItem } from './ProposalDepositVotingConfigItem'
import { makeProposalExecutionPolicyVotingConfigItem } from './ProposalExecutionPolicyVotingConfigItem'
import { makeProposalSubmissionPolicyVotingConfigItem } from './ProposalSubmissionPolicyVotingConfigItem'
import { makeQuorumVotingConfigItem } from './QuorumVotingConfigItem'
import { makeVetoVotingConfigItem } from './VetoVotingConfigItem'
import { makeVotingDurationVotingConfigItem } from './VotingDurationVotingConfigItem'

export const loadCommonVotingConfigItems =
  (): DaoCreationCommonVotingConfigItems => ({
    items: [
      makeVotingDurationVotingConfigItem(),
      makeProposalDepositVotingConfigItem(),
      makeMultipleChoiceVotingConfigItem(),
    ],
    advancedItems: [
      makeQuorumVotingConfigItem(),
      makeAllowRevotingVotingConfigItem(),
      makeProposalSubmissionPolicyVotingConfigItem(),
      makeProposalExecutionPolicyVotingConfigItem(),
      makeApproverVotingConfigItem(),
      makeVetoVotingConfigItem(),
    ],
  })
