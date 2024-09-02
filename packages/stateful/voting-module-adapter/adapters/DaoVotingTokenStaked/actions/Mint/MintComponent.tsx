import {
  ArrowRightAltRounded,
  SubdirectoryArrowRightRounded,
} from '@mui/icons-material'
import clsx from 'clsx'
import { ComponentType, useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import useDeepCompareEffect from 'use-deep-compare-effect'

import {
  InputErrorMessage,
  NumberInput,
  StatusCard,
  useChain,
  useDetectWrap,
} from '@dao-dao/stateless'
import {
  ActionComponent,
  ActionKey,
  AddressInputProps,
  GenericToken,
} from '@dao-dao/types'
import {
  convertMicroDenomToDenomWithDecimals,
  makeValidateAddress,
  validatePositive,
  validateRequired,
} from '@dao-dao/utils'

import { useActionOptions } from '../../../../../actions'
import { UpdateMinterAllowanceData } from '../UpdateMinterAllowance/UpdateMinterAllowanceComponent'

export type MintData = {
  recipient: string
  amount: number
}

export type MintOptions = {
  govToken: GenericToken
  AddressInput: ComponentType<AddressInputProps<MintData>>
}

export const MintComponent: ActionComponent<MintOptions> = ({
  fieldNamePrefix,
  errors,
  isCreating,
  options: { govToken, AddressInput },
  allActionsWithData,
  index,
  addAction,
}) => {
  const { t } = useTranslation()
  const { address } = useActionOptions()
  const { register, watch, setValue, getValues } = useFormContext<MintData>()
  const { bech32_prefix: bech32Prefix } = useChain()

  const amount = watch((fieldNamePrefix + 'amount') as 'amount')

  const { containerRef, childRef, wrapped } = useDetectWrap()
  const Icon = wrapped ? SubdirectoryArrowRightRounded : ArrowRightAltRounded

  // Ensure an UpdateMinterAllowance action exists before this one for the
  // needed amount, or create/update otherwise. The needed amount is the sum of
  // all mint actions.
  const totalAmountNeeded = allActionsWithData
    .filter(({ actionKey }) => actionKey === ActionKey.Mint)
    .reduce(
      (acc, { data }) => acc + ((data as MintData | undefined)?.amount || 0),
      0
    )
  const firstMintActionIndex = allActionsWithData.findIndex(
    ({ actionKey }) => actionKey === ActionKey.Mint
  )
  const updateMinterAllowanceActionIndex = allActionsWithData.findIndex(
    ({ actionKey, data }) =>
      actionKey === ActionKey.UpdateMinterAllowance &&
      (data as UpdateMinterAllowanceData | undefined)?.minter === address
  )
  // Prevents double-add on initial render.
  const created = useRef(false)
  useDeepCompareEffect(() => {
    if (
      !isCreating ||
      !addAction ||
      // If this is not the first mint action, don't do anything.
      firstMintActionIndex !== index
    ) {
      return
    }

    // If no action exists, create one right before.
    if (updateMinterAllowanceActionIndex === -1) {
      // Prevents double-add on initial render.
      if (created.current) {
        return
      }
      created.current = true

      addAction(
        {
          actionKey: ActionKey.UpdateMinterAllowance,
          data: {
            minter: address,
            allowance: amount,
          } as UpdateMinterAllowanceData,
        },
        index
      )
    } else {
      // Path to the allowance field on the update minter allowance action.
      const existingAllowanceFieldName = fieldNamePrefix.replace(
        new RegExp(`${index}\\.data.$`),
        `${updateMinterAllowanceActionIndex}.data.allowance`
      )

      // Otherwise if the amount isn't correct, update the existing one.
      if (getValues(existingAllowanceFieldName as any) !== totalAmountNeeded) {
        setValue(existingAllowanceFieldName as any, totalAmountNeeded)
      }
    }
  }, [
    addAction,
    address,
    amount,
    fieldNamePrefix,
    firstMintActionIndex,
    getValues,
    index,
    isCreating,
    setValue,
    totalAmountNeeded,
    updateMinterAllowanceActionIndex,
  ])

  return (
    <>
      <StatusCard
        className="max-w-prose"
        content={t('info.mintExplanation')}
        style="warning"
      />

      <div
        className="flex min-w-0 flex-row flex-wrap items-stretch justify-between gap-x-3 gap-y-1"
        ref={containerRef}
      >
        <NumberInput
          disabled={!isCreating}
          error={errors?.amount}
          fieldName={(fieldNamePrefix + 'amount') as 'amount'}
          min={convertMicroDenomToDenomWithDecimals(1, govToken.decimals)}
          register={register}
          setValue={setValue}
          step={convertMicroDenomToDenomWithDecimals(1, govToken.decimals)}
          unit={'$' + govToken.symbol}
          validation={[validateRequired, validatePositive]}
          watch={watch}
        />

        <div
          className="flex min-w-0 grow flex-row items-stretch gap-2 sm:gap-3"
          ref={childRef}
        >
          <div
            className={clsx('flex flex-row items-center', wrapped && 'pl-1')}
          >
            <Icon className="!h-6 !w-6 text-text-secondary" />
          </div>

          <AddressInput
            containerClassName="grow"
            disabled={!isCreating}
            error={errors?.recipient}
            fieldName={(fieldNamePrefix + 'recipient') as 'recipient'}
            register={register}
            validation={[validateRequired, makeValidateAddress(bech32Prefix)]}
          />
        </div>
      </div>

      {(errors?.amount || errors?.recipient) && (
        <div className="-mt-4 flex flex-col gap-1">
          <InputErrorMessage error={errors?.amount} />
          <InputErrorMessage error={errors?.recipient} />
        </div>
      )}
    </>
  )
}
