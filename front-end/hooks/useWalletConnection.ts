"use client"

import { useCurrentAccount, useConnectWallet, useDisconnectWallet } from '@mysten/dapp-kit'

/**
 * Wallet connection state interface
 * @interface WalletConnectionState
 */
export interface WalletConnectionState {
  /** Current wallet account object from dApp kit */
  account: ReturnType<typeof useCurrentAccount>
  /** Wallet address string (if connected) */
  address?: string
  /** Boolean indicating if wallet is connected */
  isConnected: boolean

  /** Function to connect wallet */
  connect: ReturnType<typeof useConnectWallet>['mutate']
  /** Function to disconnect wallet */
  disconnect: ReturnType<typeof useDisconnectWallet>['mutate']

  /** Loading state for wallet connection */
  isConnecting: boolean
  /** Loading state for wallet disconnection */
  isDisconnecting: boolean
}

/**
 * Wallet connection hook that provides unified access to wallet state
 *
 * This hook provides wallet connection management for the storage marketplace.
 *
 * @returns {WalletConnectionState} Complete wallet connection state and actions
 *
 * @example
 * ```tsx
 * const { isConnected, address, connect, disconnect } = useWalletConnection();
 *
 * if (!isConnected) {
 *   return <button onClick={() => connect()}>Connect Wallet</button>;
 * }
 *
 * return (
 *   <div>
 *     <p>Connected: {address}</p>
 *     <button onClick={() => disconnect()}>Disconnect</button>
 *   </div>
 * );
 * ```
 */
export const useWalletConnection = (): WalletConnectionState => {
  const account = useCurrentAccount()
  const { mutate: connect, isPending: isConnecting } = useConnectWallet()
  const { mutate: disconnect, isPending: isDisconnecting } = useDisconnectWallet()

  const address = account?.address
  const isConnected = !!account

  return {
    // Account info
    account,
    address,
    isConnected,

    // Connection actions
    connect,
    disconnect,

    // Connection state
    isConnecting,
    isDisconnecting,
  }
}
