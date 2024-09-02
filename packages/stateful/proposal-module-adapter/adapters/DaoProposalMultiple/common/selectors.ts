import {
  RecoilValueReadOnly,
  constSelector,
  selectorFamily,
  waitForAll,
} from 'recoil'

import {
  DaoPreProposeMultipleSelectors,
  DaoProposalMultipleSelectors,
  blockHeightTimestampSafeSelector,
} from '@dao-dao/state'
import {
  CheckedDepositInfo,
  ContractVersion,
  Duration,
  ProposalStatusEnum,
  WithChainId,
} from '@dao-dao/types'
import {
  CommonProposalListInfo,
  DepositInfoSelector,
} from '@dao-dao/types/proposal-module-adapter'

export const proposalCountSelector: (
  info: WithChainId<{
    proposalModuleAddress: string
  }>
) => RecoilValueReadOnly<number> = selectorFamily({
  key: 'daoProposalMultipleProposalCount',
  get:
    ({ chainId, proposalModuleAddress }) =>
    ({ get }) =>
      get(
        DaoProposalMultipleSelectors.proposalCountSelector({
          contractAddress: proposalModuleAddress,
          chainId,
        })
      ),
})

export const maxVotingPeriodSelector = selectorFamily<
  Duration,
  WithChainId<{
    proposalModuleAddress: string
  }>
>({
  key: 'daoProposalMultipleMaxVotingPeriod',
  get:
    ({ chainId, proposalModuleAddress }) =>
    ({ get }) => {
      const config = get(
        DaoProposalMultipleSelectors.configSelector({
          contractAddress: proposalModuleAddress,
          chainId,
        })
      )

      return config.max_voting_period
    },
})

export const reverseProposalInfosSelector: (
  info: WithChainId<{
    proposalModuleAddress: string
    proposalModulePrefix: string
    startBefore: number | undefined
    limit: number | undefined
  }>
) => RecoilValueReadOnly<CommonProposalListInfo[]> = selectorFamily({
  key: 'daoProposalMultipleReverseProposalInfos',
  get:
    ({
      chainId,
      proposalModuleAddress,
      proposalModulePrefix,
      startBefore,
      limit,
    }) =>
    async ({ get }) => {
      const proposalResponses = get(
        DaoProposalMultipleSelectors.reverseProposalsSelector({
          contractAddress: proposalModuleAddress,
          chainId,
          params: [
            {
              startBefore,
              limit,
            },
          ],
        })
      ).proposals

      const timestamps = get(
        waitForAll(
          proposalResponses.map(({ proposal: { start_height }, ...response }) =>
            // Indexer returns createdAt, so check its existence and fetch from
            // chain if not present.
            typeof response.createdAt === 'string'
              ? constSelector(new Date(response.createdAt))
              : blockHeightTimestampSafeSelector({
                  blockHeight: start_height,
                  chainId,
                })
          )
        )
      )

      const proposalInfos: CommonProposalListInfo[] = proposalResponses.map(
        ({ id, proposal: { status } }, index) => ({
          id: `${proposalModulePrefix}${id}`,
          proposalNumber: id,
          timestamp: timestamps[index],
          isOpen: status === ProposalStatusEnum.Open,
        })
      )

      return proposalInfos
    },
})

export const depositInfoSelector: (
  info: WithChainId<{
    proposalModuleAddress: string
    version: ContractVersion | null
    preProposeAddress: string | null
  }>
) => DepositInfoSelector = selectorFamily({
  key: 'daoProposalMultipleDepositInfo',
  get:
    ({ chainId, preProposeAddress }) =>
    ({ get }) => {
      let depositInfo: CheckedDepositInfo | undefined
      if (preProposeAddress) {
        const config = get(
          DaoPreProposeMultipleSelectors.configSelector({
            contractAddress: preProposeAddress,
            chainId,
            params: [],
          })
        )
        if (config.deposit_info) {
          depositInfo = config.deposit_info ?? undefined
        }
      }

      return depositInfo
    },
})
