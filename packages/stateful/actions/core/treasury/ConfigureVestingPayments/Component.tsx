import { useTranslation } from 'react-i18next'

import { VestingPaymentsWidgetData } from '@dao-dao/types'
import { ActionComponent } from '@dao-dao/types/actions'

import { VestingPaymentsEditor } from '../../../../widgets/widgets/VestingPayments/VestingPaymentsEditor'
import { useActionOptions } from '../../../react'

export const ConfigureVestingPaymentsComponent: ActionComponent<
  undefined,
  VestingPaymentsWidgetData
> = (props) => {
  const { t } = useTranslation()
  const options = useActionOptions()

  return (
    <>
      <p className="body-text max-w-prose">
        {t('info.vestingPaymentsDescription')}
      </p>

      <VestingPaymentsEditor
        {...props}
        accounts={options.context.accounts}
        options={options}
        type="action"
      />
    </>
  )
}
