import TimeAgo from 'react-timeago'

import {
  LineLoader,
  ProposalStatus,
  ProposalLine as StatelessProposalLine,
  useTranslatedTimeDeltaFormatter,
} from '@dao-dao/stateless'
import { BaseProposalLineProps } from '@dao-dao/types'

import { SuspenseLoader } from '../../../../components'
import { useMembership } from '../../../../hooks'
import { useProposalModuleAdapterOptions } from '../../../react'
import { useLoadingProposal, useLoadingWalletVoteInfo } from '../hooks'
import { ProposalWithMetadata } from '../types'
import { ProposalWalletVote } from './ProposalWalletVote'

export const ProposalLine = (props: BaseProposalLineProps) => {
  const loadingProposal = useLoadingProposal()

  return (
    <SuspenseLoader
      fallback={<LineLoader type="proposal" />}
      forceFallback={loadingProposal.loading}
    >
      {!loadingProposal.loading && (
        <InnerProposalLine {...props} proposal={loadingProposal.data} />
      )}
    </SuspenseLoader>
  )
}

const InnerProposalLine = ({
  proposal,
  ...props
}: BaseProposalLineProps & {
  proposal: ProposalWithMetadata
}) => {
  const {
    proposalModule: { prefix: proposalPrefix },
    proposalNumber,
  } = useProposalModuleAdapterOptions()

  const { isMember = false } = useMembership()
  const loadingWalletVoteInfo = useLoadingWalletVoteInfo()

  const timeAgoFormatter = useTranslatedTimeDeltaFormatter({ words: false })

  return (
    <StatelessProposalLine
      Status={(props) => <ProposalStatus {...props} status={proposal.status} />}
      proposalNumber={proposalNumber}
      proposalPrefix={proposalPrefix}
      timestampDisplay={
        proposal.vetoTimelockExpiration
          ? {
              // Not used.
              label: '',
              content: (
                <TimeAgo
                  date={proposal.vetoTimelockExpiration}
                  formatter={timeAgoFormatter}
                />
              ),
            }
          : proposal.timestampInfo?.display
      }
      title={proposal.title}
      vote={
        // If no wallet connected, show nothing. If loading, also show nothing
        // until loaded.
        !loadingWalletVoteInfo || loadingWalletVoteInfo.loading
          ? undefined
          : // Show vote if they are a member of the DAO or if they could vote
            // on this proposal. This ensures that someone who is part of the
            // DAO sees their votes on every proposal (for visual consistency
            // and reassurance), even 'None' for proposals they were unable to
            // vote on due to previously not being part of the DAO. This also
            // ensures that someone who is no longer part of the DAO can still
            // see their past votes.
            (isMember || loadingWalletVoteInfo.data.couldVote) && (
              <ProposalWalletVote
                fallback={
                  // If did not vote, display pending or none based on if they
                  // are currently able to vote.
                  loadingWalletVoteInfo.data.canVote ? 'pending' : 'hasNoVote'
                }
                vote={loadingWalletVoteInfo.data.vote}
              />
            )
      }
      {...props}
    />
  )
}
