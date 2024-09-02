import { ComponentMeta, ComponentStory } from '@storybook/react'

import { EntityDisplay } from '@dao-dao/stateless/components/EntityDisplay'
import { Default as ConnectWalletStory } from '@dao-dao/stateless/components/wallet/ConnectWallet.stories'
import { CHAIN_ID } from '@dao-dao/storybook'
import { EntityType } from '@dao-dao/types'

import { Trans } from '../../../../../../../../components'
import { Survey, SurveyStatus } from '../../../../types'
import { Submit } from './Submit'

export default {
  title:
    'DAO DAO / packages / stateful / widgets / widgets / RetroactiveCompensation / components / stateless / pages / Submit',
  component: Submit,
  excludeStories: ['makeSurvey'],
} as ComponentMeta<typeof Submit>

const Template: ComponentStory<typeof Submit> = (args) => <Submit {...args} />

let surveyId = 1

export const makeSurvey = (): Survey => ({
  uuid: (surveyId++).toString(),
  status: SurveyStatus.AcceptingContributions,
  name: 'DAO DAO Contributor Drop November 2022',
  contributionsOpenAt: '2022-11-21T08:00:00.000Z',
  contributionsCloseRatingsOpenAt: '2022-12-09T08:00:00.000Z',
  ratingsCloseAt: '2022-12-16T08:00:00.000Z',
  contributionInstructions:
    "Thank you for contributing to DAO DAO!\n\nThis intake form will walk you through how to register contributions you made\nbetween **November 1 and November 30, 2022**.\n\n**_Refer to the DF's [Desired Work\nToday](https://hackmd.io/Bhd_xYwAQmW8596_AR16Lg) document as you fill out your\nresponses._**\n\nResponses are due on **Dec 9, 2022 - 12pm (noon) PDT**.\n\nWe recommend you write a brief, bullet-point list. For each item, consider a\n_maximum_ three-sentence description (1) introducing the problem (2) describing\nwhat you did and (3) describing why that contribution matters for DAO DAO.\n\n**DO NOT** list every detail. These will be reviewed by people who also work on\nDAO DAO. We know you. This is your chance to brag about the best stuff you did!\n\nHere are a few examples for inspiration:\n\n- **Created DAO DAO shirts**. DAO DAO needs to spread knowledge of its goodness,\n  and t-shirts are currently our primary non-digital means to 'show not tell'\n  our unique perspective and vibe. I produced t-shirts for our team to wear.\n  Personal conversations with DAO members attest to the shirts' success at this\n  mission.\n\n- **Wrote \"How to Contribute to the Frontend\" documentation**. Relative to our\n  smart contracts, we have had trouble onboarding new contributors to the UI,\n  which makes the UI hard to maintain and develop. I wrote documentation that\n  helps quickstart new users. This documentation has already helped onboard a\n  new frontend contributor, a testament to its efficacy. \n\n- **Wrote `ProfileVoteCard` component**. The v2 UI includes lots of improvements\nto clarity, particularly around actions for the user to perform. This small but\nmighty component enables voting in the new UI.",
  ratingInstructions:
    'Please use the sliders below to express how you think compensation should be\ndistributed among contributors this month.\n\nIf you are **_at all unsure_** what to rate a contributor, check **_"Don\'t\nknow/Not sure."_** Only rate contributors whose contributions you are absolutely\ncertain you understand the value of to DAO DAO.',
  attributes: [
    {
      name: 'Community impact',
      nativeTokens: [],
      cw20Tokens: [
        {
          address: 'usdc',
          amount: '18700045900',
        },
      ],
    },
    {
      name: 'Financial value',
      nativeTokens: [
        {
          denom: 'ujuno',
          amount: '25000000000',
        },
      ],
      cw20Tokens: [],
    },
  ],
  proposalId: null,
  createdAtBlockHeight: 1,
  contributionCount: 1,
})

export const Default = Template.bind({})
Default.args = {
  connected: true,
  status: {
    survey: makeSurvey(),
    contribution: {
      content: 'this is my contribution\n\npls give me money',
      files: [],
      selfRatings: null,
    },
    rated: false,
  },
  onSubmit: async (data) => alert('submit: ' + JSON.stringify(data)),
  loading: false,
  loadingEntity: {
    loading: false,
    data: {
      type: EntityType.Wallet,
      chainId: CHAIN_ID,
      address: 'walletPerson',
      name: 'wallet Person!',
      imageUrl: '/placeholders/1.svg',
    },
  },
  EntityDisplay: () => (
    <EntityDisplay
      address="juno123"
      loadingEntity={{
        loading: false,
        data: {
          type: EntityType.Wallet,
          chainId: CHAIN_ID,
          address: 'walletPerson',
          name: 'wallet Person!',
          imageUrl: '/placeholders/1.svg',
        },
      }}
    />
  ),
  ConnectWallet: () => <ConnectWalletStory {...ConnectWalletStory.args} />,
  Trans,
}
