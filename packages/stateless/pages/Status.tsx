import { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'

import { StatefulChainStatusProps } from '@dao-dao/types'
import { getSupportedChains } from '@dao-dao/utils'

export type StatusProps = {
  ChainStatus: ComponentType<StatefulChainStatusProps>
}

export const Status = ({ ChainStatus }: StatusProps) => {
  const { t } = useTranslation()

  const chains = getSupportedChains({ hasIndexer: true })

  return (
    <div className="flex flex-col gap-2">
      <p className="primary-text mb-4">{t('info.statusPageDescription')}</p>

      {chains.map(({ chainId }) => (
        <ChainStatus key={chainId} chainId={chainId} />
      ))}
    </div>
  )
}
