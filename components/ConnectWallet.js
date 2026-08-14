import React from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'

export default function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { connectAsync } = useConnect()
  const { disconnect } = useDisconnect()

  async function connectInjected() {
    try {
      await connectAsync({ connector: new InjectedConnector() })
    } catch (e) {
      console.error('Injected connect failed', e)
      alert('Failed to connect injected wallet: ' + (e?.message || e))
    }
  }

  async function connectWalletConnect() {
    try {
      await connectAsync({ connector: new WalletConnectConnector({ options: { projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '' } }) })
    } catch (e) {
      console.error('WalletConnect connect failed', e)
      alert('Failed to connect WalletConnect: ' + (e?.message || e))
    }
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm text-white">{address}</span>
        <button onClick={() => disconnect()} className="px-3 py-1 rounded bg-white/10">Disconnect</button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={connectInjected} className="px-3 py-1 rounded bg-white/10">Connect MetaMask</button>
      <button onClick={connectWalletConnect} className="px-3 py-1 rounded bg-white/10">WalletConnect</button>
    </div>
  )
}
