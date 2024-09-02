import { TFunction } from 'react-i18next'

import {
  DurationUnits,
  ProposalModule,
  ProposalVetoConfig,
} from '@dao-dao/types'
import {
  ProposalStatus,
  ProposalStatusKey,
} from '@dao-dao/types/contracts/common'
import {
  ProposalStatus as PreProposeStatus,
  ProposalStatusKey as PreProposeStatusKey,
} from '@dao-dao/types/contracts/DaoPreProposeApprovalSingle'
import { VetoConfig } from '@dao-dao/types/contracts/DaoProposalSingle.v2'

import {
  convertDurationToDurationWithUnits,
  convertDurationWithUnitsToDuration,
} from './conversion'

// Get the status key from the weirdly-formatted status enum.
export const keyFromPreProposeStatus = (
  status: PreProposeStatus
): PreProposeStatusKey => Object.keys(status)[0] as PreProposeStatusKey

/**
 * Returns the flattened key of the proposal status.
 *
 * @param {ProposalStatus} status - The proposal status.
 * @return {ProposalStatusKey} The flattened key of the proposal status.
 */
export const getProposalStatusKey = (
  status: ProposalStatus
): ProposalStatusKey =>
  typeof status === 'string'
    ? status
    : typeof status === 'object' && status
    ? (Object.keys(status)[0] as any)
    : (() => {
        throw new Error('Invalid proposal status.')
      })()

/**
 * Convert veto config into the veto object expected by proposal modules.
 */
export const convertVetoConfigToCosmos = (
  veto: ProposalVetoConfig
): VetoConfig | null =>
  veto.enabled
    ? {
        vetoer:
          // If more than one address set, there should be a cw1-whitelist
          // contract created. Otherwise, use the first address.
          veto.addresses.length > 1
            ? veto.cw1WhitelistAddress || ''
            : veto.addresses.length === 1
            ? veto.addresses[0].address
            : '',
        timelock_duration: convertDurationWithUnitsToDuration(
          veto.timelockDuration
        ),
        early_execute: veto.earlyExecute,
        veto_before_passed: veto.vetoBeforePassed,
      }
    : null

/**
 * Convert proposal module veto config into custom veto type. If config is
 * empty, returns default.
 */
export const convertCosmosVetoConfigToVeto = (
  veto: VetoConfig | null | undefined,
  // If provided, `veto.vetoer` should be a cw1-whitelist contract address, and
  // this should be its list of admins.
  cw1WhitelistAdmins?: string[] | null
): ProposalVetoConfig =>
  veto
    ? {
        enabled: true,
        addresses: cw1WhitelistAdmins?.map((address) => ({
          address,
        })) || [
          {
            address: veto.vetoer,
          },
        ],
        cw1WhitelistAddress: cw1WhitelistAdmins ? veto.vetoer : undefined,
        timelockDuration: convertDurationToDurationWithUnits(
          veto.timelock_duration
        ),
        earlyExecute: veto.early_execute,
        vetoBeforePassed: veto.veto_before_passed,
      }
    : {
        enabled: false,
        addresses: [
          {
            address: '',
          },
        ],
        cw1WhitelistAddress: undefined,
        timelockDuration: {
          value: 1,
          units: DurationUnits.Weeks,
        },
        earlyExecute: true,
        vetoBeforePassed: false,
      }

/**
 * Check whether or not the submission policy allows an address and return an
 * error text if not. If allowed to propose, return undefined.
 */
export const checkProposalSubmissionPolicy = ({
  proposalModule: { prePropose },
  address,
  isMember,
  t,
}: {
  /**
   * The proposal module.
   */
  proposalModule: ProposalModule
  /**
   * Current wallet address. Undefined if not connected.
   */
  address?: string
  /**
   * Whether or not the current wallet is a member of the DAO.
   */
  isMember?: boolean
  /**
   * I18n translation getter.
   */
  t: TFunction
}): string | undefined =>
  prePropose
    ? 'anyone' in prePropose.submissionPolicy
      ? // Cannot create proposal if on denylist.
        address &&
        prePropose.submissionPolicy.anyone.denylist?.includes(address)
        ? t('error.notAllowedToCreateProposal')
        : undefined
      : // Cannot create proposal if on denylist.
      address &&
        prePropose.submissionPolicy.specific.denylist?.includes(address)
      ? t('error.notAllowedToCreateProposal')
      : // Cannot create proposal if not a member.
      (!prePropose.submissionPolicy.specific.dao_members || !isMember) &&
        (!address ||
          !prePropose.submissionPolicy.specific.allowlist?.includes(address))
      ? // If members can propose and current wallet is not a member, prioritize that as the reason...
        prePropose.submissionPolicy.specific.dao_members && !isMember
        ? t('error.mustBeMemberToCreateProposal')
        : // ...otherwise their membership doesn't matter and they aren't on the allowlist.
          t('error.notAllowedToCreateProposal')
      : undefined
    : // If no pre-propose module in use, only DAO members can propose.
    isMember
    ? undefined
    : t('error.mustBeMemberToCreateProposal')
