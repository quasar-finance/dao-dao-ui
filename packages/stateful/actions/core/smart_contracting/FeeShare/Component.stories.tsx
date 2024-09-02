import { ComponentMeta, ComponentStory } from '@storybook/react'

import { makeReactHookFormDecorator } from '@dao-dao/storybook'
import { MsgRegisterFeeShare } from '@dao-dao/types/protobuf/codegen/juno/feeshare/v1/tx'

import { AddressInput } from '../../../../components/AddressInput'
import { FeeShareComponent, FeeShareData } from './Component'

export default {
  title:
    'DAO DAO / packages / stateful / actions / core / smart_contracting / FeeShare',
  component: FeeShareComponent,
  decorators: [
    makeReactHookFormDecorator<FeeShareData>({
      contract: '',
      showWithdrawer: false,
      typeUrl: MsgRegisterFeeShare.typeUrl,
      withdrawer: '',
    }),
  ],
} as ComponentMeta<typeof FeeShareComponent>

const Template: ComponentStory<typeof FeeShareComponent> = (args) => (
  <FeeShareComponent {...args} />
)

export const Default = Template.bind({})
Default.args = {
  fieldNamePrefix: '',
  allActionsWithData: [],
  index: 0,
  data: {},
  isCreating: true,
  errors: {},
  options: {
    AddressInput,
  },
}
