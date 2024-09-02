import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useRecoilCallback } from 'recoil'

import { CommonNftSelectors, DaoDaoCoreSelectors } from '@dao-dao/state/recoil'
import { useCachedLoadable } from '@dao-dao/stateless'
import { ActionComponent, ActionContextType } from '@dao-dao/types'
import { objectMatchesStructure, processError } from '@dao-dao/utils'

import { useActionOptions } from '../../../react'
import { ChooseExistingNftCollection as StatelessChooseExistingNftCollection } from './stateless/ChooseExistingNftCollection'
import { MintNftData } from './types'

export const ChooseExistingNftCollection: ActionComponent = (props) => {
  const { t } = useTranslation()
  const {
    context,
    address,
    chain: { chain_id: currentChainId },
  } = useActionOptions()

  const { watch, setValue, setError, clearErrors, trigger } =
    useFormContext<MintNftData>()

  const chainId = watch((props.fieldNamePrefix + 'chainId') as 'chainId')
  const collectionAddress: string | undefined = watch(
    (props.fieldNamePrefix + 'collectionAddress') as 'collectionAddress'
  )

  // If in DAO context, get cw721 collections for which the DAO is the minter.
  // If in wallet context, can't check so return undefined to trigger infinite
  // loading state and load nothing.
  const existingCollectionsLoadable = useCachedLoadable(
    context.type === ActionContextType.Dao
      ? DaoDaoCoreSelectors.allCw721CollectionsWithDaoAsMinterSelector({
          contractAddress: address,
          chainId: currentChainId,
        })
      : undefined
  )

  const [chooseLoading, setChooseLoading] = useState(false)
  const onChooseExistingContract = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        setChooseLoading(true)
        try {
          clearErrors(
            (props.fieldNamePrefix + 'collectionAddress') as 'collectionAddress'
          )

          // Manually validate the contract address.
          const valid = await trigger(
            (props.fieldNamePrefix + 'collectionAddress') as 'collectionAddress'
          )
          if (!valid) {
            // Error will be set by trigger.
            return
          }

          // Should never happen due to validation above; just typecheck.
          if (!collectionAddress) {
            throw new Error(t('error.loadingData'))
          }

          // Verify contract exists and looks like a cw721 contract.
          let info
          try {
            info = await snapshot.getPromise(
              CommonNftSelectors.contractInfoSelector({
                contractAddress: collectionAddress,
                chainId,
                params: [],
              })
            )
          } catch (err) {
            console.error(err)

            // If query failed, different contract.
            if (
              err instanceof Error &&
              err.message.includes('Query failed') &&
              err.message.includes('unknown variant')
            ) {
              throw new Error(t('error.notAnNftCollectionAddress'))
            }

            // If unrecognized error, rethrow.
            throw err
          }

          // Verify info response looks correct.
          if (
            !objectMatchesStructure(info, {
              name: {},
              symbol: {},
            })
          ) {
            throw new Error(t('error.notAnNftCollectionAddress'))
          }

          // Indicate contract is ready and store name/symbol for display.
          setValue(
            (props.fieldNamePrefix + 'instantiateData') as 'instantiateData',
            {
              chainId,
              name: info.name,
              symbol: info.symbol,
            }
          )
          setValue(
            (props.fieldNamePrefix + 'contractChosen') as 'contractChosen',
            true,
            {
              shouldValidate: true,
            }
          )
        } catch (err) {
          console.error(err)
          setError(
            (props.fieldNamePrefix +
              'collectionAddress') as 'collectionAddress',
            {
              type: 'custom',
              message:
                err instanceof Error ? err.message : `${processError(err)}`,
            }
          )
          return
        } finally {
          setChooseLoading(false)
        }
      },
    [
      trigger,
      props.fieldNamePrefix,
      setValue,
      collectionAddress,
      setError,
      clearErrors,
      setChooseLoading,
    ]
  )

  return (
    <StatelessChooseExistingNftCollection
      {...props}
      options={{
        chooseLoading,
        onChooseExistingContract,
        existingCollections:
          existingCollectionsLoadable.state === 'hasValue'
            ? existingCollectionsLoadable.contents.filter(
                (collection) => collection.chainId === chainId
              )
            : [],
      }}
    />
  )
}
