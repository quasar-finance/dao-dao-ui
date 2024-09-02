import queryString from 'query-string'

import { ActionKeyAndDataNoId, DaoPageMode, DaoTabId } from '@dao-dao/types'

import { DaoProposalSingleAdapterId } from './constants/adapters'
import { encodeJsonToBase64 } from './messages'

// Create a path to a DAO page based on the app's page mode.
export const getDaoPath = (
  mode: DaoPageMode,
  coreAddress: string,
  path?: string,
  params?: Record<string, unknown>
) => {
  const base =
    (mode === DaoPageMode.Dapp ? `/dao/${coreAddress}` : `/${coreAddress}`) +
    (path ? `/${path}` : '')
  const query = params ? `?${queryString.stringify(params)}` : ''

  return base + query
}

// Create a path to a DAO proposal page based on the app's page mode.
export const getDaoProposalPath = (
  mode: DaoPageMode,
  coreAddress: string,
  proposalId: string,
  params?: Record<string, unknown>
) => {
  const base = getDaoPath(
    mode,
    coreAddress,
    `${DaoTabId.Proposals}/${proposalId}`
  )
  const query = params ? `?${queryString.stringify(params)}` : ''

  return base + query
}

// Create a path to an account's page.
export const getAccountPath = (
  address: string,
  path?: string,
  params?: Record<string, unknown>
) => {
  const base = `/account/${address}` + (path ? `/${path}` : '')
  const query = params ? `?${queryString.stringify(params)}` : ''

  return base + query
}

// Create a path for the profile transaction builder with a pre-filled
// transaction form.
export const getActionBuilderPrefillPath = (
  actions: ActionKeyAndDataNoId[]
) => {
  const base = '/actions'
  const query = `?${queryString.stringify({
    prefill: encodeJsonToBase64({
      actions: actions.map((action, index) => ({
        _id: index.toString(),
        ...action,
      })),
    }),
  })}`

  return base + query
}

// Create prefill URL parameter for a DAO's single choice proposal module.
export const getDaoProposalSinglePrefill = ({
  title = '',
  description = '',
  actions = [],
}: {
  actions?: ActionKeyAndDataNoId[]
  title?: string
  description?: string
}): string =>
  encodeJsonToBase64({
    id: DaoProposalSingleAdapterId,
    data: {
      title,
      description,
      actionData: actions.map((action, index) => ({
        _id: index.toString(),
        ...action,
      })),
    },
  })
