import {
  AccountBalanceOutlined,
  CheckRounded,
  DescriptionOutlined,
  PersonRounded,
} from '@mui/icons-material'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import removeMarkdown from 'remove-markdown'

import { DaoCardProps } from '@dao-dao/types/components/DaoCard'
import { formatDate } from '@dao-dao/utils'

import { useDaoNavHelpers } from '../../hooks'
import { IconButton } from '../icon_buttons'
import { TokenAmountDisplay } from '../token/TokenAmountDisplay'
import { TooltipInfoIcon } from '../tooltip'
import { Tooltip } from '../tooltip/Tooltip'
import { DaoImage } from './DaoImage'

export const DaoCard = ({
  info: { coreAddress, name, description, imageUrl, created, parentDao },
  lazyData,
  follow,
  LinkWrapper,
  isMember,
  showIsMember = true,
  showingEstimatedUsdValue = true,
  showParentDao = true,
  onMouseOver,
  onMouseLeave,
  className,
}: DaoCardProps) => {
  const { t } = useTranslation()
  const { getDaoPath } = useDaoNavHelpers()

  return (
    <LinkWrapper
      className={clsx(
        'relative flex h-[328px] w-full flex-col items-center justify-between rounded-md bg-background-secondary px-4 py-5 ring-1 ring-inset ring-transparent transition-all hover:bg-background-interactive-hover hover:ring-border-interactive-hover active:bg-background-interactive-pressed active:ring-border-interactive-focus sm:py-7 sm:px-6',
        className
      )}
      href={getDaoPath(coreAddress)}
      onMouseLeave={onMouseLeave}
      onMouseOver={onMouseOver}
      prefetch
    >
      <div className="absolute top-0 left-0 flex w-full flex-row items-center justify-between p-2 sm:p-3">
        {showIsMember && isMember ? (
          <Tooltip title={t('info.youAreMember')}>
            <PersonRounded className="!h-4 !w-4 text-icon-secondary" />
          </Tooltip>
        ) : (
          <div></div>
        )}

        {!follow.hide && (
          <Tooltip
            title={
              follow.following
                ? t('button.clickToUnfollow')
                : t('button.clickToFollow')
            }
          >
            <IconButton
              Icon={CheckRounded}
              className={
                follow.following
                  ? 'text-icon-interactive-active'
                  : 'text-icon-secondary'
              }
              loading={follow.updatingFollowing}
              onClick={(event) => {
                // Don't click on DAO card.
                event.preventDefault()
                event.stopPropagation()
                follow.onFollow()
              }}
              size="sm"
              variant="ghost"
            />
          </Tooltip>
        )}
      </div>

      <div className="flex flex-col items-center">
        <DaoImage
          LinkWrapper={LinkWrapper}
          coreAddress={coreAddress}
          daoName={name}
          imageUrl={imageUrl}
          parentDao={showParentDao ? parentDao : null}
          size="sm"
        />
        <p className="primary-text mt-2 text-center">{name}</p>
        {!!created && (
          <p className="caption-text mt-1 text-center">
            {formatDate(new Date(created))}
          </p>
        )}
      </div>

      <div className="self-stretch">
        <p className="secondary-text line-clamp-3 mb-5 w-full break-words">
          {removeMarkdown(description)}
        </p>

        {(lazyData.loading ||
          (!lazyData.errored && lazyData.data.tokenWithBalance)) && (
          <div
            className={clsx(
              'caption-text mb-2 flex flex-row items-center gap-2 font-mono',
              lazyData.loading && 'animate-pulse'
            )}
          >
            <AccountBalanceOutlined className="mr-1 !h-4 !w-4" />

            <TokenAmountDisplay
              amount={
                lazyData.loading || !lazyData.data.tokenWithBalance
                  ? { loading: true }
                  : {
                      loading: false,
                      data: Number(lazyData.data.tokenWithBalance.balance),
                    }
              }
              hideApprox
              {...(showingEstimatedUsdValue
                ? {
                    estimatedUsdValue: true,
                  }
                : {
                    decimals:
                      lazyData.loading || !lazyData.data.tokenWithBalance
                        ? 0
                        : lazyData.data.tokenWithBalance.decimals,
                    symbol:
                      lazyData.loading || !lazyData.data.tokenWithBalance
                        ? ''
                        : lazyData.data.tokenWithBalance.symbol,
                  })}
            />

            {showingEstimatedUsdValue && (
              <TooltipInfoIcon
                size="xs"
                title={t('info.estimatedTreasuryUsdValueTooltip')}
              />
            )}
          </div>
        )}

        {(lazyData.loading || !lazyData.errored) && (
          <div
            className={clsx(
              'caption-text flex flex-row items-center gap-3 font-mono',
              lazyData.loading && 'animate-pulse'
            )}
          >
            <DescriptionOutlined className="!h-4 !w-4" />
            <p>
              {lazyData.loading
                ? '...'
                : t('info.numProposals', {
                    count: lazyData.data.proposalCount,
                  })}
            </p>
          </div>
        )}
      </div>
    </LinkWrapper>
  )
}

export const DaoCardLoader = () => (
  <div className="h-[328px] w-full animate-pulse rounded-md bg-background-secondary"></div>
)
