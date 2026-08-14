require('dotenv').config()
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const { ethers } = require('ethers')
const cookieParser = require('cookie-parser')

const PORT = process.env.PORT || 4000
const DB_FILE = process.env.DATABASE_FILE || path.join(__dirname, 'data.sqlite')
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_to_a_strong_secret'

const app = express()
app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(cookieParser())

// Initialize DB
const db = new sqlite3.Database(DB_FILE)

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    address TEXT PRIMARY KEY,
    nonce TEXT,
    jwt TEXT,
    created_at INTEGER
  )`)
  db.run(`CREATE TABLE IF NOT EXISTS wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT,
    created_at INTEGER
  )`)
})

function generateNonce() {
  // Simple nonce — production: use UUID or stronger randomness
  return Math.floor(Math.random() * 1000000000).toString()
}

app.get('/nonce', (req, res) => {
  const address = (req.query.address || '').toLowerCase()
  if (!address) return res.status(400).json({ error: 'address is required' })

  const nonce = generateNonce()
  const now = Date.now()
  db.run(
    `INSERT OR REPLACE INTO sessions(address, nonce, created_at) VALUES(?,?,?)`,
    [address, nonce, now],
    (err) => {
      if (err) {
        console.error(err)
        return res.status(500).json({ error: 'db error' })
      }
      res.json({ nonce })
    }
  )
})

app.post('/verify', async (req, res) => {
  try {
    const { address, signature } = req.body
    if (!address || !signature) return res.status(400).json({ error: 'address and signature required' })
    const lcAddress = address.toLowerCase()

    db.get(`SELECT nonce FROM sessions WHERE address = ?`, [lcAddress], (err, row) => {
      if (err) {
        console.error(err)
        return res.status(500).json({ error: 'db error' })
      }
      if (!row || !row.nonce) return res.status(400).json({ error: 'no nonce for address' })

      const nonce = row.nonce
      // Verify signature using ethers
      let recovered
      try {
        recovered = ethers.verifyMessage(nonce, signature)
      } catch (e) {
        console.error('verify error', e)
        return res.status(400).json({ error: 'invalid signature' })
      }

      if (recovered.toLowerCase() !== lcAddress) {
        return res.status(400).json({ error: 'signature mismatch' })
      }

      // valid — issue JWT
      const token = jwt.sign({ address: lcAddress }, JWT_SECRET, { expiresIn: '7d' })
      const now = Date.now()
      db.run(`UPDATE sessions SET jwt = ?, created_at = ? WHERE address = ?`, [token, now, lcAddress], (uerr) => {
        if (uerr) console.error('db update jwt err', uerr)
        // set cookie as httpOnly (if same-origin). For cross-origin demo we'll return token in body.
        res.json({ token, address: lcAddress })
      })
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'internal' })
  }
})

app.get('/session', (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'missing auth' })
  const parts = auth.split(' ')
  if (parts.length !== 2) return res.status(401).json({ error: 'invalid auth' })
  const token = parts[1]
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    res.json({ valid: true, payload })
  } catch (e) {
    res.status(401).json({ valid: false })
  }
})

// Log wallets when a user connects
app.post('/wallets', (req, res) => {
  const { address } = req.body
  if (!address) return res.status(400).json({ error: 'address required' })
  const now = Date.now()
  db.run(`INSERT INTO wallets(address, created_at) VALUES(?,?)`, [address.toLowerCase(), now], function (err) {
    if (err) {
      console.error(err)
      return res.status(500).json({ error: 'db error' })
    }
    res.json({ ok: true, id: this.lastID })
  })
})

app.post('/logout', (req, res) => {
  const { address } = req.body
  if (!address) return res.status(400).json({ error: 'address required' })
  db.run(`UPDATE sessions SET jwt = NULL WHERE address = ?`, [address.toLowerCase()], (err) => {
    if (err) console.error(err)
    res.json({ ok: true })
  })
})

app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`)
})