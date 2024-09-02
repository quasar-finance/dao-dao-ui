import { useTranslation } from 'react-i18next'
import { useRecoilValue, waitForAllSettled } from 'recoil'

import { navigatingToHrefAtom, searchDaosSelector } from '@dao-dao/state/recoil'
import { useCachedLoadable, useDaoNavHelpers } from '@dao-dao/stateless'
import {
  CommandModalContextSection,
  CommandModalContextSectionItem,
  CommandModalContextUseSectionsOptions,
  CommandModalDaoInfo,
  ContractVersion,
} from '@dao-dao/types'
import {
  getConfiguredChains,
  getDisplayNameForChainId,
  getFallbackImage,
  getImageUrlForChainId,
  getSupportedChains,
  mustGetConfiguredChainConfig,
  parseContractVersion,
} from '@dao-dao/utils'

import {
  useLoadingFeaturedDaoCards,
  useLoadingFollowingDaos,
} from '../../hooks'

export interface UseFilteredDaosSectionOptions {
  options: CommandModalContextUseSectionsOptions
  onChoose: CommandModalContextSection<CommandModalDaoInfo>['onChoose']
  limit?: number
}

const DEFAULT_LIMIT = 5

export const useFollowingAndFilteredDaosSections = ({
  options,
  onChoose,
  limit = DEFAULT_LIMIT,
}: UseFilteredDaosSectionOptions): CommandModalContextSection[] => {
  const { t } = useTranslation()

  const chains = getSupportedChains({ hasIndexer: true })
  const featuredDaosLoading = useLoadingFeaturedDaoCards()
  const followingDaosLoading = useLoadingFollowingDaos()
  const { getDaoPath } = useDaoNavHelpers()

  const queryResults = useCachedLoadable(
    options.filter
      ? waitForAllSettled(
          chains.map(({ chain }) =>
            searchDaosSelector({
              chainId: chain.chain_id,
              query: options.filter,
              limit,
              // Exclude following DAOs from search since they show in a
              // separate section.
              exclude: followingDaosLoading.loading
                ? undefined
                : followingDaosLoading.data
                    .filter(({ chainId }) => chainId === chain.chain_id)
                    .map(({ coreAddress }) => coreAddress),
            })
          )
        )
      : undefined
  )

  const navigatingToHref = useRecoilValue(navigatingToHrefAtom)

  // Use query results if filter is present.
  const daos = [
    ...(options.filter
      ? (queryResults.state !== 'hasValue'
          ? []
          : queryResults.contents.flatMap((l) => l.valueMaybe() || [])
        )
          .filter(({ value }) => !!value?.config)
          .map(
            ({
              chainId,
              id: coreAddress,
              value: {
                config: { name, image_url },
                version,
                proposalCount,
              },
            }): CommandModalContextSectionItem<CommandModalDaoInfo> => ({
              chainId,
              coreAddress,
              coreVersion: parseContractVersion(version.version),
              name,
              imageUrl: image_url || getFallbackImage(coreAddress),
              // If DAO has no proposals, make it less visible and give it a
              // tooltip to indicate that it may not be active.
              ...(proposalCount === 0 && {
                className: 'opacity-50',
                tooltip: t('info.inactiveDaoTooltip'),
                sortLast: true,
              }),
              loading: navigatingToHref === getDaoPath(coreAddress),
            })
          )
      : // Otherwise when filter is empty, display featured DAOs.
      featuredDaosLoading.loading
      ? []
      : featuredDaosLoading.data.map((d) => d.info)),
    // Add configured chains.
    ...getConfiguredChains().flatMap(
      ({
        chainId,
        noGov,
      }): CommandModalContextSectionItem<CommandModalDaoInfo> | [] => {
        if (noGov) {
          return []
        }

        const chainName = mustGetConfiguredChainConfig(chainId).name
        // Ignore chain if followed since they show up in a separate section.
        if (
          !followingDaosLoading.loading &&
          followingDaosLoading.data.some(
            (following) =>
              following.chainId === chainId &&
              following.coreVersion === ContractVersion.Gov
          )
        ) {
          return []
        }

        return {
          chainId,
          coreAddress: chainName,
          coreVersion: ContractVersion.Gov,
          name: getDisplayNameForChainId(chainId),
          imageUrl: getImageUrlForChainId(chainId),
          loading: navigatingToHref === getDaoPath(chainName),
        }
      }
    ),
  ]

  // When filter present, use search results. Otherwise use featured DAOs.
  const daosLoading = options.filter
    ? queryResults.state === 'loading' ||
      (queryResults.state === 'hasValue' && queryResults.updating)
    : featuredDaosLoading.loading || !!featuredDaosLoading.updating

  const followingSection: CommandModalContextSection<CommandModalDaoInfo> = {
    name: t('title.following'),
    onChoose,
    items: followingDaosLoading.loading ? [] : followingDaosLoading.data,
    loading: followingDaosLoading.loading || !!followingDaosLoading.updating,
  }

  const daosSection: CommandModalContextSection<CommandModalDaoInfo> = {
    name: t('title.daos'),
    onChoose,
    items: daos,
    loading: daosLoading,
  }

  return [followingSection, daosSection]
}
