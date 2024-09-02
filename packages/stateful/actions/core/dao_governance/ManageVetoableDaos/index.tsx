import { useCallback } from 'react'

import { daoVetoableDaosSelector } from '@dao-dao/state/recoil'
import { ThumbDownEmoji, useCachedLoadingWithError } from '@dao-dao/stateless'
import { Feature } from '@dao-dao/types'
import {
  ActionComponent,
  ActionContextType,
  ActionKey,
  ActionMaker,
  UseDecodedCosmosMsg,
  UseDefaults,
  UseTransformToCosmos,
} from '@dao-dao/types/actions'
import {
  VETOABLE_DAOS_ITEM_KEY_PREFIX,
  makeWasmMessage,
  objectMatchesStructure,
} from '@dao-dao/utils'

import { AddressInput, EntityDisplay } from '../../../../components'
import { useActionOptions } from '../../../react'
import {
  ManageVetoableDaosData,
  ManageVetoableDaosComponent as StatelessManageVetoableDaosComponent,
} from './Component'

const Component: ActionComponent = (props) => {
  const {
    address,
    chain: { chain_id: chainId },
  } = useActionOptions()

  const currentlyEnabledLoading = useCachedLoadingWithError(
    daoVetoableDaosSelector({
      chainId,
      coreAddress: address,
    })
  )

  return (
    <StatelessManageVetoableDaosComponent
      {...props}
      options={{
        currentlyEnabled:
          currentlyEnabledLoading.loading || currentlyEnabledLoading.errored
            ? []
            : currentlyEnabledLoading.data,
        AddressInput,
        EntityDisplay,
      }}
    />
  )
}

export const makeManageVetoableDaosAction: ActionMaker<
  ManageVetoableDaosData
> = ({ t, address, context, chain: { chain_id: chainId } }) => {
  // Only DAOs.
  if (context.type !== ActionContextType.Dao) {
    return null
  }

  const storageItemValueKey = context.dao.info.supportedFeatures[
    Feature.StorageItemValueKey
  ]
    ? 'value'
    : 'addr'

  const useDefaults: UseDefaults<ManageVetoableDaosData> = () => ({
    chainId,
    address: '',
    enable: true,
  })

  const useTransformToCosmos: UseTransformToCosmos<
    ManageVetoableDaosData
  > = () =>
    useCallback(
      (data: ManageVetoableDaosData) =>
        makeWasmMessage({
          wasm: {
            execute: {
              contract_addr: address,
              funds: [],
              msg: data.enable
                ? {
                    set_item: {
                      key:
                        VETOABLE_DAOS_ITEM_KEY_PREFIX +
                        data.chainId +
                        ':' +
                        data.address,
                      [storageItemValueKey]: '1',
                    },
                  }
                : {
                    remove_item: {
                      key:
                        VETOABLE_DAOS_ITEM_KEY_PREFIX +
                        data.chainId +
                        ':' +
                        data.address,
                    },
                  },
            },
          },
        }),
      []
    )

  const useDecodedCosmosMsg: UseDecodedCosmosMsg<ManageVetoableDaosData> = (
    msg: Record<string, any>
  ) => {
    if (
      objectMatchesStructure(msg, {
        wasm: {
          execute: {
            contract_addr: {},
            funds: {},
            msg: {},
          },
        },
      }) &&
      msg.wasm.execute.contract_addr === address &&
      ('set_item' in msg.wasm.execute.msg ||
        'remove_item' in msg.wasm.execute.msg)
    ) {
      const enable = 'set_item' in msg.wasm.execute.msg
      const key =
        (enable
          ? msg.wasm.execute.msg.set_item.key
          : msg.wasm.execute.msg.remove_item.key) ?? ''

      const [chainId, address] = key
        .replace(VETOABLE_DAOS_ITEM_KEY_PREFIX, '')
        .split(':')

      return key.startsWith(VETOABLE_DAOS_ITEM_KEY_PREFIX)
        ? {
            match: true,
            data: {
              chainId,
              address,
              enable,
            },
          }
        : {
            match: false,
          }
    }

    return { match: false }
  }

  return {
    key: ActionKey.ManageVetoableDaos,
    Icon: ThumbDownEmoji,
    label: t('title.manageVetoableDaos'),
    description: t('info.manageVetoableDaosDescription'),
    Component,
    useDefaults,
    useTransformToCosmos,
    useDecodedCosmosMsg,
  }
}
