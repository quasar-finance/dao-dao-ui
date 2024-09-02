import clsx from 'clsx'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  CopyToClipboard,
  StatusCard,
  TokenSwapStatus,
} from '@dao-dao/stateless'
import { ActionComponent, TokenSwapStatusProps } from '@dao-dao/types'

export type ExistingTokenSwapOptions = {
  tokenSwapStatusProps: TokenSwapStatusProps
  status: string
}

// Displayed when displaying an existing token swap.
export const ExistingTokenSwap: ActionComponent<ExistingTokenSwapOptions> = ({
  fieldNamePrefix,
  options: { tokenSwapStatusProps, status },
}) => {
  const { t } = useTranslation()
  const { watch } = useFormContext()

  const tokenSwapContractAddress = watch(
    fieldNamePrefix + 'tokenSwapContractAddress'
  )

  return (
    <>
      <TokenSwapStatus
        {...tokenSwapStatusProps}
        className={clsx(tokenSwapStatusProps.className, 'my-4')}
      />

      <p className="caption-text mt-4 text-center">{status}</p>

      <CopyToClipboard
        className="max-w-full self-center"
        takeAll
        value={tokenSwapContractAddress}
      />

      <StatusCard
        className="max-w-2xl self-center"
        content={t('info.tokenSwapWarning')}
        style="warning"
      />
    </>
  )
}
