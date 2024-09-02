import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { daoVotingOnftStakedExtraQueries } from '@dao-dao/state'
import { TokenAmountDisplay } from '@dao-dao/stateless'
import { DaoInfoCard } from '@dao-dao/types'
import {
  convertDurationToHumanReadableString,
  formatPercentOf100,
} from '@dao-dao/utils'

import { useQueryLoadingDataWithError } from '../../../../hooks'
import { useVotingModuleAdapterOptions } from '../../../react/context'
import { useGovernanceCollectionInfo } from './useGovernanceCollectionInfo'
import { useStakingInfo } from './useStakingInfo'

export const useMainDaoInfoCards = (): DaoInfoCard[] => {
  const { t } = useTranslation()
  const { chainId, votingModuleAddress } = useVotingModuleAdapterOptions()

  const { loadingTotalStakedValue, unstakingDuration } = useStakingInfo({
    fetchTotalStakedValue: true,
  })

  if (loadingTotalStakedValue === undefined) {
    throw new Error(t('error.loadingData'))
  }

  const {
    collectionInfo: { symbol, totalSupply },
  } = useGovernanceCollectionInfo()

  const queryClient = useQueryClient()
  const loadingMembers = useQueryLoadingDataWithError(
    daoVotingOnftStakedExtraQueries.topStakers(queryClient, {
      chainId,
      address: votingModuleAddress,
    })
  )

  return [
    {
      label: t('title.members'),
      tooltip: t('info.membersTooltip'),
      loading: loadingMembers.loading,
      value: loadingMembers.loading
        ? undefined
        : loadingMembers.errored
        ? '<error>'
        : loadingMembers.data?.length ?? '<error>',
    },
    {
      label: t('title.totalSupply'),
      tooltip: t('info.totalSupplyTooltip', {
        tokenSymbol: symbol,
      }),
      value: (
        <TokenAmountDisplay amount={totalSupply} decimals={0} symbol={symbol} />
      ),
    },
    {
      label: t('title.totalStaked'),
      tooltip: t('info.totalStakedTooltip', {
        tokenSymbol: symbol,
      }),
      value: loadingTotalStakedValue.loading
        ? '...'
        : formatPercentOf100(
            (loadingTotalStakedValue.data / totalSupply) * 100
          ),
    },
    {
      label: t('title.unstakingPeriod'),
      tooltip: t('info.unstakingPeriodTooltip', {
        tokenSymbol: symbol,
      }),
      value: unstakingDuration
        ? convertDurationToHumanReadableString(t, unstakingDuration)
        : t('info.none'),
    },
  ]
}
