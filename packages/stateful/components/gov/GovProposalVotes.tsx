import uniqBy from 'lodash.uniqby'
import { useEffect, useState } from 'react'
import { useRecoilCallback, useRecoilValue } from 'recoil'

import {
  chainStakingPoolSelector,
  govProposalVotesSelector,
} from '@dao-dao/state/recoil'
import {
  GovProposalVoteDisplay,
  Loader,
  ProposalVote,
  ProposalVotes as StatelessProposalVotes,
  useChain,
  useInfiniteScroll,
} from '@dao-dao/stateless'
import { BaseProposalVotesProps } from '@dao-dao/types'
import {
  VoteOption,
  voteOptionToJSON,
} from '@dao-dao/types/protobuf/codegen/cosmos/gov/v1/gov'

import { EntityDisplay } from '../EntityDisplay'
import { SuspenseLoader } from '../SuspenseLoader'

const VOTES_PER_PAGE = 20

export type GovProposalVotesProps = BaseProposalVotesProps & {
  proposalId: string
}

export const GovProposalVotes = (props: GovProposalVotesProps) => (
  <SuspenseLoader fallback={<Loader />}>
    <InnerGovProposalVotes {...props} />
  </SuspenseLoader>
)

const InnerGovProposalVotes = ({
  proposalId,
  ...props
}: GovProposalVotesProps) => {
  const { chain_id: chainId } = useChain()

  // Load all staked voting power.
  const { bondedTokens } = useRecoilValue(
    chainStakingPoolSelector({
      chainId,
    })
  )

  const [loading, setLoading] = useState(true)
  const [noMoreVotes, setNoMoreVotes] = useState(false)
  const [votes, setVotes] = useState<ProposalVote[]>([])
  const loadVotes = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        setLoading(true)
        try {
          const newVotes = (
            await snapshot.getPromise(
              govProposalVotesSelector({
                chainId,
                proposalId: Number(proposalId),
                offset: votes.length,
                limit: VOTES_PER_PAGE,
              })
            )
          ).votes.map(
            ({ voter, options, staked }): ProposalVote<VoteOption> => ({
              voterAddress: voter,
              vote: options.sort(
                (a, b) => Number(b.weight) - Number(a.weight)
              )[0].option,
              votingPowerPercent:
                Number(staked) / Number(BigInt(bondedTokens) / 100n),
            })
          )

          setVotes((prev) =>
            uniqBy([...prev, ...newVotes], ({ voterAddress }) => voterAddress)
          )
          setNoMoreVotes(newVotes.length < VOTES_PER_PAGE)
        } finally {
          setLoading(false)
        }
      },
    [chainId, proposalId, votes.length, bondedTokens]
  )
  // Load once.
  useEffect(() => {
    loadVotes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { infiniteScrollRef } = useInfiniteScroll({
    loadMore: loadVotes,
    disabled: loading || noMoreVotes,
    infiniteScrollFactor: 0.1,
  })

  return (
    <StatelessProposalVotes
      EntityDisplay={EntityDisplay}
      VoteDisplay={GovProposalVoteDisplay}
      containerRef={infiniteScrollRef}
      exportVoteTransformer={(vote) => voteOptionToJSON(vote)}
      hideVotedAt
      votes={
        loading && votes.length === 0
          ? { loading: true, errored: false }
          : {
              loading: false,
              updating: loading,
              errored: false,
              data: votes,
            }
      }
      votingOpen={false}
      {...props}
    />
  )
}
