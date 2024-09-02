import { PeopleAltOutlined, PeopleAltRounded } from '@mui/icons-material'

import {
  ActionCategoryKey,
  DaoTabId,
  VotingModuleAdapter,
} from '@dao-dao/types'
import {
  DAO_VOTING_CW4_CONTRACT_NAMES,
  DaoVotingCw4AdapterId,
  isSecretNetwork,
} from '@dao-dao/utils'

import { makeManageMembersAction } from './actions'
import {
  MainDaoInfoCardsLoader,
  MembersTab,
  ProfileCardMemberInfo,
} from './components'
import { useMainDaoInfoCards, useVotingModuleRelevantAddresses } from './hooks'

export const DaoVotingCw4Adapter: VotingModuleAdapter = {
  id: DaoVotingCw4AdapterId,
  contractNames: DAO_VOTING_CW4_CONTRACT_NAMES,

  load: ({ chainId }) => ({
    // Hooks
    hooks: {
      useMainDaoInfoCards,
      useVotingModuleRelevantAddresses,
    },

    // Components
    components: {
      // Can't view members on Secret Network.
      extraTabs: isSecretNetwork(chainId)
        ? undefined
        : [
            {
              id: DaoTabId.Members,
              labelI18nKey: 'title.members',
              Component: MembersTab,
              Icon: PeopleAltOutlined,
              IconFilled: PeopleAltRounded,
            },
          ],

      MainDaoInfoCardsLoader,
      ProfileCardMemberInfo,
    },

    // Functions
    fields: {
      actionCategoryMakers: [
        () => ({
          // Add to DAO Governance category.
          key: ActionCategoryKey.DaoGovernance,
          actionMakers: [makeManageMembersAction],
        }),
      ],
    },
  }),
}
