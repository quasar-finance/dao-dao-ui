import { ComponentMeta, ComponentStory } from '@storybook/react'
import { useState } from 'react'

import { DaoPageWrapperDecorator } from '@dao-dao/storybook/decorators'

import { ButtonLink } from '../../buttons'
import { LinkWrapper } from '../../LinkWrapper'
import { DaoCard } from '../DaoCard'
import { makeDaoCardProps } from '../DaoCard.stories'
import { SubDaosTab } from './SubDaosTab'

export default {
  title:
    'DAO DAO / packages / stateless / components / dao / tabs / SubDaosTab',
  component: SubDaosTab,
  decorators: [DaoPageWrapperDecorator],
} as ComponentMeta<typeof SubDaosTab>

const Template: ComponentStory<typeof SubDaosTab> = (args) => {
  const [following, setFollowing] = useState<string[]>([])

  return (
    <SubDaosTab
      {...args}
      DaoCard={(props) => (
        <DaoCard
          {...props}
          LinkWrapper={LinkWrapper}
          follow={{
            following: following.includes(props.info.coreAddress),
            updatingFollowing: false,
            onFollow: () =>
              setFollowing((current) =>
                current.includes(props.info.coreAddress)
                  ? current.filter((a) => a !== props.info.coreAddress)
                  : [...current, props.info.coreAddress]
              ),
          }}
          lazyData={{ loading: true, errored: false }}
        />
      )}
    />
  )
}

export const Default = Template.bind({})
Default.args = {
  isMember: true,
  subDaos: {
    loading: false,
    errored: false,
    data: [
      {
        ...makeDaoCardProps(1).info,
        name: 'Development Fund',
        description: 'Manages our development and strategy.',
      },
      {
        ...makeDaoCardProps(2).info,
        name: 'Validator',
        description: 'Runs our validator.',
      },
      {
        ...makeDaoCardProps(3).info,
        name: 'Security',
        description: 'Protects us from those who seek to destroy us.',
      },
      {
        ...makeDaoCardProps(4).info,
        name: 'Meme Machine',
        description: 'Generates memeable content for the sake of the memes.',
      },
    ],
  },
  createSubDaoHref: '#',
  upgradeToV2Href: '#',
  ButtonLink,
}

export const Loading = Template.bind({})
Loading.args = {
  ...Default.args,
  subDaos: { loading: true, errored: false },
}
