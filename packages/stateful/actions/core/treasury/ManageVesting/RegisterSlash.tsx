import { ComponentType } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  ButtonLink,
  ChainProvider,
  InputErrorMessage,
  InputThemedText,
  Loader,
  SelectCircle,
  Table,
  TokenAmountDisplay,
} from '@dao-dao/stateless'
import {
  ActionComponent,
  LoadingData,
  LoadingDataWithError,
  StatefulEntityDisplayProps,
  TransProps,
  VestingInfo,
  VestingValidatorSlash,
} from '@dao-dao/types'
import {
  convertMicroDenomToDenomWithDecimals,
  getChainAddressForActionOptions,
  getNativeTokenForChainId,
} from '@dao-dao/utils'

import { useActionOptions } from '../../../react/context'

export type RegisterSlashData = {
  chainId: string
  address: string
  validator: string
  time: string
  amount: string
  duringUnbonding: boolean
}

export type RegisterSlashOptions = {
  vestingInfos: LoadingDataWithError<VestingInfo[]>
  selectedVest: LoadingData<VestingInfo | undefined>
  EntityDisplay: ComponentType<StatefulEntityDisplayProps>
  Trans: ComponentType<TransProps>
}

export const RegisterSlash: ActionComponent<RegisterSlashOptions> = ({
  fieldNamePrefix,
  errors,
  isCreating,
  options: { vestingInfos, selectedVest, EntityDisplay, Trans },
}) => {
  const { t } = useTranslation()
  const options = useActionOptions()

  const { watch, setValue } = useFormContext<RegisterSlashData>()
  const chainId = watch((fieldNamePrefix + 'chainId') as 'chainId')

  // Only vesting contracts with unregistered slashes where the owner is set.
  const registerableVests =
    vestingInfos.loading || vestingInfos.errored
      ? undefined
      : vestingInfos.data.filter(
          ({ chainId, owner, hasUnregisteredSlashes }) => {
            const chainAddress = getChainAddressForActionOptions(
              options,
              chainId
            )

            return (
              owner &&
              chainAddress &&
              (owner.address === chainAddress ||
                (owner.isCw1Whitelist &&
                  owner.cw1WhitelistAdmins.includes(chainAddress))) &&
              hasUnregisteredSlashes
            )
          }
        )

  const onSelectSlash = (
    chainId: string,
    address: string,
    validator: string,
    { timeMs, unregisteredAmount, duringUnbonding }: VestingValidatorSlash
  ) => {
    setValue((fieldNamePrefix + 'chainId') as 'chainId', chainId)
    setValue((fieldNamePrefix + 'address') as 'address', address)
    setValue((fieldNamePrefix + 'validator') as 'validator', validator)
    // Milliseconds to nanoseconds.
    setValue(
      (fieldNamePrefix + 'time') as 'time',
      BigInt(timeMs * 1e6).toString()
    )
    setValue(
      (fieldNamePrefix + 'amount') as 'amount',
      unregisteredAmount.toString()
    )
    // While staked.
    setValue(
      (fieldNamePrefix + 'duringUnbonding') as 'duringUnbonding',
      duringUnbonding
    )
  }

  return (
    <ChainProvider chainId={chainId}>
      <div className="flex flex-col gap-2">
        <div className="body-text mb-4 max-w-prose">
          <Trans i18nKey="info.registerSlashVestingExplanation">
            <p className="inline">
              When a slash occurs against a validator with whom a vesting
              contract is currently staking or unstaking tokens, the slash needs
              to be registered with the vesting contract. For more information,
              see the Slashing section of the vesting contract&apos;s
            </p>
            <ButtonLink
              className="!body-text"
              containerClassName="inline-block"
              href="https://github.com/DA0-DA0/dao-contracts/blob/main/contracts/external/cw-vesting/SECURITY.md#slashing"
              variant="underline"
            >
              security documentation
            </ButtonLink>
            <p className="inline">.</p>
          </Trans>
        </div>

        {isCreating ? (
          !registerableVests ? (
            <Loader />
          ) : registerableVests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {registerableVests.map((info) => (
                <RenderVest
                  key={info.chainId + info.vestingContractAddress}
                  EntityDisplay={EntityDisplay}
                  fieldNamePrefix={fieldNamePrefix}
                  info={info}
                  isCreating={isCreating}
                  onSelectSlash={(validator, slash) =>
                    onSelectSlash(
                      info.chainId,
                      info.vestingContractAddress,
                      validator,
                      slash
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <p className="text-text-interactive-error">
              {t('error.noVestingContractsNeedingSlashRegistration')}
            </p>
          )
        ) : // If not creating, show the selected vest.
        selectedVest.loading ? (
          <Loader />
        ) : selectedVest.data ? (
          <RenderVest
            EntityDisplay={EntityDisplay}
            fieldNamePrefix={fieldNamePrefix}
            info={selectedVest.data}
            isCreating={isCreating}
          />
        ) : (
          <p className="text-text-interactive-error">
            {t('error.loadingData')}
          </p>
        )}

        {/* Only show error if there are vests to choose from. If no vests, other error will show. */}
        {isCreating && !!registerableVests?.length && (
          <InputErrorMessage error={errors?.address} />
        )}
      </div>
    </ChainProvider>
  )
}

type RenderVestProps = {
  info: VestingInfo
  isCreating: boolean
  fieldNamePrefix: string
  selectedSlash?: VestingValidatorSlash
  onSelectSlash?: (validator: string, slash: VestingValidatorSlash) => void
  EntityDisplay: ComponentType<StatefulEntityDisplayProps>
}

const RenderVest = ({
  info: { chainId, vestingContractAddress, vest, slashes },
  isCreating,
  fieldNamePrefix,
  onSelectSlash,
  EntityDisplay,
}: RenderVestProps) => {
  const { t } = useTranslation()
  const nativeToken = getNativeTokenForChainId(chainId)

  const { watch } = useFormContext()
  const data = watch(fieldNamePrefix) as RegisterSlashData

  const unregisteredSlashes = slashes
    .flatMap(({ validatorOperatorAddress, slashes }) =>
      slashes.map((slash) => ({
        validatorOperatorAddress,
        slash,
      }))
    )
    .filter(({ slash }) => slash.unregisteredAmount > 0)

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-2">
        <p className="secondary-text">{t('form.recipient')}:</p>

        <EntityDisplay address={vest.recipient} />
      </div>

      {isCreating ? (
        <Table
          headers={[
            '',
            t('form.validator'),
            t('title.unregisteredSlashAmount'),
          ]}
          rows={unregisteredSlashes.map(
            ({ validatorOperatorAddress, slash }, index) => [
              <SelectCircle
                key={`${index}-select`}
                onSelect={() =>
                  onSelectSlash?.(validatorOperatorAddress, slash)
                }
                selected={
                  data.address === vestingContractAddress &&
                  data.time === BigInt(slash.timeMs * 1e6).toString() &&
                  data.duringUnbonding === slash.duringUnbonding
                }
              />,
              validatorOperatorAddress,
              <TokenAmountDisplay
                key={`${index}-token`}
                amount={convertMicroDenomToDenomWithDecimals(
                  slash.unregisteredAmount,
                  nativeToken.decimals
                )}
                decimals={nativeToken.decimals}
                iconUrl={nativeToken.imageUrl}
                symbol={nativeToken.symbol}
              />,
            ]
          )}
        />
      ) : (
        <>
          <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-2">
            <p className="secondary-text">{t('form.validator')}:</p>
            <InputThemedText className="break-all">
              {data.validator}
            </InputThemedText>
          </div>

          <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-2">
            <p className="secondary-text">
              {t('title.slashAmountToRegister')}:
            </p>

            <TokenAmountDisplay
              key="token"
              amount={convertMicroDenomToDenomWithDecimals(
                data.amount,
                nativeToken.decimals
              )}
              decimals={nativeToken.decimals}
              iconUrl={nativeToken.imageUrl}
              symbol={nativeToken.symbol}
            />
          </div>
        </>
      )}
    </div>
  )
}
