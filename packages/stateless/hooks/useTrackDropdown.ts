import { useCallback, useEffect, useRef, useState } from 'react'

import { useUpdatingRef } from './useUpdatingRef'

// Pass `null` to left, right, or width to skip setting that property.
export type UseTrackDropdownOptions = {
  // Default: rect.bottom
  top?: (rect: DOMRect) => number
  // Default: rect.left
  left?: null | ((rect: DOMRect) => number)
  // Default: null
  right?: null | ((rect: DOMRect) => number)
  // Default: rect.width
  width?: null | ((rect: DOMRect) => number)
  /**
   * Padding pixels between the edge of the popup and the window. Default: 32.
   */
  padding?: number
}

// This hook tracks the rect of an element on the page and positions a dropdown
// relative to it. Pass the dropdown ref to the hook, and get a ref returned
// that should be set on the element you want to track. The hook will update the
// dropdown when things resize and scroll. The dropdown will be positioned below
// the tracked element by default, but the options let you customize the final
// position.
export const useTrackDropdown = ({
  top,
  left,
  right = null,
  width,
  padding = 32,
}: UseTrackDropdownOptions = {}) => {
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)

  const updateRect = () => {
    if (!trackRef.current || !dropdownRef.current) {
      return
    }

    // On iOS Safari, when the keyboard is open, the entire body is offset,
    // which makes the dropdown positioned incorrectly since it is fixed above
    // everything. The body is offset by the height of the keyboard, so we can
    // use it to fix the position. On desktop browsers, this should be 0.
    const topOffset = document.body.getBoundingClientRect().top ?? 0

    const rect = trackRef.current.getBoundingClientRect()

    const dropdownTop = (top?.(rect) ?? rect.bottom) - topOffset
    dropdownRef.current.style.top = `${dropdownTop}px`

    // Unset since this may have been set by a previous constraint (below),
    // and we want to make sure to re-run the contraints fresh.
    dropdownRef.current.style.left = ''
    dropdownRef.current.style.right = ''
    dropdownRef.current.style.bottom = ''

    let dropdownLeft: number | undefined
    if (left !== null) {
      dropdownLeft = Math.max(padding, left?.(rect) ?? rect.left)
      dropdownRef.current.style.left = `${dropdownLeft}px`
    }

    let dropdownRight: number | undefined
    if (right !== null) {
      dropdownRight = Math.max(padding, right?.(rect) ?? rect.width)
      dropdownRef.current.style.right = `${dropdownRight}px`
    }

    if (width !== null) {
      dropdownRef.current.style.width = `${width?.(rect) ?? rect.width}px`
    }

    // Apply edge constraints. Since we cap the left and right values at the
    // minimum padding, we only need to check if the opposite side plus the
    // width will cause an overflow.
    const dropdownRect = dropdownRef.current.getBoundingClientRect()
    const paddingPixels = `${padding}px`

    // If dropdown is past the left edge of the screen, set the left.
    if (
      dropdownRight &&
      window.innerWidth - dropdownRight - dropdownRect.width < padding
    ) {
      dropdownRef.current.style.left = paddingPixels
    }

    // If dropdown is past the right edge of the screen, set the right.
    if (
      dropdownLeft &&
      dropdownLeft + dropdownRect.width > window.innerWidth - padding
    ) {
      dropdownRef.current.style.right = paddingPixels
    }

    // If dropdown is past the bottom of the screen, set the bottom.
    if (dropdownTop + dropdownRect.height > window.innerHeight - padding) {
      dropdownRef.current.style.bottom = paddingPixels
    }
  }

  // Memoize ref to prevent listener from resetting on every render.
  const updateRectRef = useUpdatingRef(updateRect)

  // Update the rect of the element on window scroll and resize.
  useEffect(() => {
    const updateRect = updateRectRef.current

    // The third argument set to `true` makes the event fire when any scroll
    // event happens, not just when the window is scrolled. The actual
    // scrollable container is some parent element.
    window.addEventListener('scroll', updateRect, true)
    // window.addEventListener('resize', updateRect, true)

    return () => {
      window.removeEventListener('scroll', updateRect)
      // window.removeEventListener('resize', updateRect)
    }
  }, [updateRectRef])

  // Trigger state change when elements are set so the effects run.
  const [dropdownReady, setDropdownReady] = useState(false)
  const [trackReady, setTrackReady] = useState(false)

  // Update the rect when both elements are ready.
  useEffect(() => {
    if (dropdownReady && trackReady) {
      updateRectRef.current()
    }
  }, [dropdownReady, trackReady, updateRectRef])

  // Use a ResizeObserver to update the rect when the element changes size.
  useEffect(() => {
    if (!trackRef.current) {
      return
    }

    const observer = new ResizeObserver(updateRectRef.current)
    observer.observe(trackRef.current)

    // Update on a timer to catch other changes.
    const timer = setInterval(updateRectRef.current, 1000)

    return () => {
      observer.disconnect()
      clearInterval(timer)
    }
  }, [trackReady, updateRectRef])

  // Use a callback ref so we can trigger a state change to update.
  const onDropdownRef = useCallback((element: HTMLDivElement | null) => {
    dropdownRef.current = element
    setDropdownReady(!!element)
  }, [])

  // Use a callback ref so we can trigger a state change to activate the
  // ResizeObserver when the ref is ready.
  const onTrackRef = useCallback((element: HTMLDivElement | null) => {
    trackRef.current = element
    setTrackReady(!!element)
  }, [])

  return {
    onDropdownRef,
    onTrackRef,
  }
}
