Cardexah Clone — Landing page + Wallet Connect demo

This is a minimal starter that demonstrates a landing page and wallet connect using Next.js, Tailwind CSS, wagmi, and RainbowKit.

Quick start:

1. cd "cardexah-clone"
2. npm install
   - installs: next react react-dom wagmi @rainbow-me/rainbowkit ethers tailwindcss postcss autoprefixer
3. npx tailwindcss init -p    # (optional) Already included config file here
4. npm run dev

Open http://localhost:3000

Notes:
- The app uses publicProvider for RPC. For production, add Alchemy/Infura or other providers.
- You can change the chains in pages/_app.js (currently mainnet, polygon, goerli).
- RainbowKit provides the ConnectButton UI that allows MetaMask, WalletConnect, and other wallets.

If you want, I can:
- Add a more complete visual clone of the landing page (images, icons, responsive styles)
- Initialize a git repo and commit these files
- Install dependencies here and run the dev server

