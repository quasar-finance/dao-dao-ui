import { Close } from '@mui/icons-material'
import { ComponentProps, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  ActionComponent,
  GenericToken,
  GenericTokenBalance,
  LoadingData,
  TokenType,
} from '@dao-dao/types'
import { convertMicroDenomToDenomWithDecimals } from '@dao-dao/utils'

import { IconButton } from '../icon_buttons'
import { InputErrorMessage, TokenInput } from '../inputs'

export type NativeCoinSelectorProps = Pick<
  ComponentProps<ActionComponent>,
  'fieldNamePrefix' | 'errors' | 'isCreating'
> & {
  /**
   * List of tokens and current balances.
   */
  tokens: LoadingData<GenericTokenBalance[]>
  /**
   * Optionally filter the tokens by chain ID.
   */
  chainId?: string
  /**
   * If defined, shows an X button to the right.
   */
  onRemove?: () => void
  /**
   * Optional class name applied to the container.
   */
  className?: string
  /**
   * Optionally specify a minimum amount.
   */
  min?: number
  /**
   * Don't show a balance warning if they enter more than their loaded balance
   * of the selected token.
   *
   * Defaults to false.
   */
  noBalanceWarning?: boolean
  /**
   * Disallow entering a custom token.
   *
   * Defaults to false.
   */
  noCustomToken?: boolean
}

type NativeCoinForm = {
  denom: string
  amount: number
  decimals: number
}

/**
 * A token input with a common interface used in a few actions. The field name
 * prefix expects to be a prefix for a react-hook-form path that contains
 * amount, denom, and decimals.
 */
export const NativeCoinSelector = ({
  fieldNamePrefix,
  errors,
  isCreating,
  tokens,
  chainId,
  onRemove,
  className,
  min,
  noBalanceWarning = false,
  noCustomToken = false,
}: NativeCoinSelectorProps) => {
  const { t } = useTranslation()

  const denomField = (fieldNamePrefix + 'denom') as 'denom'
  const amountField = (fieldNamePrefix + 'amount') as 'amount'
  const decimalsField = (fieldNamePrefix + 'decimals') as 'decimals'

  const { register, setValue, watch } = useFormContext<NativeCoinForm>()
  const watchDenom = watch(denomField)
  const watchAmount = watch(amountField)
  const watchDecimals = watch(decimalsField) || 0

  const [customToken, setCustomToken] = useState(false)

  const selectedToken =
    customToken || tokens.loading
      ? undefined
      : tokens.data.find(
          ({ token }) =>
            token.type === TokenType.Native &&
            token.denomOrAddress === watchDenom &&
            (!chainId || token.chainId === chainId)
        )
  const balance = convertMicroDenomToDenomWithDecimals(
    selectedToken?.balance ?? 0,
    selectedToken?.token.decimals ?? 0
  )

  const decimals = customToken
    ? watchDecimals
    : selectedToken?.token.decimals || 0

  // A warning if the denom was not found in the treasury or the amount is too
  // high. We don't want to make this an error because often people want to
  // spend funds that a previous action makes available, so just show a warning.
  const symbol = selectedToken?.token.symbol || watchDenom
  const warning =
    !isCreating || tokens.loading || !watchDenom
      ? undefined
      : customToken
      ? t('error.customTokenNoDecimals')
      : noBalanceWarning
      ? undefined
      : !selectedToken
      ? t('error.unknownDenom', { denom: watchDenom })
      : watchAmount > balance
      ? t('error.spendActionInsufficientWarning', {
          amount: balance.toLocaleString(undefined, {
            maximumFractionDigits: decimals,
          }),
          tokenSymbol: symbol,
        })
      : undefined

  const minUnit = convertMicroDenomToDenomWithDecimals(1, decimals)
  const minAmount = min ?? minUnit

  return (
    <div className={className}>
      <div className="flex flex-row items-stretch gap-2">
        <TokenInput<GenericToken, NativeCoinForm>
          amount={{
            watch,
            setValue,
            register,
            fieldName: amountField,
            error: errors?.amount || errors?._error,
            min: minAmount,
            step: minUnit,
          }}
          readOnly={!isCreating}
          selectedToken={selectedToken?.token}
          tokens={
            tokens.loading
              ? { loading: true }
              : {
                  loading: false,
                  data: tokens.data
                    .filter(
                      ({ token }) =>
                        token.type === TokenType.Native &&
                        (!chainId || token.chainId === chainId)
                    )
                    .map(({ token, balance }) => ({
                      ...token,
                      description:
                        t('title.balance') +
                        ': ' +
                        convertMicroDenomToDenomWithDecimals(
                          balance,
                          token.decimals
                        ).toLocaleString(undefined, {
                          maximumFractionDigits: token.decimals,
                        }),
                    })),
                }
          }
          {...(noCustomToken
            ? {
                onSelectToken: ({ denomOrAddress, decimals }) => {
                  setValue(denomField, denomOrAddress)
                  setValue(decimalsField, decimals)
                },
              }
            : // With custom token support.
              {
                allowCustomToken: true,
                onCustomTokenChange: (custom) => setValue(denomField, custom),
                onSelectToken: (token) => {
                  setCustomToken(!token)

                  // Custom token
                  if (!token) {
                    setValue(decimalsField, 0)
                    return
                  }

                  setValue(denomField, token.denomOrAddress)
                  setValue(decimalsField, token.decimals)
                },
              })}
        />

        {isCreating && onRemove && (
          <IconButton
            Icon={Close}
            className="self-center"
            onClick={onRemove}
            size="sm"
            variant="ghost"
          />
        )}
      </div>

      <InputErrorMessage className="-ml-1" error={errors?.amount} />
      <InputErrorMessage className="-ml-1" error={warning} warning />
    </div>
  )
}
