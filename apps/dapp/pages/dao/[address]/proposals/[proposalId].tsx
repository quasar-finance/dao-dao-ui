// GNU AFFERO GENERAL PUBLIC LICENSE Version 3. Copyright (C) 2022 DAO DAO Contributors.
// See the "LICENSE" file in the root directory of this package for more copyright information.

import type { GetStaticPaths, GetStaticProps, NextPage } from 'next'

import {
  DaoPageWrapper,
  DaoProposal,
  DaoProposalProps,
  GovProposal,
} from '@dao-dao/stateful'
import { makeGetDaoProposalStaticProps } from '@dao-dao/stateful/server'
import { ContractVersion, DaoPageMode } from '@dao-dao/types'
import { SITE_URL, getDaoProposalPath } from '@dao-dao/utils'

const ProposalPage: NextPage<DaoProposalProps> = ({
  children: _,
  ...props
}) => (
  <DaoPageWrapper {...props}>
    {props.info?.coreVersion === ContractVersion.Gov ? (
      <GovProposal {...props} />
    ) : (
      <DaoProposal {...props} />
    )}
  </DaoPageWrapper>
)

export default ProposalPage

// Fallback to loading screen if page has not yet been statically
// generated.
export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: true,
})

export const getStaticProps: GetStaticProps = makeGetDaoProposalStaticProps({
  appMode: DaoPageMode.Dapp,
  getProposalUrlPrefix: ({ address }) =>
    SITE_URL +
    getDaoProposalPath(
      DaoPageMode.Dapp,
      typeof address === 'string' ? address : '',
      ''
    ),
})
