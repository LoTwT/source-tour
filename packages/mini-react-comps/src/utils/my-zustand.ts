// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { useEffect, useState, useSyncExternalStore } from "react"

export function createStore(createState) {
  let state
  const listeners = new Set()

  const setState = (partial, replace) => {
    const nextState = typeof partial === "function" ? partial(state) : partial

    if (!Object.is(nextState, state)) {
      const previousState = state

      if (!replace) {
        state =
          typeof nextState !== "object" || nextState === null
            ? nextState
            : Object.assign({}, state, nextState)
      } else {
        state = nextState
      }

      listeners.forEach((listener) => listener(state, previousState))
    }
  }

  const getState = () => state

  const subscribe = (listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  const destroy = () => listeners.clear()

  const api = { setState, getState, subscribe, destroy }

  state = createState(setState, getState, api)

  return api
}

export function useStore(api, selector) {
  function getState() {
    return selector(api.getState())
  }

  return useSyncExternalStore(api.subscribe, getState)
}

export function useStore1(api, selector) {
  const [, forceRender] = useState(0)

  useEffect(() => {
    api.subscribe((state, prevState) => {
      const newObj = selector(state)
      const oldObj = selector(prevState)

      if (newObj !== oldObj) {
        forceRender(Math.random())
      }
    })
  }, [])

  return selector(api.getState())
}

export function create(createState) {
  const api = createStore(createState)

  const useBoundStore = (selector) => useStore(api, selector)

  Object.assign(useBoundStore, api)

  return useBoundStore
}
