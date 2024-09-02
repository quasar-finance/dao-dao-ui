import { ComponentMeta, ComponentStory } from '@storybook/react'

import { makeDaoCardProps } from '../DaoCard.stories'
import { DaoCreatedModal } from './DaoCreatedModal'

export default {
  title:
    'DAO DAO / packages / stateless / components / dao / create / DaoCreatedModal',
  component: DaoCreatedModal,
} as ComponentMeta<typeof DaoCreatedModal>

const Template: ComponentStory<typeof DaoCreatedModal> = (args) => (
  <DaoCreatedModal {...args} />
)

export const Default = Template.bind({})
Default.args = {
  modalProps: {
    onClose: () => alert('close'),
  },
  itemProps: {
    ...makeDaoCardProps(),
    info: {
      ...makeDaoCardProps().info,
      parentDao: null,
    },
  },
}
Default.parameters = {
  design: {
    type: 'figma',
    url: 'https://www.figma.com/file/ZnQ4SMv8UUgKDZsR5YjVGH/Dao-2.0?node-id=983%3A47531',
  },
}

export const SubDao = Template.bind({})
SubDao.args = {
  ...Default.args,
  itemProps: makeDaoCardProps(),
}
