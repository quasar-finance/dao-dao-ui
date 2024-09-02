import { ArrowOutwardRounded, East, West } from '@mui/icons-material'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRecoilCallback, useRecoilValue } from 'recoil'

import {
  TransformedTreasuryTransaction,
  blockHeightSelector,
  blockHeightTimestampSafeSelector,
  blockHeightTimestampSelector,
  chainQueries,
  transformedTreasuryTransactionsSelector,
} from '@dao-dao/state'
import {
  Button,
  CopyToClipboard,
  LineGraph,
  Loader,
  useChainContext,
  useConfiguredChainContext,
  useDaoInfoContext,
} from '@dao-dao/stateless'
import {
  convertMicroDenomToDenomWithDecimals,
  processError,
} from '@dao-dao/utils'

import { IconButtonLink } from '../IconButtonLink'
import { SuspenseLoader } from '../SuspenseLoader'

type DaoTxTreasuryHistoryProps = {
  shortTitle?: boolean
}

export const DaoTxTreasuryHistory = (props: DaoTxTreasuryHistoryProps) => {
  const { t } = useTranslation()

  return (
    <SuspenseLoader
      fallback={
        <div className="flex flex-col gap-4">
          <h2 className="primary-text">
            {props.shortTitle ? t('title.history') : t('title.treasuryHistory')}
          </h2>
          <Loader />
        </div>
      }
    >
      <InnerDaoTxTreasuryHistory {...props} />
    </SuspenseLoader>
  )
}

// Load roughly 3 days at a time (assuming 1 block per 6 seconds, which is not
// accurate but close enough).
const BLOCK_HEIGHT_INTERVAL = (60 * 60 * 24 * 3) / 6

export const InnerDaoTxTreasuryHistory = ({
  shortTitle,
}: DaoTxTreasuryHistoryProps) => {
  const { t } = useTranslation()
  const {
    chain: { chain_id: chainId },
    nativeToken,
  } = useChainContext()
  const { coreAddress } = useDaoInfoContext()

  // Initialization.
  const latestBlockHeight = useRecoilValue(
    blockHeightSelector({
      chainId,
    })
  )
  const initialMinHeight = latestBlockHeight - BLOCK_HEIGHT_INTERVAL
  const initialLowestHeightLoadedTimestamp = useRecoilValue(
    blockHeightTimestampSafeSelector({
      chainId,
      blockHeight: initialMinHeight,
    })
  )
  const initialTransactions = useRecoilValue(
    transformedTreasuryTransactionsSelector({
      chainId,
      address: coreAddress,
      minHeight: initialMinHeight,
      maxHeight: latestBlockHeight,
    })
  )

  // Paginated data.
  const [loading, setLoading] = useState(false)
  const [lowestHeightLoaded, setLowestHeightLoaded] = useState(initialMinHeight)
  const [lowestHeightLoadedTimestamp, setLowestHeightLoadedTimestamp] =
    useState(initialLowestHeightLoadedTimestamp)
  const [transactions, setTransactions] = useState(initialTransactions)
  const [canLoadMore, setCanLoadMore] = useState(true)

  // Pagination loader.
  const loadMoreTransactions = useRecoilCallback(
    ({ snapshot }) =>
      async (maxHeight: number) => {
        setLoading(true)

        let minHeight
        try {
          // Loop until we find transactions.
          while (true) {
            minHeight = maxHeight - BLOCK_HEIGHT_INTERVAL

            const newTransactions = await snapshot.getPromise(
              transformedTreasuryTransactionsSelector({
                chainId,
                address: coreAddress,
                minHeight,
                maxHeight,
              })
            )

            const newLowestHeightLoadedTimestamp = await snapshot.getPromise(
              blockHeightTimestampSelector({
                chainId,
                blockHeight: minHeight,
              })
            )

            setLowestHeightLoaded(minHeight)
            setLowestHeightLoadedTimestamp(newLowestHeightLoadedTimestamp)

            // If no transactions found, try to load more.
            if (!newTransactions.length) {
              maxHeight -= BLOCK_HEIGHT_INTERVAL
            } else {
              // If found transactions, set and stop looping.
              setTransactions((transactions) => [
                ...transactions,
                ...newTransactions,
              ])
              break
            }
          }
        } catch (err) {
          console.error(
            processError(err, { tags: { coreAddress, minHeight, maxHeight } })
          )
          // If errored, assume we cannot load any more below this height.
          setCanLoadMore(false)
        } finally {
          setLoading(false)
        }
      },
    [
      coreAddress,
      setLoading,
      setTransactions,
      setLowestHeightLoaded,
      setLowestHeightLoadedTimestamp,
    ]
  )

  const { data: nativeBalance } = useSuspenseQuery(
    chainQueries.nativeBalance({
      chainId,
      address: coreAddress,
    })
  )
  const lineGraphValues = useMemo(() => {
    let runningTotal = convertMicroDenomToDenomWithDecimals(
      nativeBalance.amount,
      nativeToken?.decimals ?? 0
    )

    return (
      transactions
        .filter(({ denomLabel }) => denomLabel === nativeToken?.symbol)
        .map(({ amount, outgoing }) => {
          let currentTotal = runningTotal
          runningTotal -= (outgoing ? -1 : 1) * amount
          return currentTotal
        })
        // Reverse since transactions are descending, but we want the graph to
        // display ascending balance.
        .reverse()
    )
  }, [
    nativeBalance.amount,
    nativeToken?.decimals,
    nativeToken?.symbol,
    transactions,
  ])

  return (
    <div className="flex flex-col gap-y-4">
      <h2 className="primary-text">
        {shortTitle ? t('title.history') : t('title.treasuryHistory')}
      </h2>

      {transactions.length ? (
        <>
          <div className="max-w-lg">
            <LineGraph
              title={t('title.nativeBalanceOverTime', {
                denomLabel: nativeToken?.symbol ?? 'unknown',
              }).toLocaleUpperCase()}
              yTitle={nativeToken?.symbol || 'Unknown token'}
              yValues={lineGraphValues}
            />
          </div>

          <div className="md:px-4">
            {transactions.map((transaction) => (
              <TransactionRenderer
                key={transaction.hash}
                transaction={transaction}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="text-text-secondary">{t('info.nothingFound')}</p>
      )}

      <div className="flex flex-row items-center justify-between gap-4">
        {lowestHeightLoadedTimestamp && (
          <p className="caption-text italic">
            {t('info.historySinceDate', {
              date: lowestHeightLoadedTimestamp.toLocaleString(),
            })}
          </p>
        )}

        {canLoadMore ? (
          <Button
            loading={loading}
            onClick={() => loadMoreTransactions(lowestHeightLoaded)}
            size="sm"
          >
            {t('button.loadMore')}
          </Button>
        ) : (
          <p className="caption-text">{t('info.availableHistoryLoaded')}</p>
        )}
      </div>
    </div>
  )
}

interface TransactionRendererProps {
  transaction: TransformedTreasuryTransaction
}

const TransactionRenderer = ({
  transaction: {
    hash,
    height,
    timestamp,
    sender,
    recipient,
    amount,
    denomLabel,
    outgoing,
  },
}: TransactionRendererProps) => {
  const { config } = useConfiguredChainContext()

  return (
    <div className="flex flex-row items-start justify-between gap-4 xs:gap-12">
      <div className="flex flex-row flex-wrap items-center gap-x-4 text-sm leading-6">
        <CopyToClipboard value={outgoing ? recipient : sender} />
        {/* Outgoing transactions are received by the address above, so point to the left. */}
        {outgoing ? (
          <West className="!h-4 !w-4" />
        ) : (
          <East className="!h-4 !w-4" />
        )}
        <p>
          {amount} ${denomLabel}
        </p>
      </div>

      <p className="flex flex-row items-center gap-4 text-right font-mono text-xs leading-6">
        {timestamp?.toLocaleString() ?? `${height} block`}

        {!!config.explorerUrlTemplates?.tx && (
          <IconButtonLink
            Icon={ArrowOutwardRounded}
            className="text-text-tertiary"
            href={config.explorerUrlTemplates?.tx?.replace('REPLACE', hash)}
            openInNewTab
            variant="ghost"
          />
        )}
      </p>
    </div>
  )
}
