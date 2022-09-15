import { ComponentPropsWithoutRef, forwardRef } from 'react'

import {
  ButtonifiedChildren,
  ButtonifierProps,
  getButtonifiedClassNames,
  getNonButtonifierProps,
} from './Buttonifier'

export type ButtonProps = ComponentPropsWithoutRef<'button'> & ButtonifierProps

// Forward ref so we can use Tooltip with this element.
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ children, type = 'button', ...props }, ref) {
    return (
      <button
        {...getNonButtonifierProps(props)}
        className={getButtonifiedClassNames(props)}
        ref={ref}
        type={type}
      >
        <ButtonifiedChildren {...props}>{children}</ButtonifiedChildren>
      </button>
    )
  }
)
