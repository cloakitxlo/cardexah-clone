import Head from 'next/head'
import ConnectWallet from '../components/ConnectWallet'
import { useState, useEffect } from 'react'
import { useAccount, useSigner, useEnsName } from 'wagmi'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function Home() {
  const { address, isConnected } = useAccount()
  const { data: signer } = useSigner()
  const { data: ensName } = useEnsName({ address })

  const [authToken, setAuthToken] = useState(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const t = localStorage.getItem('authToken')
    if (t) setAuthToken(t)
  }, [])

  async function handleSignIn() {
    if (!isConnected || !address) {
      alert('Please connect your wallet first (Connect button on the top right).')
      return
    }
    if (!signer) {
      alert('No signer available. Make sure your wallet is connected.')
      return
    }

    try {
      setStatus('Requesting nonce...')
      const r1 = await fetch(`${API_URL}/nonce?address=${address}`)
      const j1 = await r1.json()
      if (!r1.ok) throw new Error(j1.error || 'Failed to get nonce')
      const nonce = j1.nonce

      setStatus('Signing nonce...')
      const signature = await signer.signMessage(nonce)

      setStatus('Verifying signature...')
      const r2 = await fetch(`${API_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature })
      })
      const j2 = await r2.json()
      if (!r2.ok) throw new Error(j2.error || 'Failed to verify')

      // Save token
      localStorage.setItem('authToken', j2.token)
      setAuthToken(j2.token)
      setStatus('Signed in')
    } catch (e) {
      console.error(e)
      setStatus('Error: ' + (e.message || e))
    }
  }

  async function handleSignOut() {
    try {
      setStatus('Signing out...')
      await fetch(`${API_URL}/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address }) })
    } catch (e) { console.error(e) }
    localStorage.removeItem('authToken')
    setAuthToken(null)
    setStatus('Signed out')
  }

  return (
    <>
      <Head>
        <title>Cardexah Clone — Demo</title>
        <meta name="description" content="Landing page + wallet connect demo with signature-login" />
      </Head>

    }],