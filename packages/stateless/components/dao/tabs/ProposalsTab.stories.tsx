import { ComponentMeta, ComponentStory } from '@storybook/react'

import { DaoPageWrapperDecorator } from '@dao-dao/storybook/decorators'

import { useDaoInfoContext } from '../../../contexts/Dao'
import { ButtonLink } from '../../buttons'
import {
  ProposalLineProps,
  ProposalList,
  ProposalListProps,
} from '../../proposal'
import * as ProposalListStories from '../../proposal/ProposalList.stories'
import { ProposalsTab } from './ProposalsTab'

export default {
  title:
    'DAO DAO / packages / stateless / components / dao / tabs / ProposalsTab',
  component: ProposalsTab,
  decorators: [DaoPageWrapperDecorator],
} as ComponentMeta<typeof ProposalsTab>

const Template: ComponentStory<typeof ProposalsTab> = (args) => (
  <ProposalsTab {...args} daoInfo={useDaoInfoContext()} />
)

export const Default = Template.bind({})
Default.args = {
  ProposalList: () => (
    <ProposalList
      {...(ProposalListStories.Default.args as ProposalListProps<
        ProposalLineProps & { proposalId: string }
      >)}
    />
  ),
  ButtonLink,
}

export const None = Template.bind({})
None.args = {
  ...Default.args,
  ProposalList: () => (
    <ProposalList
      {...(ProposalListStories.None.args as ProposalListProps<
        ProposalLineProps & { proposalId: string }
      >)}
    />
  ),
  ButtonLink,
}
