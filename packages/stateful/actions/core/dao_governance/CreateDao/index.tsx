import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { DaoEmoji, useChain } from '@dao-dao/stateless'
import {
  ActionComponent,
  ActionKey,
  ActionMaker,
  UseDecodedCosmosMsg,
  UseDefaults,
  UseTransformToCosmos,
} from '@dao-dao/types'
import { decodeJsonFromBase64, objectMatchesStructure } from '@dao-dao/utils'

import { LinkWrapper } from '../../../../components'
import { useQueryLoadingDataWithError } from '../../../../hooks'
import { daoQueries } from '../../../../queries'
import { CreateDaoComponent, CreateDaoData } from './Component'

const Component: ActionComponent<undefined, CreateDaoData> = (props) => {
  const { chain_id: chainId } = useChain()

  // If admin is set, attempt to load parent DAO info.
  const parentDao = useQueryLoadingDataWithError(
    daoQueries.parentInfo(
      useQueryClient(),
      props.data.admin
        ? {
            chainId,
            parentAddress: props.data.admin,
          }
        : undefined
    )
  )

  return (
    <CreateDaoComponent
      {...props}
      options={{
        parentDao:
          parentDao.loading || parentDao.errored ? undefined : parentDao.data,
        LinkWrapper,
      }}
    />
  )
}

const useDefaults: UseDefaults<CreateDaoData> = () => ({
  name: '',
  description: '',
  imageUrl: '',
})

const useTransformToCosmos: UseTransformToCosmos<CreateDaoData> = () =>
  useCallback(() => undefined, [])

const useDecodedCosmosMsg: UseDecodedCosmosMsg<CreateDaoData> = (msg) => {
  // Normal DAO creation via self-admin factory.
  if (
    objectMatchesStructure(msg, {
      wasm: {
        execute: {
          contract_addr: {},
          funds: {},
          msg: {
            instantiate_contract_with_self_admin: {
              code_id: {},
              instantiate_msg: {},
              label: {},
            },
          },
        },
      },
    })
  ) {
    try {
      const decoded = decodeJsonFromBase64(
        msg.wasm.execute.msg.instantiate_contract_with_self_admin
          .instantiate_msg
      )
      if (
        !objectMatchesStructure(decoded, {
          admin: {},
          automatically_add_cw20s: {},
          automatically_add_cw721s: {},
          name: {},
          description: {},
          image_url: {},
          proposal_modules_instantiate_info: {},
          voting_module_instantiate_info: {},
        })
      ) {
        return {
          match: false,
        }
      }

      return {
        match: true,
        data: {
          admin: decoded.admin,
          name: decoded.name,
          description: decoded.description,
          imageUrl: decoded.image_url,
        },
      }
    } catch {}
  }

  // SubDAO creation with parent DAO as admin.
  if (
    objectMatchesStructure(msg, {
      wasm: {
        instantiate: {
          code_id: {},
          funds: {},
          label: {},
          msg: {
            admin: {},
            automatically_add_cw20s: {},
            automatically_add_cw721s: {},
            name: {},
            description: {},
            image_url: {},
            proposal_modules_instantiate_info: {},
            voting_module_instantiate_info: {},
          },
        },
      },
    })
  ) {
    return {
      match: true,
      data: {
        admin: msg.wasm.instantiate.msg.admin,
        name: msg.wasm.instantiate.msg.name,
        description: msg.wasm.instantiate.msg.description,
        imageUrl: msg.wasm.instantiate.msg.image_url,
      },
    }
  }

  return {
    match: false,
  }
}

export const makeCreateDaoAction: ActionMaker<CreateDaoData> = ({ t }) => ({
  key: ActionKey.CreateDao,
  label: t('title.createDao'),
  description: t('info.createDaoActionDescription'),
  Icon: DaoEmoji,
  Component,
  useDefaults,
  useTransformToCosmos,
  useDecodedCosmosMsg,
  // Only use for rendering.
  hideFromPicker: true,
})
