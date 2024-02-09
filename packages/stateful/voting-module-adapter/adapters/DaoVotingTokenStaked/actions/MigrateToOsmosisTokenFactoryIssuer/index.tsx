import { useCallback } from 'react'

import {
  DaoVotingTokenStakedSelectors,
  contractDetailsSelector,
} from '@dao-dao/state/recoil'
import { PufferfishEmoji, useCachedLoadable } from '@dao-dao/stateless'
import { ChainId } from '@dao-dao/types'
import {
  ActionChainContextType,
  ActionKey,
  ActionMaker,
  UseDecodedCosmosMsg,
  UseDefaults,
  UseHideFromPicker,
  UseTransformToCosmos,
} from '@dao-dao/types/actions'
import { makeWasmMessage, objectMatchesStructure } from '@dao-dao/utils'

import { useVotingModuleAdapterOptions } from '../../../../react/context'
import { useGovernanceTokenInfo } from '../../hooks'
import {
  MigrateToOsmosisTokenFactoryIssuerComponent,
  MigrateToOsmosisTokenFactoryIssuerData,
} from './Component'

const useDefaults: UseDefaults<
  MigrateToOsmosisTokenFactoryIssuerData
> = () => ({})

export const makeMigrateToOsmosisTokenFactoryIssuerAction: ActionMaker<
  MigrateToOsmosisTokenFactoryIssuerData
> = ({ t, chainContext }) => {
  // Only Migaloo DAOs need to migrate.
  if (
    chainContext.chainId !== ChainId.MigalooMainnet ||
    chainContext.type !== ActionChainContextType.Supported
  ) {
    return null
  }

  const useTransformToCosmos: UseTransformToCosmos<
    MigrateToOsmosisTokenFactoryIssuerData
  > = () => {
    const { tokenFactoryIssuerAddress } = useGovernanceTokenInfo()

    return useCallback(
      () =>
        makeWasmMessage({
          wasm: {
            migrate: {
              contract_addr: tokenFactoryIssuerAddress,
              new_code_id:
                chainContext.config.codeIds.CwTokenfactoryIssuerOsmosis,
              msg: {},
            },
          },
        }),
      [tokenFactoryIssuerAddress]
    )
  }

  const useDecodedCosmosMsg: UseDecodedCosmosMsg<
    MigrateToOsmosisTokenFactoryIssuerData
  > = (msg: Record<string, any>) => {
    const { tokenFactoryIssuerAddress } = useGovernanceTokenInfo()

    return objectMatchesStructure(msg, {
      wasm: {
        migrate: {
          contract_addr: {},
          new_code_id: {},
          msg: {},
        },
      },
    }) && msg.wasm.migrate.contract_addr === tokenFactoryIssuerAddress
      ? {
          match: true,
          data: {},
        }
      : {
          match: false,
        }
  }

  // Only show in picker if using cw-tokenfactory-issuer contract and it's on the
  // old version of the contract.
  const useHideFromPicker: UseHideFromPicker = () => {
    const { chainId, votingModuleAddress } = useVotingModuleAdapterOptions()

    const tfIssuer = useCachedLoadable(
      DaoVotingTokenStakedSelectors.validatedTokenfactoryIssuerContractSelector(
        {
          contractAddress: votingModuleAddress,
          chainId,
        }
      )
    )
    const tfIssuerContract = useCachedLoadable(
      tfIssuer.state === 'hasValue' && tfIssuer.contents
        ? contractDetailsSelector({
            contractAddress: tfIssuer.contents,
            chainId,
          })
        : undefined
    )

    return (
      !chainContext.config.codeIds.CwTokenfactoryIssuerCosmWasm ||
      tfIssuerContract.state !== 'hasValue' ||
      tfIssuerContract.contents.codeId !==
        chainContext.config.codeIds.CwTokenfactoryIssuerCosmWasm
    )
  }

  return {
    key: ActionKey.MigrateToOsmosisTokenFactoryIssuer,
    Icon: PufferfishEmoji,
    label: t('title.migrateTokenFactoryModule'),
    description: t('info.migrateTokenFactoryModuleDescription'),
    Component: MigrateToOsmosisTokenFactoryIssuerComponent,
    useDefaults,
    useTransformToCosmos,
    useDecodedCosmosMsg,
    useHideFromPicker,
  }
}
