import { FetchQueryOptions } from '@tanstack/react-query'

import {
  SecretDaoPreProposeSingleClient,
  SecretDaoProposalSingleClient,
} from '@dao-dao/state/contracts'
import { secretDaoProposalSingleQueries } from '@dao-dao/state/query'
import { Coin, SecretModuleInstantiateInfo } from '@dao-dao/types'
import { InstantiateMsg as SecretDaoPreProposeApprovalSingleInstantiateMsg } from '@dao-dao/types/contracts/SecretDaoPreProposeApprovalSingle'
import {
  InstantiateMsg as SecretDaoPreProposeSingleInstantiateMsg,
  UncheckedDepositInfo,
} from '@dao-dao/types/contracts/SecretDaoPreProposeSingle'
import {
  Duration,
  InstantiateMsg,
  PreProposeInfo,
  Threshold,
  VetoConfig,
  Vote,
  VoteInfo,
  VoteResponse,
} from '@dao-dao/types/contracts/SecretDaoProposalSingle'
import {
  ContractName,
  DAO_PROPOSAL_SINGLE_CONTRACT_NAMES,
  SupportedSigningCosmWasmClient,
  encodeJsonToBase64,
  findWasmAttributeValue,
  mustGetSupportedChainConfig,
} from '@dao-dao/utils'

import { NewProposalData } from '../../proposal-module-adapter/adapters/DaoProposalSingle/types'
import { SecretCwDao } from '../dao/SecretCwDao'
import { ProposalModuleBase } from './base'

export class SecretSingleChoiceProposalModule extends ProposalModuleBase<
  SecretCwDao,
  NewProposalData,
  VoteResponse,
  VoteInfo,
  Vote
> {
  static contractNames: readonly string[] = DAO_PROPOSAL_SINGLE_CONTRACT_NAMES

  /**
   * Generate the module instantiate info to plug into the DAO instantiate info
   * generator function.
   */
  static generateModuleInstantiateInfo(
    chainId: string,
    config: {
      threshold: Threshold
      maxVotingPeriod: Duration
      minVotingPeriod?: Duration
      allowRevoting: boolean
      veto?: VetoConfig | null
      approver?: string
      deposit?: UncheckedDepositInfo | null
      submissionPolicy: 'members' | 'anyone'
      /**
       * Defaults to true.
       */
      closeProposalOnExecutionFailure?: boolean
      /**
       * Defaults to true.
       */
      onlyMembersExecute?: boolean
    }
  ): SecretModuleInstantiateInfo {
    const { codeIds, codeHashes } = mustGetSupportedChainConfig(chainId)
    if (!codeHashes) {
      throw new Error('Code hashes not configured for chain ' + chainId)
    }

    const pre_propose_info: PreProposeInfo = {
      module_may_propose: {
        info: {
          admin: { core_module: {} },
          code_id: config.approver
            ? codeIds.DaoPreProposeApprovalSingle
            : codeIds.DaoPreProposeSingle,
          code_hash: config.approver
            ? codeHashes.DaoPreProposeApprovalSingle
            : codeHashes.DaoPreProposeSingle,
          label: `dao-pre-propose${
            config.approver ? '-approval' : ''
          }-single_${Date.now()}`,
          msg: encodeJsonToBase64(
            config.approver
              ? ({
                  deposit_info: config.deposit,
                  extension: {
                    approver: config.approver,
                  },
                  open_proposal_submission:
                    config.submissionPolicy === 'anyone',
                  proposal_module_code_hash: codeHashes.DaoProposalSingle,
                } as SecretDaoPreProposeApprovalSingleInstantiateMsg)
              : ({
                  deposit_info: config.deposit,
                  extension: {},
                  open_proposal_submission:
                    config.submissionPolicy === 'anyone',
                  proposal_module_code_hash: codeHashes.DaoProposalSingle,
                } as SecretDaoPreProposeSingleInstantiateMsg)
          ),
          funds: [],
        },
      },
    }

    return {
      admin: { core_module: {} },
      code_id: codeIds.DaoProposalSingle,
      code_hash: codeHashes.DaoProposalSingle,
      label: `dao-proposal-single_${Date.now()}`,
      msg: encodeJsonToBase64({
        allow_revoting: config.allowRevoting,
        close_proposal_on_execution_failure:
          config.closeProposalOnExecutionFailure ?? true,
        dao_code_hash: codeHashes.DaoCore,
        max_voting_period: config.maxVotingPeriod,
        min_voting_period: config.minVotingPeriod,
        only_members_execute: config.onlyMembersExecute ?? true,
        pre_propose_info,
        threshold: config.threshold,
        veto: config.veto,
      } as InstantiateMsg),
      funds: [],
    }
  }

  async propose({
    data,
    getSigningClient,
    sender,
    funds,
  }: {
    data: NewProposalData
    getSigningClient: () => Promise<SupportedSigningCosmWasmClient>
    sender: string
    funds?: Coin[]
  }): Promise<{
    proposalNumber: number
    proposalId: string
  }> {
    const client = await getSigningClient()
    const permit = await this.dao.getPermit(sender)

    let proposalNumber: number
    let isPreProposeApprovalProposal = false

    if (this.prePropose) {
      const { events } = await new SecretDaoPreProposeSingleClient(
        client,
        sender,
        this.prePropose.address
      ).propose({
        msg: {
          // Type mismatch between Cosmos msgs and Secret Network Cosmos msgs.
          // The contract execution will fail if the messages are invalid, so
          // this is safe. The UI should ensure that the co rrect messages are
          // used for the given chain anyways.
          propose: data as any,
        },
        auth: {
          permit,
        },
      })

      isPreProposeApprovalProposal =
        this.prePropose.contractName === ContractName.PreProposeApprovalSingle
      proposalNumber =
        // pre-propose-approval proposals have a different event
        isPreProposeApprovalProposal
          ? Number(
              findWasmAttributeValue(
                this.dao.chainId,
                events,
                this.prePropose.address,
                'id'
              ) ?? -1
            )
          : Number(
              findWasmAttributeValue(
                this.dao.chainId,
                events,
                this.address,
                'proposal_id'
              ) ?? -1
            )
    } else {
      const { events } = await new SecretDaoProposalSingleClient(
        client,
        sender,
        this.address
      ).propose(
        // Type mismatch between Cosmos msgs and Secret Network Cosmos msgs.
        // The contract execution will fail if the messages are invalid, so this
        // is safe. The UI should ensure that the correct messages are used for
        // the given chain anyways.
        data as any,
        undefined,
        undefined,
        funds
      )

      proposalNumber = Number(
        findWasmAttributeValue(
          this.dao.chainId,
          events,
          this.address,
          'proposal_id'
        ) ?? -1
      )
    }

    if (proposalNumber === -1) {
      throw new Error('Proposal ID not found')
    }

    return {
      proposalNumber,
      // Proposal IDs are the the prefix plus the proposal number. If a
      // pre-propose-approval proposal, an asterisk is inserted in the middle.
      proposalId: `${this.prefix}${
        isPreProposeApprovalProposal ? '*' : ''
      }${proposalNumber}`,
    }
  }

  async vote({
    proposalId,
    vote,
    getSigningClient,
    sender,
  }: {
    proposalId: number
    vote: Vote
    getSigningClient: () => Promise<SupportedSigningCosmWasmClient>
    sender: string
  }): Promise<void> {
    const client = await getSigningClient()
    const permit = await this.dao.getPermit(sender)

    await new SecretDaoProposalSingleClient(client, sender, this.address).vote({
      proposalId,
      vote,
      auth: {
        permit,
      },
    })

    await this.queryClient.refetchQueries({
      queryKey: this.getVoteQuery({
        proposalId,
        voter: sender,
      }).queryKey,
    })
  }

  async execute({
    proposalId,
    getSigningClient,
    sender,
    memo,
  }: {
    proposalId: number
    getSigningClient: () => Promise<SupportedSigningCosmWasmClient>
    sender: string
    memo?: string
  }): Promise<void> {
    const client = await getSigningClient()
    const permit = await this.dao.getPermit(sender)

    await new SecretDaoProposalSingleClient(
      client,
      sender,
      this.address
    ).execute(
      {
        proposalId,
        auth: {
          permit,
        },
      },
      undefined,
      memo
    )
  }

  async close({
    proposalId,
    getSigningClient,
    sender,
  }: {
    proposalId: number
    getSigningClient: () => Promise<SupportedSigningCosmWasmClient>
    sender: string
  }): Promise<void> {
    const client = await getSigningClient()
    await new SecretDaoProposalSingleClient(client, sender, this.address).close(
      {
        proposalId,
      }
    )
  }

  getVoteQuery({
    proposalId,
    voter,
  }: {
    proposalId: number
    voter?: string
  }): FetchQueryOptions<VoteResponse> {
    const permit = voter && this.dao.getExistingPermit(voter)
    return secretDaoProposalSingleQueries.getVote({
      chainId: this.dao.chainId,
      contractAddress: this.info.address,
      // Force type-cast since the query won't be enabled until this is set.
      // This allows us to pass an undefined `voter` argument in order to
      // invalidate/refresh the query for all voters.
      args: {
        proposalId,
        ...(permit && { auth: { permit } }),
      } as any,
      // If no voter nor permit, return query in loading state.
      options: {
        enabled: !!permit,
      },
    })
  }

  async getVote(
    options: Parameters<SecretSingleChoiceProposalModule['getVoteQuery']>[0],
    /**
     * Whether or not to prompt the wallet for a permit. If true,
     * `dao.registerSignAmino` must be called first.
     *
     * Defaults to false.
     */
    prompt = false
  ): Promise<VoteInfo | null> {
    if (prompt && options.voter) {
      // Load permit now which will be retrieved in getVoteQuery.
      await this.dao.getPermit(options.voter)
    }

    return (
      (await this.queryClient.fetchQuery(this.getVoteQuery(options))).vote ||
      null
    )
  }

  getProposalCountQuery(): FetchQueryOptions<number> {
    return secretDaoProposalSingleQueries.proposalCount({
      chainId: this.dao.chainId,
      contractAddress: this.info.address,
    })
  }
}
