import { forwardRef } from 'react'

import { ButtonLink as StatelessButtonLink } from '@dao-dao/stateless'
import { ButtonLinkProps } from '@dao-dao/types'

import { useUpdateNavigatingHref } from '../hooks/useUpdateNavigatingHref'

export const ButtonLink = forwardRef<HTMLDivElement, ButtonLinkProps>(
  function ButtonLink({ children, loading, onClick, href, ...props }, ref) {
    const { navigatingToHref, updateNavigatingHref } = useUpdateNavigatingHref()

    const navigating = !!href && navigatingToHref === href

    return (
      <StatelessButtonLink
        {...props}
        href={href}
        loading={loading || navigating}
        onClick={(event) => {
          onClick?.(event)

          // Update global loading state.
          if (href && !props.openInNewTab && !href.startsWith('http')) {
            updateNavigatingHref(href)
          }
        }}
        ref={ref}
      >
        {children}
      </StatelessButtonLink>
    )
  }
)
