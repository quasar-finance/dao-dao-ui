import { useCallback } from 'react'

import { BeeEmoji } from '@dao-dao/stateless'
import {
  ActionContextType,
  ActionKey,
  ActionMaker,
  UseDecodedCosmosMsg,
  UseDefaults,
  UseTransformToCosmos,
} from '@dao-dao/types/actions'
import { getWidgetStorageItemKey } from '@dao-dao/utils'

import { RetroactiveCompensationWidget } from '../../../../widgets/widgets/RetroactiveCompensation'
import { makeManageWidgetsAction } from '../../dao_appearance/ManageWidgets'
import { EnableRetroactiveCompensationComponent as Component } from './Component'

const useDefaults: UseDefaults = () => ({})

export const makeEnableRetroactiveCompensationAction: ActionMaker = (
  options
) => {
  const { t, context } = options

  const manageWidgetsAction = makeManageWidgetsAction(options)
  if (context.type !== ActionContextType.Dao || !manageWidgetsAction) {
    return null
  }

  const useDecodedCosmosMsg: UseDecodedCosmosMsg = (
    msg: Record<string, any>
  ) => {
    const decoded = manageWidgetsAction.useDecodedCosmosMsg(msg)

    return decoded.match &&
      decoded.data.mode === 'set' &&
      decoded.data.id === RetroactiveCompensationWidget.id
      ? {
          match: true,
          data: {},
        }
      : {
          match: false,
        }
  }

  const useTransformToCosmos: UseTransformToCosmos = () => {
    const transform = manageWidgetsAction.useTransformToCosmos()

    return useCallback(
      () =>
        transform({
          mode: 'set',
          id: RetroactiveCompensationWidget.id,
          values: {},
        }),
      [transform]
    )
  }

  return {
    key: ActionKey.EnableRetroactiveCompensation,
    Icon: BeeEmoji,
    label: t('title.enableRetroactiveCompensation'),
    description: t('widgetDescription.retroactive'),
    keywords: ['payroll'],
    notReusable: true,
    Component,
    useDefaults,
    useTransformToCosmos,
    useDecodedCosmosMsg,
    // Do not allow using this action if the DAO already has retroactive
    // compensation enabled.
    hideFromPicker:
      !!context.dao.info.items[
        getWidgetStorageItemKey(RetroactiveCompensationWidget.id)
      ],
  }
}
