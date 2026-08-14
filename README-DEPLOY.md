Run instructions (Frontend + Backend)

1) Prerequisites
   - Node.js >=18 and npm installed
   - (Optional) A browser wallet like MetaMask

2) Install dependencies
   cd "cardexah-clone"
   npm install

3) Configure environment
   Copy .env.example to .env and edit JWT_SECRET (set a strong secret)

4) Run server and client (in two terminals)
   Terminal 1 (server):
     npm run dev:server
   Terminal 2 (client):
     npm run dev:client

5) Open frontend: http://localhost:3000
   The frontend talks to the server at NEXT_PUBLIC_API_URL (default http://localhost:4000)

Notes
- The signature login flow:
  1. Client requests a nonce from GET /nonce?address=<address>
  2. Client signer signs the nonce and sends signature + address to POST /verify
  3. Server verifies signature and returns a JWT token
  4. Client stores token (localStorage) and may include it in Authorization: Bearer <token> when calling /session

- To deploy: set environment variables on your host (JWT_SECRET, DATABASE_FILE, PORT), and use a production DB file.

Security
- Never reuse nonces. Use longer unpredictable nonces in production.
- Use HTTPS and set secure cookies for production.
- Audit signature messages so users know what they sign.

