import { useCallback } from 'react'

import { DaoDaoCoreSelectors } from '@dao-dao/state'
import { InfoEmoji, useCachedLoadingWithError } from '@dao-dao/stateless'
import {
  ActionContextType,
  ActionMaker,
  ChainId,
  ContractVersion,
} from '@dao-dao/types'
import {
  ActionKey,
  UseDecodedCosmosMsg,
  UseDefaults,
  UseTransformToCosmos,
} from '@dao-dao/types/actions'
import { makeWasmMessage, objectMatchesStructure } from '@dao-dao/utils'

import { UpdateInfoComponent as Component, UpdateInfoData } from './Component'

export const makeUpdateInfoAction: ActionMaker<UpdateInfoData> = ({
  t,
  address,
  context,
  chain: { chain_id: chainId },
}) => {
  // Only DAOs.
  if (context.type !== ActionContextType.Dao) {
    return null
  }

  const useDefaults: UseDefaults<UpdateInfoData> = () => {
    const config = useCachedLoadingWithError(
      DaoDaoCoreSelectors.configSelector({
        chainId,
        contractAddress: address,
        params: [],
      })
    )

    return config.loading
      ? undefined
      : config.errored
      ? config.error
      : {
          ...config.data,
        }
  }

  const useTransformToCosmos: UseTransformToCosmos<UpdateInfoData> = () =>
    useCallback(
      (data: UpdateInfoData) =>
        makeWasmMessage({
          wasm: {
            execute: {
              contract_addr: address,
              funds: [],
              msg: {
                update_config: {
                  config:
                    context.dao.chainId === ChainId.NeutronMainnet &&
                    context.dao.coreVersion ===
                      ContractVersion.V2AlphaNeutronFork
                      ? // The Neutron fork DAO has a different config structure.
                        {
                          name: data.name,
                          description: data.description,
                          dao_uri: 'dao_uri' in data ? data.dao_uri : null,
                        }
                      : {
                          ...data,
                          // Replace empty string with null.
                          image_url: data.image_url?.trim() || null,
                        },
                },
              },
            },
          },
        }),
      []
    )

  const useDecodedCosmosMsg: UseDecodedCosmosMsg<UpdateInfoData> = (
    msg: Record<string, any>
  ) =>
    objectMatchesStructure(msg, {
      wasm: {
        execute: {
          contract_addr: {},
          funds: {},
          msg: {
            update_config: {
              config: {
                name: {},
                description: {},
              },
            },
          },
        },
      },
    }) && msg.wasm.execute.contract_addr === address
      ? {
          match: true,
          data: {
            name: msg.wasm.execute.msg.update_config.config.name,
            description: msg.wasm.execute.msg.update_config.config.description,

            // Only add image url if in the message.
            ...(!!msg.wasm.execute.msg.update_config.config.image_url && {
              image_url: msg.wasm.execute.msg.update_config.config.image_url,
            }),

            // V1 and V2 passthrough
            automatically_add_cw20s:
              msg.wasm.execute.msg.update_config.config.automatically_add_cw20s,
            automatically_add_cw721s:
              msg.wasm.execute.msg.update_config.config
                .automatically_add_cw721s,

            // V2 passthrough
            // Only add dao URI if in the message.
            ...('dao_uri' in msg.wasm.execute.msg.update_config.config && {
              dao_uri: msg.wasm.execute.msg.update_config.config.dao_uri,
            }),
          },
        }
      : {
          match: false,
        }

  return {
    key: ActionKey.UpdateInfo,
    Icon: InfoEmoji,
    label: t('title.updateInfo'),
    description: t('info.updateInfoActionDescription'),
    notReusable: true,
    Component,
    useDefaults,
    useTransformToCosmos,
    useDecodedCosmosMsg,
  }
}
