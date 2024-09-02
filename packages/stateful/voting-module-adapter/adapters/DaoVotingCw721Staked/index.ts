import {
  ImageRounded,
  PeopleAltOutlined,
  PeopleAltRounded,
} from '@mui/icons-material'

import { MainDaoInfoCardsTokenLoader } from '@dao-dao/stateless'
import {
  ActionCategoryKey,
  DaoTabId,
  VotingModuleAdapter,
} from '@dao-dao/types'
import {
  DAO_VOTING_CW721_STAKED_CONTRACT_NAMES,
  isSecretNetwork,
} from '@dao-dao/utils'

import { makeUpdateStakingConfigAction } from './actions'
import {
  MembersTab,
  NftCollectionTab,
  ProfileCardMemberInfo,
} from './components'
import {
  useCommonGovernanceTokenInfo,
  useMainDaoInfoCards,
  useVotingModuleRelevantAddresses,
} from './hooks'

export const DaoVotingCw721StakedAdapter: VotingModuleAdapter = {
  id: 'DaoVotingCw721Staked',
  contractNames: DAO_VOTING_CW721_STAKED_CONTRACT_NAMES,

  load: ({ chainId }) => ({
    // Hooks
    hooks: {
      useMainDaoInfoCards,
      useVotingModuleRelevantAddresses,
      useCommonGovernanceTokenInfo,
    },

    // Components
    components: {
      extraTabs: [
        // Can't view members on Secret Network.
        ...(isSecretNetwork(chainId)
          ? []
          : [
              {
                id: DaoTabId.Members,
                labelI18nKey: 'title.members',
                Component: MembersTab,
                Icon: PeopleAltOutlined,
                IconFilled: PeopleAltRounded,
              },
            ]),
        {
          id: DaoTabId.Collection,
          labelI18nKey: 'title.nftCollection',
          Component: NftCollectionTab,
          Icon: ImageRounded,
          IconFilled: ImageRounded,
        },
      ],

      MainDaoInfoCardsLoader: MainDaoInfoCardsTokenLoader,
      ProfileCardMemberInfo,
    },

    // Functions
    fields: {
      actionCategoryMakers: [
        () => ({
          // Add to DAO Governance category.
          key: ActionCategoryKey.DaoGovernance,
          actionMakers: [makeUpdateStakingConfigAction],
        }),
      ],
    },
  }),
}
