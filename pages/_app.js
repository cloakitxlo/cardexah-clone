import '../styles/globals.css'
import React from 'react'
import { WagmiConfig, createClient, configureChains } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { chain } from 'wagmi'

const { chains, provider } = configureChains(
  [chain.mainnet, chain.polygon, chain.goerli],
  [publicProvider()]
)

const { connectors } = getDefaultWallets({ appName: 'Cardexah Clone', chains })

const wagmiClient = createClient({ autoConnect: true, connectors, provider })

export default function MyApp({ Component, pageProps }) {
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <Component {...pageProps} />
      </RainbowKitProvider>
    </WagmiConfig>
  )
}
