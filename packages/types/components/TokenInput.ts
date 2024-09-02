import { ReactNode, RefCallback } from 'react'
import {
  FieldValues,
  Path,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  Validate,
} from 'react-hook-form'

import { LoadingData } from '../misc'
import { GenericToken, TokenType } from '../token'
import { NumberInputProps } from './NumberInput'

export type TokenInputOption = Omit<GenericToken, 'type' | 'decimals'> & {
  type: TokenType | string
  description?: string
  // Only necessary if `convertMicroDenom` is true so the input can
  // intelligently convert the value. 0 will be used if not provided.
  decimals?: number
}

export type TokenInputProps<
  T extends TokenInputOption,
  FV extends FieldValues = FieldValues,
  FieldName extends Path<FV> = Path<FV>
> = {
  /**
   * The fields that control the amount input.
   */
  amount?: Omit<
    NumberInputProps<FV, FieldName>,
    | 'containerClassName'
    | 'disabled'
    | 'transformDecimals'
    | 'register'
    | 'watch'
    | 'setValue'
    | 'fieldName'
  > & {
    register: UseFormRegister<FV>
    watch: UseFormWatch<FV>
    setValue: UseFormSetValue<FV>
    fieldName: FieldName
    validations?: Validate<number>[]
    /*
     * If true, will convert the amount to micro-denom using the token's
     * decimals value for the form. Thus, the input will display the macro-denom
     * amount, but the form will receive the micro-denom amount. Default is
     * false.
     */
    convertMicroDenom?: boolean
  }
  /**
   * The available tokens and selection handlers for the token. Various
   * use-cases exist for this component, so the token selection is left up to
   * the caller instead of being handled internally like the amount field.
   *
   * The pair of `type` and `denomOrAddress` must be unique for each token.
   */
  tokens: LoadingData<T[]>
  /**
   * Optionally hide these tokens from the dropdown. This is useful to hide
   * tokens that have already been selected.
   */
  hideTokens?: T[]
  /**
   * The selected token.
   */
  selectedToken: Pick<T, 'chainId' | 'type' | 'denomOrAddress'> | undefined
  /**
   * Fallback when no token is selected. If nothing is provided, a placeholder
   * text will be shown instead ("Select token").
   */
  tokenFallback?: ReactNode
  /**
   * Whether or not the inputs are editable. This is different from read-only
   * below. Disabled is a more temporary input state, potentially due to a
   * dependency on some other field, for example.
   */
  disabled?: boolean
  /**
   * If read-only, the inputs will be replaced with a nice display of the
   * selected token and amount.
   */
  readOnly?: boolean
  /**
   * This only applies to the amount field.
   *
   * Defaults to true.
   */
  required?: boolean
  /**
   * Optional additional class names for the container.
   */
  containerClassName?: string
  /**
   * Optionally show the chain image over the token image.
   */
  showChainImage?: boolean
  /**
   * Optionally set the ref of the amount container element.
   */
  containerRef?: RefCallback<HTMLInputElement>

  // Make the `token` argument of `onSelectToken` optional iff allowing custom
  // token selection.
} & (
  | {
      /**
       * Callback when a token is selected.
       */
      onSelectToken: (token: T) => void
      /**
       * Optionally allow showing a text field to enter a custom token denom.
       */
      allowCustomToken?: false
      /**
       * Callback when the custom token input changes.
       */
      onCustomTokenChange?: never
    }
  | {
      /**
       * Callback when a token is selected. If undefined, the custom token was
       * selected.
       */
      onSelectToken: (token?: T) => void
      /**
       * Optionally allow showing a text field to enter a custom token denom.
       */
      allowCustomToken: true
      /**
       * Callback when the custom token input changes.
       */
      onCustomTokenChange: (input: string) => void
    }
)
