import { ComponentMeta, ComponentStory } from '@storybook/react'

import { ProfileCardMemberInfoTokens } from '@dao-dao/stateful/voting-module-adapter/components/ProfileCardMemberInfoTokens'
import { makeProps as makeProfileCardMemberInfoTokensProps } from '@dao-dao/stateful/voting-module-adapter/components/ProfileCardMemberInfoTokens.stories'
import { WALLET_PROFILE_DATA } from '@dao-dao/storybook'

import { makeProps as makeUnstakingLineProps } from '../token/UnstakingLine.stories'
import { UnstakingTaskStatus } from '../token/UnstakingStatus'
import { ProfileMemberCard, ProfileMemberCardProps } from './ProfileMemberCard'

export default {
  title:
    'DAO DAO / packages / stateless / components / profile / ProfileMemberCard',
  component: ProfileMemberCard,
} as ComponentMeta<typeof ProfileMemberCard>

const Template: ComponentStory<typeof ProfileMemberCard> = (args) => (
  <div className="max-w-xs">
    <ProfileMemberCard {...args} />
  </div>
)

const makeProps = (
  ...args: Parameters<typeof makeProfileCardMemberInfoTokensProps>
): ProfileMemberCardProps => ({
  daoName: 'A Very Real DAO',
  profile: {
    loading: false,
    data: WALLET_PROFILE_DATA,
  },
  membershipInfo: (
    <ProfileCardMemberInfoTokens
      {...makeProfileCardMemberInfoTokensProps(...args)}
    />
  ),
})

export const Default = Template.bind({})
Default.args = makeProps()
Default.parameters = {
  design: {
    type: 'figma',
    url: 'https://www.figma.com/file/ZnQ4SMv8UUgKDZsR5YjVGH/DAO-DAO-2.0?node-id=94%3A14709',
  },
}

export const NothingToClaim = Template.bind({})
NothingToClaim.args = makeProps([
  makeUnstakingLineProps(UnstakingTaskStatus.Unstaking, 'DOG').task,
  makeUnstakingLineProps(UnstakingTaskStatus.Unstaking, 'DOG').task,
  makeUnstakingLineProps(UnstakingTaskStatus.Unstaking, 'DOG').task,
])

export const NoOpenProposals = Template.bind({})
NoOpenProposals.args = {
  ...makeProps(),
  openProposals: false,
}

export const NothingUnstaking = Template.bind({})
NothingUnstaking.args = makeProps([])
