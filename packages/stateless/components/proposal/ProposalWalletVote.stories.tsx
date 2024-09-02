import { ComponentMeta, ComponentStory } from '@storybook/react'

import { ProposalWalletVoteClassNameMap } from '@dao-dao/stateful/proposal-module-adapter/adapters/DaoProposalSingle/components/ProposalWalletVote'

import { ProposalWalletVote } from './ProposalWalletVote'

export default {
  title:
    'DAO DAO / packages / stateless / components / proposal / ProposalWalletVote',
  component: ProposalWalletVote,
} as ComponentMeta<typeof ProposalWalletVote>

const Template: ComponentStory<typeof ProposalWalletVote> = (args) => (
  <ProposalWalletVote {...args} />
)

export const Pending = Template.bind({})
Pending.args = {
  className: ProposalWalletVoteClassNameMap['pending'],
  label: 'Pending',
  showBadge: true,
}
Pending.parameters = {
  design: {
    type: 'figma',
    url: 'https://www.figma.com/file/ZnQ4SMv8UUgKDZsR5YjVGH/DAO-DAO-2.0?node-id=312%3A28036',
  },
}

export const Yes = Template.bind({})
Yes.args = {
  className: ProposalWalletVoteClassNameMap.yes,
  label: 'Yes',
  showBadge: false,
}
Yes.parameters = Pending.parameters

export const No = Template.bind({})
No.args = {
  className: ProposalWalletVoteClassNameMap.no,
  label: 'No',
  showBadge: false,
}
No.parameters = Pending.parameters

export const Abstain = Template.bind({})
Abstain.args = {
  className: ProposalWalletVoteClassNameMap.abstain,
  label: 'Abstain',
  showBadge: false,
}
Abstain.parameters = Pending.parameters
