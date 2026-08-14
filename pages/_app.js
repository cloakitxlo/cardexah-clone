import '../styles/globals.css'
import React from 'react'
import { WagmiConfig, createClient, configureChains } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { chain } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'

const { chains, provider } = configureChains(
  [chain.mainnet, chain.polygon, chain.goerli],
  [publicProvider()]
)

function getConnectors() {
  const injected = new InjectedConnector({ chains })
  const walletConnect = new WalletConnectConnector({
    chains,
    options: {
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''
    }
  })
  return [injected, walletConnect]
}

const wagmiClient = createClient({ autoConnect: true, connectors: getConnectors(), provider })

export default function MyApp({ Component, pageProps }) {
  return (
    <WagmiConfig client={wagmiClient}>
      <Component {...pageProps} />
    </WagmiConfig>
  )
}
