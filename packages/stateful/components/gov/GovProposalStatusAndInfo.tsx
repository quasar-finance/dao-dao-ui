import { EncodeObject } from '@cosmjs/proto-signing'
import { coins } from '@cosmjs/stargate'
import {
  AccountCircleOutlined,
  AttachMoney,
  HourglassTopRounded,
  PaidOutlined,
  RotateRightOutlined,
} from '@mui/icons-material'
import clsx from 'clsx'
import { ComponentProps, ComponentType, useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useSetRecoilState } from 'recoil'

import {
  genericTokenSelector,
  refreshGovProposalsAtom,
} from '@dao-dao/state/recoil'
import {
  GOV_PROPOSAL_STATUS_I18N_KEY_MAP,
  Logo,
  NumberInput,
  ProposalStatusAndInfoProps,
  ProposalStatusAndInfo as StatelessProposalStatusAndInfo,
  Tooltip,
  useCachedLoading,
  useChain,
  useConfiguredChainContext,
  useDaoNavHelpers,
} from '@dao-dao/stateless'
import {
  GenericToken,
  GovProposalVersion,
  GovProposalWithMetadata,
  TokenType,
} from '@dao-dao/types'
import { ProposalStatus } from '@dao-dao/types/protobuf/codegen/cosmos/gov/v1beta1/gov'
import { MsgDeposit } from '@dao-dao/types/protobuf/codegen/cosmos/gov/v1beta1/tx'
import {
  CHAIN_GAS_MULTIPLIER,
  convertDenomToMicroDenomStringWithDecimals,
  convertMicroDenomToDenomWithDecimals,
  formatPercentOf100,
  getDisplayNameForChainId,
  processError,
} from '@dao-dao/utils'

import { useLoadingGovProposal, useWallet } from '../../hooks'
import { ButtonLink } from '../ButtonLink'
import { EntityDisplay } from '../EntityDisplay'
import { SuspenseLoader } from '../SuspenseLoader'
import { GovProposalVoter } from './GovProposalVoter'

export type GovProposalStatusAndInfoProps = {
  inline?: boolean
  proposalId: string
}

export const GovProposalStatusAndInfo = (
  props: GovProposalStatusAndInfoProps
) => {
  const { chain_id: chainId } = useChain()

  const loadingProposal = useLoadingGovProposal(props.proposalId)
  const depositToken = useCachedLoading(
    loadingProposal.loading
      ? undefined
      : genericTokenSelector({
          chainId,
          type: TokenType.Native,
          // Allow depositing first deposit token.
          denomOrAddress: loadingProposal.data.minDeposit[0].denom,
        }),
    undefined
  )

  return (
    <SuspenseLoader
      fallback={<InnerProposalStatusAndInfoLoader {...props} />}
      forceFallback={loadingProposal.loading}
    >
      {!loadingProposal.loading &&
        !depositToken.loading &&
        !!depositToken.data && (
          <InnerGovProposalStatusAndInfo
            {...props}
            depositToken={depositToken.data}
            proposal={loadingProposal.data}
          />
        )}
    </SuspenseLoader>
  )
}

const InnerGovProposalStatusAndInfo = ({
  proposal,
  depositToken,
  ...props
}: GovProposalStatusAndInfoProps & {
  proposal: GovProposalWithMetadata
  depositToken: GenericToken
}) => {
  const { t } = useTranslation()
  const {
    chain: { chain_id: chainId },
    config: { name: chainConfigName },
  } = useConfiguredChainContext()
  const {
    isWalletConnected,
    address: walletAddress = '',
    getSigningStargateClient,
  } = useWallet()
  const { getDaoPath } = useDaoNavHelpers()

  const {
    id: proposalId,
    proposal: { status, totalDeposit },
    minDeposit,
    timestampInfo,
    votesInfo: {
      turnoutYesPercent,
      thresholdReached,
      quorumReached,
      vetoReached,
    },
  } = proposal

  const minDepositAmount = minDeposit.find(
    (d) => d.denom === depositToken.denomOrAddress
  )!.amount
  const currentDepositAmount = totalDeposit.find(
    (d) => d.denom === depositToken.denomOrAddress
  )!.amount

  const missingDeposit = convertMicroDenomToDenomWithDecimals(
    Number(minDepositAmount) - Number(currentDepositAmount),
    depositToken.decimals
  )

  const info: ProposalStatusAndInfoProps['info'] = [
    {
      Icon: (props) => <Logo {...props} />,
      label: t('title.dao'),
      Value: (props) => (
        <ButtonLink
          href={getDaoPath(chainConfigName)}
          variant="underline"
          {...props}
        >
          {getDisplayNameForChainId(chainId)}
        </ButtonLink>
      ),
    },
    ...(proposal.version === GovProposalVersion.V1 && proposal.proposal.proposer
      ? ([
          {
            Icon: AccountCircleOutlined,
            label: t('title.creator'),
            Value: (props) => (
              <EntityDisplay {...props} address={proposal.proposal.proposer} />
            ),
          },
        ] as ProposalStatusAndInfoProps['info'])
      : []),
    {
      Icon: RotateRightOutlined,
      label: t('title.status'),
      Value: (props) => (
        <p {...props}>{t(GOV_PROPOSAL_STATUS_I18N_KEY_MAP[status])}</p>
      ),
    },
    {
      Icon: PaidOutlined,
      label: t('title.deposited'),
      Value: (props) => (
        <p {...props}>
          {t('format.token', {
            amount: convertMicroDenomToDenomWithDecimals(
              currentDepositAmount,
              depositToken.decimals
            ).toLocaleString(undefined, {
              maximumFractionDigits: depositToken.decimals,
            }),
            symbol: depositToken.symbol,
          })}
        </p>
      ),
    },
    ...(timestampInfo.display
      ? ([
          {
            Icon: HourglassTopRounded,
            label: timestampInfo.display.label,
            Value: (props) => (
              <Tooltip title={timestampInfo.display!.tooltip}>
                <p {...props}>{timestampInfo.display!.content}</p>
              </Tooltip>
            ),
          },
        ] as ProposalStatusAndInfoProps['info'])
      : []),
  ]

  const statusText =
    status === ProposalStatus.PROPOSAL_STATUS_DEPOSIT_PERIOD
      ? t('info.proposalStatus.depositPeriod')
      : status === ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD
      ? !quorumReached
        ? t('info.proposalStatus.willFailBadQuorum')
        : vetoReached
        ? t('info.proposalStatus.willVeto')
        : thresholdReached
        ? t('info.proposalStatus.willPass')
        : t('info.proposalStatus.willFailBadThreshold')
      : t('info.proposalStatus.govNotOpen', {
          turnoutYesPercent: formatPercentOf100(turnoutYesPercent),
        })

  const setRefreshProposal = useSetRecoilState(refreshGovProposalsAtom(chainId))
  const refreshProposal = useCallback(
    () => setRefreshProposal((id) => id + 1),
    [setRefreshProposal]
  )

  const [depositValue, setDepositValue] = useState(missingDeposit)
  const [depositing, setDepositing] = useState(false)
  const deposit = useCallback(async () => {
    if (!isWalletConnected) {
      toast.error(t('error.logInToContinue'))
      return
    }

    setDepositing(true)
    try {
      const client = await getSigningStargateClient()

      const encodeObject: EncodeObject = {
        typeUrl: MsgDeposit.typeUrl,
        value: {
          proposalId,
          depositor: walletAddress,
          amount: coins(
            convertDenomToMicroDenomStringWithDecimals(
              depositValue,
              depositToken.decimals
            ),
            depositToken.denomOrAddress
          ),
        },
      }

      await client.signAndBroadcast(
        walletAddress,
        [encodeObject],
        CHAIN_GAS_MULTIPLIER
      )

      toast.success(
        t('success.deposited', {
          amount: depositValue,
          tokenSymbol: depositToken.symbol,
        })
      )
    } catch (err) {
      console.error(err)
      toast.error(processError(err))
    } finally {
      refreshProposal()
      setDepositing(false)
    }
  }, [
    depositToken.decimals,
    depositToken.denomOrAddress,
    depositToken.symbol,
    depositValue,
    getSigningStargateClient,
    isWalletConnected,
    proposalId,
    refreshProposal,
    t,
    walletAddress,
  ])

  const Voter = useCallback(
    (props: ComponentProps<Required<ProposalStatusAndInfoProps>['Voter']>) => (
      <GovProposalVoter {...props} proposalId={proposalId.toString()} />
    ),
    [proposalId]
  )

  return (
    <StatelessProposalStatusAndInfo
      {...props}
      Voter={
        status === ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD
          ? Voter
          : undefined
      }
      action={
        status === ProposalStatus.PROPOSAL_STATUS_DEPOSIT_PERIOD
          ? {
              header: (
                <NumberInput
                  containerClassName="-mb-1"
                  max={missingDeposit}
                  min={convertMicroDenomToDenomWithDecimals(
                    1,
                    depositToken.decimals
                  )}
                  onInput={(event) =>
                    setDepositValue(
                      Number(
                        Number(
                          (event.target as HTMLInputElement).value
                        ).toFixed(depositToken.decimals)
                      )
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      deposit()
                    }
                  }}
                  setValue={(_, value) => setDepositValue(value)}
                  step={convertMicroDenomToDenomWithDecimals(
                    1,
                    depositToken.decimals
                  )}
                  unit={'$' + depositToken.symbol}
                  value={depositValue}
                />
              ),
              label: t('button.deposit'),
              Icon: AttachMoney,
              loading: depositing,
              doAction: deposit,
            }
          : undefined
      }
      info={info}
      status={statusText}
    />
  )
}

const InnerProposalStatusAndInfoLoader = (
  props: GovProposalStatusAndInfoProps
) => {
  const { t } = useTranslation()
  const {
    config: { name },
    chain,
  } = useConfiguredChainContext()
  const { getDaoPath } = useDaoNavHelpers()

  const LoaderP: ComponentType<{ className: string }> = ({ className }) => (
    <p className={clsx('animate-pulse', className)}>...</p>
  )
  const info: ProposalStatusAndInfoProps['info'] = [
    {
      Icon: (props) => <Logo {...props} />,
      label: t('title.dao'),
      Value: (props) => (
        <ButtonLink href={getDaoPath(name)} variant="underline" {...props}>
          {getDisplayNameForChainId(chain.chain_id)}
        </ButtonLink>
      ),
    },
    {
      Icon: AccountCircleOutlined,
      label: t('title.creator'),
      Value: LoaderP,
    },
    {
      Icon: RotateRightOutlined,
      label: t('title.status'),
      Value: LoaderP,
    },
    {
      Icon: HourglassTopRounded,
      label: t('title.date'),
      Value: LoaderP,
    },
  ]

  return (
    <StatelessProposalStatusAndInfo
      {...props}
      info={info}
      status={t('info.loading')}
    />
  )
}
