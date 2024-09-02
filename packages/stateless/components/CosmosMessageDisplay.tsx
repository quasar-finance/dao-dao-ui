import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/material-ocean.css'
import 'codemirror/theme/material.css'

import clsx from 'clsx'
import dynamic from 'next/dynamic'

import { Theme, useThemeContext } from '../theme'

const CodeMirror = dynamic(
  () => import('react-codemirror2').then((module) => module.UnControlled),
  {
    ssr: false,
  }
)

// This check is to prevent this import to be server side rendered.
if (typeof window !== 'undefined' && typeof window.navigator !== 'undefined') {
  require('codemirror/mode/javascript/javascript.js')
}

export interface CosmosMessageDisplayProps {
  value: string
  className?: string
}

export const CosmosMessageDisplay = ({
  value,
  className,
}: CosmosMessageDisplayProps) => {
  const themeCtx = useThemeContext()
  const editorTheme =
    themeCtx.theme !== Theme.Dark ? 'default' : 'material-ocean'
  return (
    <div className={clsx('flex flex-col', className)}>
      <CodeMirror
        className="text-sm"
        options={{
          theme: editorTheme,
          mode: {
            name: 'javascript',
            json: true,
          },
          readOnly: true,
          lineWrapping: true,
          tabSize: 2,
        }}
        value={value}
      />
    </div>
  )
}
