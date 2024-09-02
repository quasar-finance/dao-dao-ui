import clsx from 'clsx'
import { useTranslation } from 'react-i18next'

import { BaseProfileCardMemberInfoProps, LoadingData } from '@dao-dao/types'
import { formatPercentOf100 } from '@dao-dao/utils'

export interface ProfileCardMemberInfoProps
  extends Omit<BaseProfileCardMemberInfoProps, 'maxGovernanceTokenDeposit'> {
  daoName: string
  votingPower: LoadingData<number>
}

export const ProfileCardMemberInfo = ({
  daoName,
  votingPower,
  cantVoteOnProposal,
}: ProfileCardMemberInfoProps) => {
  const { t } = useTranslation()

  return cantVoteOnProposal ? (
    <p className="caption-text">
      {t('info.notMemberForProposal', {
        daoName,
      })}
    </p>
  ) : votingPower.loading || votingPower.data > 0 ? (
    <div className="body-text flex flex-row items-center justify-between">
      <p>{t('title.votingPower')}</p>
      <p
        className={clsx(
          'font-mono text-text-brand-secondary',
          votingPower.loading && 'animate-pulse'
        )}
      >
        {votingPower.loading ? '...' : formatPercentOf100(votingPower.data)}
      </p>
    </div>
  ) : (
    <p className="secondary-text">
      {t('info.membershipDaoNotMemberInfo', {
        daoName,
      })}
    </p>
  )
}
