import { useTranslation } from 'react-i18next'

import {
  InputLabel,
  NestedActionsEditor,
  NestedActionsEditorOptions,
  NestedActionsRenderer,
  NestedActionsRendererProps,
} from '@dao-dao/stateless'
import { NestedActionsEditorFormData } from '@dao-dao/types'
import { ActionComponent } from '@dao-dao/types/actions'

export type CrossChainExecuteData = {
  chainId: string
} & NestedActionsEditorFormData

export type CrossChainExecuteOptions = NestedActionsEditorOptions &
  Omit<NestedActionsRendererProps, 'msgsFieldName'>

export const CrossChainExecuteComponent: ActionComponent<
  CrossChainExecuteOptions
> = (props) => {
  const { t } = useTranslation()
  const { fieldNamePrefix, isCreating, options } = props

  return (
    <>
      <InputLabel className="-mb-2" name={t('title.actions')} />

      {isCreating ? (
        <NestedActionsEditor {...props} />
      ) : (
        <div className="flex flex-col gap-2">
          <NestedActionsRenderer
            {...options}
            msgsFieldName={fieldNamePrefix + 'msgs'}
          />
        </div>
      )}
    </>
  )
}
