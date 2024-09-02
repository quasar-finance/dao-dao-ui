import { useState } from 'react'

import {
  ProposalContentDisplay,
  useDaoInfoContext,
  useDaoNavHelpers,
} from '@dao-dao/stateless'
import {
  CommonProposalInfo,
  PreProposeModuleType,
  ProposalPrefill,
} from '@dao-dao/types'
import { encodeJsonToBase64 } from '@dao-dao/utils'

import { useActionsForMatching } from '../../actions'
import { useEntity } from '../../hooks'
import { useProposalModuleAdapterContext } from '../../proposal-module-adapter'
import { EntityDisplay } from '../EntityDisplay'
import { IconButtonLink } from '../IconButtonLink'

export type DaoProposalContentDisplayProps = {
  proposalInfo: CommonProposalInfo
  setSeenAllActionPages: (() => void) | undefined
}

export const DaoProposalContentDisplay = ({
  proposalInfo,
  setSeenAllActionPages,
}: DaoProposalContentDisplayProps) => {
  const { coreAddress } = useDaoInfoContext()
  const { getDaoProposalPath } = useDaoNavHelpers()
  const actionsForMatching = useActionsForMatching()
  const {
    id,
    options: { proposalModule },
    adapter: {
      components: { ProposalInnerContentDisplay },
      hooks: { useProposalRefreshers },
    },
  } = useProposalModuleAdapterContext()

  const creatorAddress =
    proposalModule.prePropose?.type === PreProposeModuleType.Approver
      ? proposalModule.prePropose.config.approvalDao
      : proposalInfo.createdByAddress
  const { entity } = useEntity(creatorAddress)

  const { refreshProposal, refreshing } = useProposalRefreshers()

  // This gets passed down to the proposal module adapter's
  // ProposalInnerContentDisplay which is responsible for setting the duplicate
  // form data once it's loaded.
  const [duplicateFormData, setDuplicateFormData] =
    useState<ProposalPrefill<any>>()
  const prefill: ProposalPrefill<any> = {
    id,
    data: duplicateFormData,
  }
  // Don't set duplicate URL until form data is present. This ensures the
  // duplicate button remains hidden until the form data is loaded.
  const duplicateUrl = duplicateFormData
    ? getDaoProposalPath(coreAddress, 'create', {
        prefill: encodeJsonToBase64(prefill),
      })
    : undefined

  return (
    <ProposalContentDisplay
      EntityDisplay={EntityDisplay}
      IconButtonLink={IconButtonLink}
      createdAt={
        proposalInfo.createdAtEpoch !== null
          ? new Date(proposalInfo.createdAtEpoch)
          : undefined
      }
      creator={{
        address: creatorAddress,
        entity,
      }}
      description={proposalInfo.description}
      duplicateUrl={duplicateUrl}
      innerContentDisplay={
        <ProposalInnerContentDisplay
          actionsForMatching={actionsForMatching}
          setDuplicateFormData={setDuplicateFormData}
          setSeenAllActionPages={setSeenAllActionPages}
        />
      }
      onRefresh={refreshProposal}
      refreshing={refreshing}
      title={proposalInfo.title}
    />
  )
}
