import { Check, Close } from '@mui/icons-material'
import JSON5 from 'json5'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  AddressInput,
  Button,
  CodeMirrorInput,
  CopyToClipboard,
  InputErrorMessage,
  InputLabel,
  NativeCoinSelector,
  NativeCoinSelectorProps,
  NumberInput,
  TextInput,
  useChain,
} from '@dao-dao/stateless'
import { GenericTokenBalance, LoadingData } from '@dao-dao/types'
import { ActionComponent } from '@dao-dao/types/actions'
import {
  getNativeTokenForChainId,
  makeValidateAddress,
  makeWasmMessage,
  validateCosmosMsg,
  validatePositive,
  validateRequired,
} from '@dao-dao/utils'

export type Instantiate2Options = {
  nativeBalances: LoadingData<GenericTokenBalance[]>
  instantiatedAddress?: string
}

export const Instantiate2Component: ActionComponent<Instantiate2Options> = (
  props
) => {
  const {
    fieldNamePrefix,
    errors,
    isCreating,
    options: { instantiatedAddress },
  } = props

  const { t } = useTranslation()
  const { chain_id: chainId, bech32_prefix: bech32Prefix } = useChain()

  const { register, control } = useFormContext()
  const {
    fields: coins,
    append: appendCoin,
    remove: removeCoin,
  } = useFieldArray({
    control,
    name: fieldNamePrefix + 'funds',
  })

  return (
    <>
      <div className="flex flex-row items-center gap-6 text-text-primary">
        <InputLabel name={t('form.instantiatedAddress') + ':'} />

        {instantiatedAddress ? (
          <CopyToClipboard
            takeStartEnd={{ start: instantiatedAddress.length, end: 0 }}
            value={instantiatedAddress}
          />
        ) : (
          <p className="caption-text">...</p>
        )}
      </div>

      <div className="flex flex-row items-center gap-2">
        <div className="flex flex-col items-stretch gap-1">
          <InputLabel name={t('form.codeId')} />
          <NumberInput
            disabled={!isCreating}
            error={errors?.codeId}
            fieldName={fieldNamePrefix + 'codeId'}
            register={register}
            sizing="sm"
            step={1}
            validation={[validateRequired, validatePositive]}
          />
          <InputErrorMessage error={errors?.codeId} />
        </div>

        <div className="flex grow flex-col items-stretch gap-1">
          <InputLabel name={t('form.contractLabel')} />
          <TextInput
            disabled={!isCreating}
            error={errors?.label}
            fieldName={fieldNamePrefix + 'label'}
            register={register}
            validation={[validateRequired]}
          />
          <InputErrorMessage error={errors?.label} />
        </div>
      </div>

      <div className="flex grow flex-col items-stretch gap-1">
        <InputLabel name={t('form.salt')} />
        <TextInput
          disabled={!isCreating}
          error={errors?.salt}
          fieldName={fieldNamePrefix + 'salt'}
          register={register}
          validation={[validateRequired]}
        />
        <InputErrorMessage error={errors?.salt} />
      </div>

      <div className="flex flex-col gap-1">
        <InputLabel name={t('form.message')} />
        <CodeMirrorInput
          control={control}
          error={errors?.message}
          fieldName={fieldNamePrefix + 'message'}
          readOnly={!isCreating}
          validation={[
            (v: string) => {
              let msg
              try {
                msg = JSON5.parse(v)
              } catch (err) {
                return err instanceof Error ? err.message : `${err}`
              }
              msg = makeWasmMessage({
                wasm: {
                  instantiate: {
                    admin: null,
                    code_id: 0,
                    funds: [],
                    label: '',
                    msg,
                  },
                },
              })

              try {
                validateCosmosMsg(msg)
              } catch (err) {
                return err instanceof Error ? err.message : `${err}`
              }

              return true
            },
          ]}
        />

        {errors?.message ? (
          <p className="mt-1 flex items-center gap-1 text-sm text-text-interactive-error">
            <Close className="!h-5 !w-5" />{' '}
            <span>{errors.message.message}</span>
          </p>
        ) : (
          <p className="mt-1 flex items-center gap-1 text-sm text-text-interactive-valid">
            <Check className="!h-5 w-5" /> {t('info.jsonIsValid')}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <InputLabel name={t('form.funds')} />
        <div className="flex flex-col items-stretch gap-2">
          {coins.map(({ id }, index) => (
            <NativeCoinSelector
              key={id}
              {...({
                ...props,
                onRemove: props.isCreating
                  ? () => removeCoin(index)
                  : undefined,
                chainId,
              } as NativeCoinSelectorProps)}
              errors={errors?.funds?.[index]}
              fieldNamePrefix={fieldNamePrefix + `funds.${index}.`}
            />
          ))}
          {!isCreating && coins.length === 0 && (
            <p className="mt-1 mb-2 text-xs italic text-text-tertiary">
              {t('info.none')}
            </p>
          )}
          {isCreating && (
            <Button
              className="mb-2 self-start"
              onClick={() =>
                appendCoin({
                  amount: 1,
                  denom: getNativeTokenForChainId(chainId).denomOrAddress,
                })
              }
              variant="secondary"
            >
              {t('button.addPayment')}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-1">
        <InputLabel name={`${t('form.admin')} (${t('form.optional')})`} />
        <AddressInput
          disabled={!isCreating}
          error={errors?.admin}
          fieldName={fieldNamePrefix + 'admin'}
          placeholder={!isCreating ? t('info.none') : undefined}
          register={register}
          type="contract"
          validation={[makeValidateAddress(bech32Prefix, false)]}
        />
        <InputErrorMessage error={errors?.admin} />
      </div>
    </>
  )
}
