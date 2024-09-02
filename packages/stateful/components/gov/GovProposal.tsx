import { Dispatch, SetStateAction, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useSetRecoilState } from 'recoil'

import {
  govProposalSelector,
  refreshGovProposalsAtom,
} from '@dao-dao/state/recoil'
import {
  PageLoader,
  Popup,
  Proposal,
  ProposalNotFound,
  useCachedLoadingWithError,
  useChain,
  useDaoInfoContextIfAvailable,
} from '@dao-dao/stateless'
import {
  BaseProposalVotesProps,
  DaoTabId,
  GovProposalWithDecodedContent,
} from '@dao-dao/types'
import { ProposalStatus } from '@dao-dao/types/protobuf/codegen/cosmos/gov/v1/gov'
import { mustGetConfiguredChainConfig } from '@dao-dao/utils'

import { GovActionsProvider } from '../../actions'
import {
  useLoadingGovProposal,
  useOnCurrentDaoWebSocketMessage,
} from '../../hooks'
import { DaoProposalProps } from '../dao/DaoPageWrapper'
import { PageHeaderContent } from '../PageHeaderContent'
import { SuspenseLoader } from '../SuspenseLoader'
import { GovProposalContentDisplay } from './GovProposalContentDisplay'
import {
  GovProposalStatusAndInfo,
  GovProposalStatusAndInfoProps,
} from './GovProposalStatusAndInfo'
import { GovProposalVoter } from './GovProposalVoter'
import { GovProposalVotes } from './GovProposalVotes'
import { GovProposalVoteTally } from './GovProposalVoteTally'

type InnerGovProposalProps = {
  proposal: GovProposalWithDecodedContent
}

const InnerGovProposal = ({ proposal }: InnerGovProposalProps) => {
  const { t } = useTranslation()
  const { chain_id: chainId } = useChain()
  const daoInfo = useDaoInfoContextIfAvailable()

  const proposalId = proposal.id.toString()
  const loadingProposal = useLoadingGovProposal(proposalId)

  const ProposalStatusAndInfo = useCallback(
    (props: Omit<GovProposalStatusAndInfoProps, 'proposalId'>) => (
      <GovProposalStatusAndInfo {...props} proposalId={proposalId} />
    ),
    [proposalId]
  )

  const alreadyVoted =
    !loadingProposal.loading &&
    !loadingProposal.data.walletVoteInfo.loading &&
    !!loadingProposal.data.walletVoteInfo.data.vote?.length

  const setVoteOpenRef = useRef<
    (Dispatch<SetStateAction<boolean>> | null) | null
  >(null)

  const setRefreshGovProposalsId = useSetRecoilState(
    refreshGovProposalsAtom(chainId)
  )
  // Proposal status listener. Show alerts and refresh.
  useOnCurrentDaoWebSocketMessage(
    'proposal',
    async ({ status, proposalId }) => {
      // If the current proposal updated...
      if (proposalId === proposal.id.toString()) {
        setRefreshGovProposalsId((id) => id + 1)

        // Manually revalidate static props.
        fetch(
          `/api/revalidate?d=${mustGetConfiguredChainConfig(
            chainId
          )}&p=${proposalId}`
        )

        if (status === ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD) {
          toast.success(t('success.proposalOpenForVoting'))
        } else if (status === ProposalStatus.PROPOSAL_STATUS_PASSED) {
          toast.success(t('success.proposalPassed'))
        } else if (status === ProposalStatus.PROPOSAL_STATUS_FAILED) {
          toast.success(t('success.proposalPassedButExecutionFailed'))
        } else if (status === ProposalStatus.PROPOSAL_STATUS_REJECTED) {
          toast.success(t('success.proposalRejected'))
        }
      }
    }
  )

  const GovVotesCast = useCallback(
    (props: BaseProposalVotesProps) => (
      <GovProposalVotes {...props} proposalId={proposalId} />
    ),
    [proposalId]
  )

  return (
    <>
      <PageHeaderContent
        breadcrumbs={{
          homeTab: {
            id: DaoTabId.Proposals,
            sdaLabel: t('title.proposals'),
          },
          current: `${t('title.proposal')} ${proposalId}`,
          daoInfo,
        }}
        rightNode={
          proposal.proposal.status ===
            ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD && (
            <Popup
              popupClassName="min-w-56 max-w-lg p-3"
              position="left"
              setOpenRef={setVoteOpenRef}
              trigger={{
                type: 'button',
                props: {
                  className: 'animate-fade-in',
                  contentContainerClassName: 'text-base',
                  variant: 'brand_ghost',
                  children: alreadyVoted
                    ? t('button.changeVote')
                    : t('title.vote'),
                },
              }}
            >
              <GovProposalVoter
                onVoteSuccess={
                  // Close vote popup in case it's open.
                  () => setVoteOpenRef.current?.(false)
                }
                proposalId={proposalId}
              />
            </Popup>
          )
        }
      />

      <Proposal
        ProposalStatusAndInfo={ProposalStatusAndInfo}
        VotesCast={
          proposal.proposal.status ===
            ProposalStatus.PROPOSAL_STATUS_DEPOSIT_PERIOD ||
          proposal.proposal.status ===
            ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD
            ? GovVotesCast
            : undefined
        }
        contentDisplay={
          <GovActionsProvider>
            <GovProposalContentDisplay proposal={proposal} />
          </GovActionsProvider>
        }
        voteTally={<GovProposalVoteTally proposalId={proposalId} />}
      />
    </>
  )
}

export const GovProposal = ({ proposalInfo }: DaoProposalProps) => {
  const { chain_id: chainId } = useChain()
  const proposalLoading = useCachedLoadingWithError(
    proposalInfo
      ? govProposalSelector({
          chainId,
          proposalId: Number(proposalInfo.id),
        })
      : undefined
  )

  return proposalInfo ? (
    <SuspenseLoader
      fallback={<PageLoader />}
      forceFallback={proposalLoading.loading || proposalLoading.errored}
    >
      {!proposalLoading.loading && !proposalLoading.errored && (
        <InnerGovProposal proposal={proposalLoading.data} />
      )}
    </SuspenseLoader>
  ) : (
    <ProposalNotFound PageHeaderContent={PageHeaderContent} />
  )
}
