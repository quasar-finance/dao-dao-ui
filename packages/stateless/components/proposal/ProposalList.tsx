import { HowToVoteRounded } from '@mui/icons-material'
import { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'

import {
  DaoWithDropdownVetoableProposalList,
  LinkWrapperProps,
} from '@dao-dao/types'

import { useDaoInfoContext, useInfiniteScroll } from '../../hooks'
import { Button } from '../buttons'
import { Collapsible } from '../Collapsible'
import { Loader } from '../logo/Loader'
import { NoContent } from '../NoContent'
import { VetoableProposals } from './VetoableProposals'

type ProposalSection<T extends { proposalId: string }> = {
  /**
   * The title of the section.
   */
  title: string
  /**
   * The list of proposals in the section.
   */
  proposals: T[]
  /**
   * The total number of proposals to display next to the title. This may be
   * more than the number of proposals in the list due to pagination.
   */
  total?: number
  /**
   * Whether or not the section is collapsed by default. Defaults to false.
   */
  defaultCollapsed?: boolean
}

export type ProposalListProps<T extends { proposalId: string }> = {
  /**
   * Open proposals are shown at the top of the list.
   */
  openProposals: T[]
  /**
   * DAOs with proposals that can be vetoed. Shown below open proposals.
   */
  daosWithVetoableProposals: DaoWithDropdownVetoableProposalList<T>[]
  /**
   * Proposal sections are shown below open and vetoable proposals.
   */
  sections: ProposalSection<T>[]
  /**
   * Link to create a new proposal.
   */
  createNewProposalHref: string
  /**
   * Whether or not there are more proposals to load.
   */
  canLoadMore: boolean
  /**
   * Load more proposals.
   */
  loadMore: () => void
  /**
   * Whether or not more proposals are being loaded.
   */
  loadingMore: boolean
  /**
   * Whether or not the current wallet is a member of the DAO.
   */
  isMember: boolean

  ProposalLine: ComponentType<T>
  DiscordNotifierConfigureModal: ComponentType | undefined
  LinkWrapper: ComponentType<LinkWrapperProps>
}

export const ProposalList = <T extends { proposalId: string }>({
  openProposals,
  daosWithVetoableProposals,
  sections,
  createNewProposalHref,
  canLoadMore,
  loadMore,
  loadingMore,
  isMember,
  ProposalLine,
  DiscordNotifierConfigureModal,
  LinkWrapper,
}: ProposalListProps<T>) => {
  const { t } = useTranslation()
  const { name: daoName } = useDaoInfoContext()

  const proposalsExist =
    openProposals.length > 0 ||
    daosWithVetoableProposals.length > 0 ||
    sections.some((section) => section.proposals.length > 0)

  // Infinite scroll by loading more when scrolled near bottom.
  const { infiniteScrollRef } = useInfiniteScroll({
    loadMore,
    disabled: !canLoadMore || loadingMore,
  })

  return proposalsExist ? (
    <div
      className="border-t border-border-secondary py-6"
      ref={infiniteScrollRef}
    >
      <div className="mb-6 flex flex-row items-center justify-between gap-6">
        <p className="title-text text-text-body">{t('title.proposals')}</p>

        {DiscordNotifierConfigureModal && <DiscordNotifierConfigureModal />}
      </div>

      {openProposals.length > 0 && (
        <div className="mb-6 space-y-1">
          {openProposals.map((props) => (
            <ProposalLine {...props} key={props.proposalId} />
          ))}
        </div>
      )}

      {daosWithVetoableProposals.length > 0 && (
        <VetoableProposals
          LinkWrapper={LinkWrapper}
          ProposalLine={ProposalLine}
          className="mb-6 animate-fade-in"
          daoName={daoName}
          daosWithVetoableProposals={daosWithVetoableProposals}
        />
      )}

      <div className="space-y-4">
        {sections.map(
          ({ title, proposals, total, defaultCollapsed }, index) =>
            proposals.length > 0 && (
              <Collapsible
                key={index}
                containerClassName="gap-3"
                contentContainerClassName="space-y-1"
                defaultCollapsed={defaultCollapsed}
                label={`${title} • ${t('info.numProposals', {
                  count: total ?? proposals.length,
                })}`}
                labelClassName="text-text-secondary"
                noContentIndent
              >
                {proposals.map((props) => (
                  <ProposalLine {...props} key={props.proposalId} />
                ))}
              </Collapsible>
            )
        )}
      </div>

      {(canLoadMore || loadingMore) && (
        <div className="mt-6 flex flex-row justify-end">
          <Button
            className="secondary"
            loading={loadingMore}
            onClick={loadMore}
          >
            {t('button.loadMore')}
          </Button>
        </div>
      )}
    </div>
  ) : // If loading but no proposals are loaded yet, just show loader.
  loadingMore ? (
    <div className="border-t border-border-secondary pt-6">
      <Loader fill={false} />
    </div>
  ) : (
    <NoContent
      Icon={HowToVoteRounded}
      actionNudge={t('info.createFirstOneQuestion')}
      body={t('info.noProposalsYet')}
      buttonLabel={t('button.newProposal')}
      href={isMember ? createNewProposalHref : undefined}
    />
  )
}
