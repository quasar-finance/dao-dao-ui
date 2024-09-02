import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  AddressInput,
  InputErrorMessage,
  InputLabel,
  StatusCard,
  useChain,
} from '@dao-dao/stateless'
import { ActionComponent } from '@dao-dao/types/actions'
import { makeValidateAddress, validateRequired } from '@dao-dao/utils'

import { useActionOptions } from '../../../react/context'

export interface UpdateAdminOptions {
  contractAdmin: string | undefined
}

export const UpdateAdminComponent: ActionComponent<UpdateAdminOptions> = ({
  fieldNamePrefix,
  errors,
  isCreating,
  options: { contractAdmin },
}) => {
  const { t } = useTranslation()
  const { address } = useActionOptions()
  const { bech32_prefix: bech32Prefix } = useChain()
  const { register } = useFormContext()

  return (
    <>
      <p className="secondary-text max-w-prose">
        {t('form.updateAdminDescription')}
      </p>

      <div className="flex flex-row flex-wrap gap-2">
        <div className="flex grow flex-col gap-1">
          <InputLabel name={t('form.smartContractAddress')} />
          <AddressInput
            disabled={!isCreating}
            error={errors?.contract}
            fieldName={fieldNamePrefix + 'contract'}
            register={register}
            validation={[validateRequired, makeValidateAddress(bech32Prefix)]}
          />
          <InputErrorMessage error={errors?.tokenAddress} />
        </div>
        <div className="flex grow flex-col gap-1">
          <InputLabel name={t('form.admin')} />
          <AddressInput
            disabled={!isCreating}
            error={errors?.newAdmin}
            fieldName={fieldNamePrefix + 'newAdmin'}
            register={register}
            validation={[validateRequired, makeValidateAddress(bech32Prefix)]}
          />
          <InputErrorMessage error={errors?.tokenAddress} />
        </div>
      </div>

      {contractAdmin !== address && (
        <StatusCard content={t('info.notAdmin')} style="warning" />
      )}
    </>
  )
}
