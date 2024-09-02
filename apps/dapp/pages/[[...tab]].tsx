// GNU AFFERO GENERAL PUBLIC LICENSE Version 3. Copyright (C) 2022 DAO DAO Contributors.
// See the "LICENSE" file in the root directory of this package for more copyright information.

import { GetStaticPaths, GetStaticProps } from 'next';

import { serverSideTranslations } from '@dao-dao/i18n/serverSideTranslations';
import {
  daoQueries,
  dehydrateSerializable,
  indexerQueries,
  makeReactQueryClient,
} from '@dao-dao/state';
import {
  Home,
  StatefulHomeProps,
  daoQueries as statefulDaoQueries,
} from '@dao-dao/stateful';
import { AccountTabId, DaoDaoIndexerChainStats } from '@dao-dao/types';
import {
  MAINNET,
  chainIsIndexed,
  getDaoInfoForChainId,
  getSupportedChains,
} from '@dao-dao/utils';


export default Home

// Share query client across static props generators since the data is the same.
const queryClient = makeReactQueryClient()

export const getStaticProps: GetStaticProps<StatefulHomeProps> = async ({
  locale,
  params,
}) => {
  const tabPath =
    params?.tab && Array.isArray(params?.tab) ? params.tab[0] : undefined

  const selectedChain = tabPath
    ? getSupportedChains().find(({ name }) => name === tabPath)
    : undefined
  const chainId = selectedChain?.chainId

  const chainGovDaos = chainId
    ? selectedChain.noGov
      ? undefined
      : [getDaoInfoForChainId(chainId, [])]
    : [
        ...getSupportedChains().flatMap(({ chainId, noGov }) =>
          noGov ? [] : chainId
        ),
        ...(MAINNET
          ? [
              'akashnet-2',
              'secret-4',
              'regen-1',
              'injective-1',
              'celestia',
              'archway-1',
            ]
          : []),
      ].map((chainId) => getDaoInfoForChainId(chainId, []))

  const [i18nProps, tvl, allStats, monthStats, weekStats] = await Promise.all([
    serverSideTranslations(locale, ['translation']),
    !chainId || chainIsIndexed(chainId)
      ? queryClient
          .fetchQuery(
            indexerQueries.snapper<number>({
              query: chainId ? 'daodao-chain-tvl' : 'daodao-all-tvl',
              parameters: chainId ? { chainId } : undefined,
            })
          )
          .catch((error) => {
            console.error(`Error fetching TVL for chain ${chainId}:`, error)
            return 0
          })
      : 0,
    !chainId || chainIsIndexed(chainId)
      ? queryClient
          .fetchQuery(
            indexerQueries.snapper<DaoDaoIndexerChainStats>({
              query: chainId ? 'daodao-chain-stats' : 'daodao-all-stats',
              parameters: chainId ? { chainId } : undefined,
            })
          )
          .catch((error) => {
            console.error(`Error fetching stats for chain ${chainId}:`, error)
            return null as DaoDaoIndexerChainStats | null
          })
      : null,
    !chainId || chainIsIndexed(chainId)
      ? queryClient
          .fetchQuery(
            indexerQueries.snapper<DaoDaoIndexerChainStats>({
              query: chainId ? 'daodao-chain-stats' : 'daodao-all-stats',
              parameters: {
                ...(chainId ? { chainId } : undefined),
                daysAgo: 30,
              },
            })
          )
          .catch((error) => {
            console.error(
              `Error fetching 30-day stats for chain ${chainId}:`,
              error
            )
            return null as DaoDaoIndexerChainStats | null
          })
      : null,
    !chainId || chainIsIndexed(chainId)
      ? queryClient
          .fetchQuery(
            indexerQueries.snapper<DaoDaoIndexerChainStats>({
              query: chainId ? 'daodao-chain-stats' : 'daodao-all-stats',
              parameters: {
                ...(chainId ? { chainId } : undefined),
                daysAgo: 7,
              },
            })
          )
          .catch((error) => {
            console.error(
              `Error fetching 7-day stats for chain ${chainId}:`,
              error
            )
            return null as DaoDaoIndexerChainStats | null
          })
      : null,

    queryClient
      .fetchQuery(daoQueries.listFeatured())
      .then((featured) =>
        Promise.all(
          featured?.map((dao) =>
            queryClient.fetchQuery(statefulDaoQueries.info(queryClient, dao))
          ) || []
        )
      )
      .catch((error) => {
        console.error(`Error fetching featured DAOs:`, error)
        return []
      }),
  ])

  const stats = {
    all: allStats || {
      daos: 0,
      proposals: 0,
      votes: 0,
      uniqueVoters: 0,
    },
    month: monthStats || {
      daos: 0,
      proposals: 0,
      votes: 0,
      uniqueVoters: 0,
    },
    week: weekStats || {
      daos: 0,
      proposals: 0,
      votes: 0,
      uniqueVoters: 0,
    },
    tvl,
    chains: chainId ? 1 : getSupportedChains().length,
  }

  return {
    props: {
      ...i18nProps,
      ...(chainId && { chainId }),
      stats,
      ...(chainGovDaos && { chainGovDaos }),
      reactQueryDehydratedState: dehydrateSerializable(queryClient),
    },
    revalidate: 6 * 60 * 60,
  }
}

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [
    {
      params: {
        tab: [],
      },
    },
    ...Object.values(AccountTabId).map((tab) => ({
      params: {
        tab: [tab],
      },
    })),
    ...getSupportedChains().map(({ name }) => ({
      params: {
        tab: [name],
      },
    })),
  ],
  fallback: false,
})
