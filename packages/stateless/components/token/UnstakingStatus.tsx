import { CheckCircle, Paid, Timelapse } from '@mui/icons-material'
import clsx from 'clsx'
import { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'

import { UnstakingTaskStatus } from '@dao-dao/types'

import { StatusDisplay } from '../StatusDisplay'

export { UnstakingTaskStatus }

export interface UnstakingStatusProps {
  status: UnstakingTaskStatus
}

export const UnstakingStatus = ({ status }: UnstakingStatusProps) => {
  const { t } = useTranslation()
  const { Icon, iconClassName, textClassName } = UnstakingTaskStatusMap[status]

  return (
    <StatusDisplay
      Icon={Icon}
      iconClassName={clsx('!h-[19px] !w-[19px]', iconClassName)}
      label={t(`info.unstakingStatus.${status}`)}
      labelClassName={textClassName}
    />
  )
}

export const UnstakingTaskStatusMap: Record<
  UnstakingTaskStatus,
  {
    Icon: ComponentType<{ className: string }>
    iconClassName: string
    textClassName: string
  }
> = {
  [UnstakingTaskStatus.Unstaking]: {
    Icon: Timelapse,
    iconClassName: 'text-icon-primary',
    textClassName: 'body-text',
  },
  [UnstakingTaskStatus.ReadyToClaim]: {
    Icon: Paid,
    iconClassName: 'text-icon-primary',
    textClassName: 'body-text',
  },
  [UnstakingTaskStatus.Claimed]: {
    Icon: CheckCircle,
    iconClassName: 'text-icon-interactive-valid',
    textClassName: 'text-text-interactive-valid',
  },
}
