import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { waitForAll } from 'recoil'

import {
  DaoSplashHeader,
  useAppContext,
  useCachedLoadable,
  useDaoContext,
} from '@dao-dao/stateless'
import { CheckedDepositInfo, DaoPageMode } from '@dao-dao/types'

import { useDaoWithWalletSecretNetworkPermit } from '../../../hooks'
import { matchAndLoadCommon } from '../../../proposal-module-adapter'
import { useVotingModuleAdapter } from '../../../voting-module-adapter'
import { ButtonLink } from '../../ButtonLink'
import { ConnectWallet } from '../../ConnectWallet'
import { LinkWrapper } from '../../LinkWrapper'
import { CreateDaoPermit } from '../CreateDaoPermit'
import { DaoWidgets } from '../DaoWidgets'
import { MainDaoInfoCards } from '../MainDaoInfoCards'

export const HomeTab = () => {
  const { t } = useTranslation()
  const { dao } = useDaoContext()
  const { mode } = useAppContext()
  const { isWalletConnected, isSecretNetworkPermitNeeded } =
    useDaoWithWalletSecretNetworkPermit()

  const {
    components: { ProfileCardMemberInfo },
    hooks: { useCommonGovernanceTokenInfo },
  } = useVotingModuleAdapter()

  const depositInfoSelectors = useMemo(
    () =>
      dao.proposalModules.map(
        (proposalModule) =>
          matchAndLoadCommon(dao, proposalModule.address).selectors.depositInfo
      ),
    [dao]
  )
  const proposalModuleDepositInfosLoadable = useCachedLoadable(
    waitForAll(depositInfoSelectors)
  )

  const { denomOrAddress: governanceDenomOrAddress } =
    useCommonGovernanceTokenInfo?.() ?? {}

  // Get max deposit of governance token across all proposal modules.
  const maxGovernanceTokenProposalModuleDeposit =
    proposalModuleDepositInfosLoadable.state !== 'hasValue'
      ? 0
      : Math.max(
          ...proposalModuleDepositInfosLoadable.contents
            .filter(
              (depositInfo): depositInfo is CheckedDepositInfo =>
                !!depositInfo &&
                ('cw20' in depositInfo.denom
                  ? depositInfo.denom.cw20
                  : depositInfo.denom.native) === governanceDenomOrAddress
            )
            .map(({ amount }) => Number(amount)),
          0
        )

  return (
    <div className="flex flex-col items-stretch gap-4">
      {mode === DaoPageMode.Sda && (
        <DaoSplashHeader
          ButtonLink={ButtonLink}
          LinkWrapper={LinkWrapper}
          daoInfo={dao.info}
        />
      )}

      <p className="title-text mt-2">{t('title.membership')}</p>

      <div className="w-full rounded-md bg-background-tertiary p-4 md:w-2/3 lg:w-1/2">
        {isWalletConnected && !isSecretNetworkPermitNeeded ? (
          <ProfileCardMemberInfo
            maxGovernanceTokenDeposit={
              maxGovernanceTokenProposalModuleDeposit > 0
                ? BigInt(maxGovernanceTokenProposalModuleDeposit).toString()
                : undefined
            }
          />
        ) : isSecretNetworkPermitNeeded ? (
          <CreateDaoPermit />
        ) : (
          <>
            <p className="body-text mb-3">{t('info.logInToViewMembership')}</p>

            <ConnectWallet size="md" />
          </>
        )}
      </div>

      <p className="title-text mt-4">{t('title.details')}</p>

      <MainDaoInfoCards />

      <DaoWidgets />
    </div>
  )
}
