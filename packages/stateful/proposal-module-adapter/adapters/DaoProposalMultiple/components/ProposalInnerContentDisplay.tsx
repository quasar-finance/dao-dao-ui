import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useDeepCompareEffect from 'use-deep-compare-effect'

import { Loader } from '@dao-dao/stateless'
import {
  ActionAndData,
  ActionKeyAndData,
  BaseProposalInnerContentDisplayProps,
  ProposalStatusEnum,
  ProposalVoteOption,
} from '@dao-dao/types'
import {
  MultipleChoiceProposal,
  MultipleChoiceVote,
} from '@dao-dao/types/contracts/DaoProposalMultiple'
import { decodeMessages, getProposalStatusKey } from '@dao-dao/utils'

import { SuspenseLoader } from '../../../../components'
import {
  useLoadingProposal,
  useLoadingVoteOptions,
  useLoadingVotesInfo,
} from '../hooks'
import { MultipleChoiceOptionData, NewProposalForm, VotesInfo } from '../types'
import { MultipleChoiceOptionViewer } from './MultipleChoiceOptionViewer'

export const ProposalInnerContentDisplay = (
  props: BaseProposalInnerContentDisplayProps<NewProposalForm>
) => {
  const { t } = useTranslation()
  const loadingProposal = useLoadingProposal()
  const loadingVoteOptions = useLoadingVoteOptions()
  const loadingVotesInfo = useLoadingVotesInfo()

  return (
    <SuspenseLoader
      fallback={
        <div className="flex flex-row items-center gap-4">
          <p className="title-text">{t('title.voteOptions')}</p>
          <Loader fill={false} size={22} />
        </div>
      }
      forceFallback={
        loadingProposal.loading ||
        loadingVoteOptions.loading ||
        loadingVotesInfo.loading
      }
    >
      {!loadingProposal.loading &&
        !loadingVoteOptions.loading &&
        !loadingVotesInfo.loading && (
          <InnerProposalInnerContentDisplay
            {...props}
            proposal={loadingProposal.data}
            voteOptions={loadingVoteOptions.data}
            votesInfo={loadingVotesInfo.data}
          />
        )}
    </SuspenseLoader>
  )
}

export const InnerProposalInnerContentDisplay = ({
  setDuplicateFormData,
  actionsForMatching,
  proposal,
  voteOptions,
  votesInfo: { winningChoice },
  setSeenAllActionPages,
}: BaseProposalInnerContentDisplayProps<NewProposalForm> & {
  proposal: MultipleChoiceProposal
  voteOptions: ProposalVoteOption<MultipleChoiceVote>[]
  votesInfo: VotesInfo
}) => {
  const { t } = useTranslation()

  const mappedDecodedMessages = useMemo(
    () => proposal.choices.map((choice) => decodeMessages(choice.msgs)),
    [proposal.choices]
  )

  // Map action data to each proposal choice.
  const optionsData = proposal.choices.map(
    (choice, index): MultipleChoiceOptionData => {
      const voteOption = voteOptions[index]
      const decodedMessages = mappedDecodedMessages[index]
      const actionData: ActionAndData[] = decodedMessages.map((message) => {
        const actionMatch = actionsForMatching
          .map((action) => ({
            action,
            ...action.useDecodedCosmosMsg(message),
          }))
          .find(({ match }) => match)

        // There should always be a match since custom matches all. This
        // should never happen as long as the Custom action exists.
        if (!actionMatch?.match) {
          throw new Error(t('error.loadingData'))
        }

        return {
          action: actionMatch.action,
          data: actionMatch.data,
        }
      })

      return {
        choice,
        actionData,
        decodedMessages,
        voteOption,
      }
    }
  )

  useDeepCompareEffect(() => {
    setDuplicateFormData?.({
      title: proposal.title,
      description: proposal.description,
      choices: optionsData
        .filter(({ choice }) => choice.option_type !== 'none')
        .map(({ choice, actionData }) => ({
          title: choice.title,
          description: choice.description,
          actionData: actionData.map(
            ({ action, data }, index): ActionKeyAndData => ({
              _id: index.toString(),
              actionKey: action.key,
              data,
            })
          ),
        })),
    })
  }, [optionsData, proposal.title, proposal.description, setDuplicateFormData])

  // Store for each option whether the user has seen all action pages.
  const [seenAllActionPagesForOption, setSeenAllActionPagesPerOption] =
    useState(
      // Initialize to true if there are no msgs for an option.
      () =>
        optionsData.reduce(
          (acc, { decodedMessages }, index) => ({
            ...acc,
            [index]: decodedMessages.length === 0,
          }),
          {} as Record<number, boolean | undefined>
        )
    )
  // Check that every option has seen all action pages, and if so, call the
  // `setSeenAllActionPages` callback.
  const [markedSeen, setMarkedSeen] = useState(false)
  useEffect(() => {
    if (markedSeen) {
      return
    }

    if (
      setSeenAllActionPages &&
      [...Array(proposal.choices.length)].every(
        (_, index) => seenAllActionPagesForOption[index]
      )
    ) {
      setSeenAllActionPages()
      setMarkedSeen(true)
    }
  }, [
    markedSeen,
    proposal.choices.length,
    seenAllActionPagesForOption,
    setSeenAllActionPages,
  ])

  const statusKey = getProposalStatusKey(proposal.status)

  return (
    <div>
      <p className="title-text mb-2">{t('title.voteOptions')}</p>

      {optionsData.map((data, index) => (
        <MultipleChoiceOptionViewer
          key={index}
          SuspenseLoader={SuspenseLoader}
          data={data}
          lastOption={index === optionsData.length - 1}
          setSeenAllActionPages={() =>
            setSeenAllActionPagesPerOption((prev) =>
              // Don't update if already true.
              prev[index]
                ? prev
                : {
                    ...prev,
                    [index]: true,
                  }
            )
          }
          winner={
            (statusKey === ProposalStatusEnum.Passed ||
              statusKey === ProposalStatusEnum.Executed ||
              statusKey === ProposalStatusEnum.ExecutionFailed ||
              statusKey === 'veto_timelock' ||
              statusKey === ProposalStatusEnum.NeutronTimelocked) &&
            winningChoice
              ? winningChoice.index === data.choice.index
              : undefined
          }
        />
      ))}
    </div>
  )
}
