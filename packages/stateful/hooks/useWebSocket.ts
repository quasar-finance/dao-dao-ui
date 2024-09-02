import { Channel } from 'pusher-js'
import { useCallback, useEffect, useState } from 'react'
import { constSelector, useRecoilValue, useSetRecoilState } from 'recoil'
import { useDeepCompareMemoize } from 'use-deep-compare-effect'

import {
  indexerUpStatusSelector,
  indexerWebSocketChannelSubscriptionsAtom,
  indexerWebSocketSelector,
  mountedInBrowserAtom,
} from '@dao-dao/state/recoil'
import {
  useCachedLoadingWithError,
  useDaoInfoContext,
  useUpdatingRef,
} from '@dao-dao/stateless'
import { ParametersExceptFirst } from '@dao-dao/types'
import {
  objectMatchesStructure,
  webSocketChannelNameForDao,
} from '@dao-dao/utils'

export const useWebSocket = () => {
  // Get pusher client once mounted in browser.
  const mountedInBrowser = useRecoilValue(mountedInBrowserAtom)
  const pusher = useRecoilValue(
    mountedInBrowser ? indexerWebSocketSelector : constSelector(undefined)
  )

  const [connected, setConnected] = useState(
    pusher?.connection.state === 'connected'
  )
  // Add connection event handler.
  useEffect(() => {
    if (!pusher) {
      return
    }

    pusher.connection.bind('state_change', (states: any) => {
      // Update connected state so listeners know if they are active or not.
      setConnected(states.current === 'connected')
    })
  }, [pusher])

  return {
    pusher,
    connected,
  }
}

export const useWebSocketChannels = (channelNames: string[]) => {
  const { pusher, connected } = useWebSocket()

  const [channels, setChannels] = useState<Channel[]>([])
  const setSubscriptions = useSetRecoilState(
    indexerWebSocketChannelSubscriptionsAtom
  )
  const memoizedChannelNames = useDeepCompareMemoize(channelNames)
  useEffect(() => {
    if (!pusher || !connected || memoizedChannelNames.length === 0) {
      return
    }

    // Connect to the channels.
    setChannels(
      memoizedChannelNames.map((channelName) => pusher.subscribe(channelName))
    )

    // Increment subscription count.
    setSubscriptions((subscriptions) =>
      memoizedChannelNames.reduce(
        (acc, channelName) => ({
          ...acc,
          // In case the counter becomes negative for some reason, make sure it
          // is set back to 1 so the subscription stays live. This should never
          // happen since the counter is decremented on unmount.
          [channelName]: Math.max((acc[channelName] || 0) + 1, 1),
        }),
        subscriptions
      )
    )

    return () => {
      // Remove channels.
      setChannels([])

      // Decrement subscription count. When this reaches 0, the
      // AppContextProvider will unsubscribe from the channel.
      setSubscriptions((subscriptions) =>
        memoizedChannelNames.reduce(
          (acc, channelName) => ({
            ...acc,
            // Prevent counter from becoming negative.
            [channelName]: Math.max((acc[channelName] || 0) - 1, 0),
          }),
          subscriptions
        )
      )
    }
  }, [pusher, connected, setSubscriptions, memoizedChannelNames])

  return channels
}

export const useWebSocketChannel = (channelName: string) =>
  useWebSocketChannels([channelName])

type OnMessageCallback = (
  data: Record<string, any>,
  // Whether or not the callback was called manually via the fallback.
  fallback: boolean
) => any
// If data not passed, will use the default data passed to the hook.
type OnMessageFallbackOptions = {
  // If true, will not wait for the next block before calling the callback.
  // Defaults to false.
  skipWait?: boolean
  // If true, will only call the callback if the listener is not listening.
  // Defaults to true.
  onlyIfNotListening?: boolean
}
type OnMessageFallback = (
  data?: Record<string, any>,
  options?: OnMessageFallbackOptions
) => void

// Listens for messages from the WebSocket on all channels provided and calls
// the callback if a received message type matches the expected type(s). Returns
// whether or not the listener is currently active and a fallback function. By
// default, the fallback function will call the callback function if the
// listener is not listening, and after waiting for the next block. Its behavior
// can be customized with its options arguments.
export const useOnWebSocketMessage = (
  channelNames: string[],
  expectedTypeOrTypes: string | string[],
  onMessage: OnMessageCallback,
  // If passed, will be used as the default data for the fallback function
  // returned. The returned fallback function optionally allows passing data
  // which will override this default.
  defaultFallbackData?: Parameters<OnMessageFallback>[0]
): {
  listening: boolean
  fallback: OnMessageFallback
} => {
  const channels = useWebSocketChannels(channelNames)

  // Store callback in ref so it can be used in the effect without having to
  // reapply the handler on every re-render. This avoids having to pass in a
  // memoized `useCallback` function to prevent additional re-renders.
  const callbackRef = useUpdatingRef<OnMessageCallback>(onMessage)

  const [listening, setListening] = useState(false)

  const memoizedExpectedTypeOrTypes = useDeepCompareMemoize(expectedTypeOrTypes)
  useEffect(() => {
    if (channels.length === 0) {
      setListening(false)
      return
    }

    // Listen for messages and call callback if the message matches the type.
    const handler = (data: any) => {
      if (
        objectMatchesStructure(data, {
          type: {},
          data: {},
        }) &&
        ((typeof memoizedExpectedTypeOrTypes === 'string' &&
          data.type === memoizedExpectedTypeOrTypes) ||
          (Array.isArray(memoizedExpectedTypeOrTypes) &&
            memoizedExpectedTypeOrTypes.includes(data.type)))
      ) {
        callbackRef.current(data.data, false)
      }
    }

    channels.forEach((channel) => channel.bind('broadcast', handler))
    setListening(true)

    // Remove listener on unmount.
    return () => {
      channels.forEach((channel) => channel.unbind('broadcast', handler))
      setListening(false)
    }
  }, [callbackRef, channels, memoizedExpectedTypeOrTypes])

  // Store listening in ref so the fallback function can access it within the
  // same instance of the function without re-rendering.
  const listeningRef = useUpdatingRef(listening)

  // Create a memoized fallback function that calls the callback with the
  // fallback data after waiting a block. This is useful for ensuring the
  // callback gets executed when the WebSocket is misbehaving.
  const defaultFallbackDataRef = useUpdatingRef(defaultFallbackData)
  const fallback: OnMessageFallback = useCallback(
    async (data, { skipWait = false, onlyIfNotListening = true } = {}) => {
      // Do nothing if we are already listening.
      if (onlyIfNotListening && listeningRef.current) {
        return
      }

      if (!skipWait) {
        // Wait a litle before executing the callback, to give time for the
        // block to finalize and the indexer to update.
        await new Promise((resolve) => setTimeout(resolve, 7000))
      }

      callbackRef.current(data ?? defaultFallbackDataRef.current ?? {}, true)
    },
    [callbackRef, defaultFallbackDataRef, listeningRef]
  )

  return {
    listening,
    fallback,
  }
}

export const useOnDaoWebSocketMessage = (
  chainId: string,
  coreAddress: string,
  ...args: ParametersExceptFirst<typeof useOnWebSocketMessage>
) => {
  const indexerUp = useCachedLoadingWithError(
    indexerUpStatusSelector({
      chainId,
    })
  )
  const response = useOnWebSocketMessage(
    [webSocketChannelNameForDao({ chainId, coreAddress })],
    ...args
  )
  return {
    ...response,
    listening:
      // Unless indexer is caught up, mark as not listening.
      indexerUp.loading || indexerUp.errored || !indexerUp.data.caughtUp
        ? false
        : response.listening,
  }
}

export const useOnCurrentDaoWebSocketMessage = (
  ...args: ParametersExceptFirst<typeof useOnWebSocketMessage>
) => {
  const { chainId, coreAddress } = useDaoInfoContext()
  return useOnDaoWebSocketMessage(chainId, coreAddress, ...args)
}
