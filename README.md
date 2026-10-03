# DeFileChain – Decentralized File Storage System Using IPFS and Blockchain

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636.svg)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.22.5-yellow.svg)](https://hardhat.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)

---

## 1. Project Overview

**DeFileChain** is an enterprise-grade academic Web3 application that implements a decentralized file storage and cryptographic registry ecosystem. It synergizes the content-addressing power of the **InterPlanetary File System (IPFS)** with the trustless, immutable consensus of **Ethereum EVM Smart Contracts**.

In DeFileChain, actual raw file payloads are stored and distributed over the peer-to-peer IPFS network without bloating the blockchain state. The smart contract acts as an immutable registry that cryptographically binds the IPFS Content Identifier (CID), file metadata, upload timestamp, active status, and the uploader’s Ethereum wallet address. Users can authenticate with MetaMask, upload files, register them on-chain, retrieve payloads across decentralized gateways, and mathematically verify file integrity.

---

## 2. Problem Statement

Centralized cloud storage solutions (e.g., Google Drive, AWS S3, Dropbox) face critical security and architectural vulnerabilities:
1. **Single Points of Failure & Outages:** A server or DNS failure disables access for millions.
2. **Data Tampering & Silent Bit-Rot:** Centralized hosts can alter, censor, or replace file contents without detection.
3. **Lack of Cryptographic Ownership:** Cloud providers own the database and access permissions, not the user.
4. **Blockchain Storage Impracticality:** Storing megabytes or gigabytes directly in EVM storage slots is prohibitively expensive (costing millions of dollars in gas).

**DeFileChain solves this dilemma** through a hybrid dual-layer Web3 architecture:
- **Off-Chain Content-Addressed Storage:** IPFS holds the distributed data payload addressed by its cryptographic multihash (CID).
- **On-Chain Immutable Ownership:** Ethereum smart contract stores the CID pointer, metadata, and cryptographic ownership record.

---

## 3. Project Objectives

- Provide secure, self-sovereign authentication using MetaMask without centralized passwords.
- Implement strict client-side and server-side file format and size validation.
- Securely pin files to IPFS (via Pinata Cloud API or zero-dependency local content-addressed storage fallback).
- Deploy an audited Solidity smart contract (`FileRegistry.sol`) with strict access control and event logging.
- Enable end-to-end cryptographic file integrity verification using SHA-256 and IPFS CID re-calculation.
- Provide a responsive, glassmorphic dark Web3 user interface built using React and React Bootstrap.
- Prevent exposure of IPFS private tokens or blockchain private keys to the client browser.

---

## 4. System Architecture

```text
                               +-----------------------------+
                               |     React Web Client        |
                               |  (React Bootstrap + Ethers) |
                               +--------------+--------------+
                                              |
                     1. Upload File           |  4. Register CID Transaction
                     (multipart/form-data)    |     via MetaMask Signer
                                              |
               +------------------------------+------------------------------+
               |                                                             |
               v                                                             v
+-------------------------------+                           +---------------------------------+
|   Node.js / Express Server    |                           |  EVM Blockchain (Hardhat / Eth) |
|   (Multer + Axios + Crypto)   |                           |  FileRegistry.sol Contract      |
+---------------+---------------+                           +----------------+----------------+
                |                                                            |
2. Hash & Pin   | 3. Return CID                                              | 5. Confirm Block &
                v                                                            |    Emit Events
+-------------------------------+                                            v
|    IPFS Decentralized Layer   |                            +--------------------------------+
| (Pinata Cloud / Local Store)  |                            |   State:                       |
+---------------+---------------+                            |   - File ID & Name             |
                ^                                            |   - IPFS CID                   |
                |                                            |   - Owner Address              |
                +--------------------------------------------+   - Timestamp & Active Flag    |
                         6. Fetch & Verify Integrity         +--------------------------------+
```

### Complete End-to-End Workflow

1. **User Authentication:** User connects their MetaMask wallet on a supported network (Hardhat Localhost or Sepolia).
2. **File Selection & Validation:** The user drags-and-drops a file. The application validates filename safety, non-empty payload, and size threshold (&le; 50 MB).
3. **Backend Upload & Pinning:** The file is streamed to the Express backend. The server computes its SHA-256 digest, generates the multihash CID, and pins the file to IPFS.
4. **CID Reception:** The client receives the generated CID and gateway link.
5. **Blockchain Registration:** User triggers `Register on Blockchain`. MetaMask prompts for signature; the `registerFile` transaction executes on the `FileRegistry` smart contract.
6. **Transaction Confirmation:** Once mined, the transaction hash, assigned File ID, and event logs are displayed.
7. **Storage & Verification:** The file appears in `My Files`. Users can view, download, or run the `Verify Integrity` engine to cryptographically check that retrieved bytes match the registered CID byte-for-byte.

---

## 5. Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, React Router v6, React Bootstrap 2, Bootstrap Icons, Ethers.js v6, Axios, Vanilla CSS (Glassmorphism) |
| **Backend** | Node.js, Express.js, Multer, Axios, FormData, Crypto, Dotenv, CORS |
| **Blockchain** | Solidity `^0.8.24`, Hardhat 2.22, `@nomicfoundation/hardhat-toolbox`, Ethers.js v6 |
| **Storage** | IPFS (InterPlanetary File System), Pinata Cloud REST API, Local Content-Addressed Storage Fallback |
| **Wallet** | MetaMask Injected Web3 Provider (EIP-1193) |
| **Testing** | Hardhat / Mocha / Chai (Contracts), Supertest / Jest (Backend), React Testing Library (Frontend) |

---

## 6. Project Structure

```text
DeFileChain/
├── blockchain/                      # Smart contract development environment
│   ├── contracts/
│   │   └── FileRegistry.sol         # Core registry smart contract
│   ├── ignition/
│   │   └── modules/
│   │       └── FileRegistry.js      # Hardhat ignition deployment module
│   ├── scripts/
│   │   └── deploy.js                # Deployment script (syncs ABI & address)
│   ├── test/
│   │   └── FileRegistry.test.js     # Comprehensive smart contract tests
│   ├── hardhat.config.js            # Hardhat network & compiler configuration
│   ├── package.json                 # Blockchain dependencies
│   └── .env.example                 # Blockchain RPC & private key template
│
├── server/                          # Backend API & IPFS gateway service
│   ├── src/
│   │   ├── config/
│   │   │   ├── environment.js       # Env variables and configuration
│   │   │   └── contractConfig.json  # Synced smart contract deployment info
│   │   ├── controllers/
│   │   │   └── fileController.js    # Upload, metadata, retrieve, and verify
│   │   ├── middleware/
│   │   │   ├── errorHandler.js      # Global error and 404 handlers
│   │   │   └── fileValidation.js    # Multer configuration & file filter
│   │   ├── routes/
│   │   │   ├── fileRoutes.js        # File endpoint declarations
│   │   │   └── healthRoutes.js      # Health check endpoint
│   │   ├── services/
│   │   │   └── ipfsService.js       # Pinata & content-addressed storage engine
│   │   ├── utils/
│   │   │   └── hashUtil.js          # Base58 multihash & SHA-256 utilities
│   │   └── app.js                   # Express application setup
│   ├── test/
│   │   └── fileApi.test.js          # Jest & Supertest API tests
│   ├── uploads/                     # Local storage directory (.gitkeep)
│   ├── package.json                 # Server dependencies
│   └── .env.example                 # Server environment variables template
│
├── client/                          # React Frontend application
│   ├── public/
│   │   ├── index.html               # HTML entry with Google Web3 fonts
│   │   └── manifest.json            # Web app manifest
│   ├── src/
│   │   ├── components/
│   │   │   ├── Footer.jsx           # Academic footer with architecture links
│   │   │   ├── LoadingSpinner.jsx   # Glowing Web3 loading spinner
│   │   │   ├── Navbar.jsx           # Navigation, network badge, and wallet
│   │   │   ├── NetworkWarning.jsx   # Unsupported chain switch banner
│   │   │   └── StatCard.jsx         # Glassmorphic dashboard metrics card
│   │   ├── config/
│   │   │   ├── chains.js            # Supported EVM network definitions
│   │   │   └── contractConfig.json  # Synced contract address & ABI
│   │   ├── context/
│   │   │   ├── NotificationContext.jsx # Glassmorphic toast notification system
│   │   │   └── WalletContext.jsx    # MetaMask authentication and network state
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Metrics, recent files, and quick actions
│   │   │   ├── FileDetails.jsx      # On-chain details, owner, download, and deactivation
│   │   │   ├── Home.jsx             # Hero landing, how it works, and features
│   │   │   ├── MyFiles.jsx          # User files, search, filtering, and preview
│   │   │   ├── NotFound.jsx         # 404 page
│   │   │   ├── Upload.jsx           # Drag-and-drop, IPFS upload, and on-chain tx
│   │   │   └── VerifyFile.jsx       # Cryptographic integrity comparison
│   │   ├── services/
│   │   │   ├── apiService.js        # Backend Axios client
│   │   │   └── blockchainService.js # Ethers.js contract service
│   │   ├── styles/
│   │   │   ├── App.css              # Page layouts & component styles
│   │   │   └── index.css            # Dark glassmorphic design system
│   │   ├── utils/
│   │   │   ├── formatters.js        # Format bytes, addresses, dates, CIDs
│   │   │   └── validation.js        # File size and CID validation
│   │   ├── App.js                   # Routing & global providers
│   │   ├── App.test.js              # Frontend UI tests
│   │   └── index.js                 # React root renderer
│   ├── package.json                 # Frontend dependencies
│   └── .env.example                 # Frontend environment template
│
├── docs/
│   └── API.md                       # Comprehensive REST API documentation
├── .gitignore                       # Git ignore configuration
├── LICENSE                          # MIT License
├── package.json                     # Unified root scripts
└── README.md                        # Project documentation
```

---

## 7. Prerequisites

Before running the project, ensure you have installed:
- **Node.js**: v18.0.0 or higher (`node -v`)
- **npm**: v9.0.0 or higher (`npm -v`)
- **MetaMask Extension**: Installed in your Chromium / Firefox browser

---

## 8. Installation & Setup Instructions

### Step 1: Clone or Navigate to the Repository

```bash
cd DeFileChain
```

### Step 2: Install Dependencies for All Subsystems

You can install dependencies for each module:

```bash
# Install Blockchain dependencies
cd blockchain
npm install

# Install Server dependencies
cd ../server
npm install

# Install Client dependencies
cd ../client
npm install

# Return to root
cd ..
```

---

## 9. Environment Configuration

The application uses environment variables to configure the blockchain network, backend IPFS connection, and React frontend. A master consolidated template is located at `.env` / `.env.example` in the project root, and each subsystem has its own dedicated `.env` file:

### 1. Root Master Environment (`.env`)
Located in the project root: `DeFileChain/.env`. Provides a centralized reference for all components.

### 2. Blockchain Environment (`blockchain/.env`)
Create `blockchain/.env` based on `blockchain/.env.example`:

```env
# Personal MetaMask account address to receive 10.0 local test ETH via "npm run fund"
RECIPIENT_ADDRESS=

# Amount of local test ETH to transfer (Default: 10.0 ETH)
AMOUNT_ETH=10.0

# Optional: Ethereum Sepolia testnet RPC and deployment keys
SEPOLIA_RPC_URL=https://rpc.sepolia.org
PRIVATE_KEY=
ETHERSCAN_API_KEY=
```

### 3. Server Environment (`server/.env`)
Create `server/.env` based on `server/.env.example`:

```env
PORT=5000
CLIENT_URL=http://localhost:3000
MAX_FILE_SIZE_BYTES=52428800
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,text/csv,application/json,application/zip,application/x-zip-compressed
IPFS_PROVIDER=auto

# (Optional) Pinata Cloud Credentials
# If left empty, DeFileChain uses its built-in content-addressed IPFS storage fallback
PINATA_JWT=
PINATA_API_KEY=
PINATA_API_SECRET=
PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/

IPFS_PUBLIC_GATEWAYS=https://gateway.pinata.cloud/ipfs/,https://ipfs.io/ipfs/,https://cloudflare-ipfs.com/ipfs/
IPFS_API_URL=http://127.0.0.1:5001
```

### 4. Client Environment (`client/.env`)
Create `client/.env` based on `client/.env.example`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
REACT_APP_DEFAULT_CHAIN_ID=31337
REACT_APP_DEFAULT_CHAIN_NAME="Hardhat Localhost"
REACT_APP_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```


---

## 10. Running the Application (Step-by-Step)

To run the complete working application end-to-end, open **3 terminal windows**:

### Terminal 1: Start Hardhat Blockchain Node

```bash
cd blockchain
npx hardhat node
```
*This starts a local Ethereum node at `http://127.0.0.1:8545` with Chain ID `31337` and 20 pre-funded test accounts.*

In a separate prompt (or another tab), deploy the `FileRegistry` contract to the local node:
```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```
*The script deploys `FileRegistry` (typically to `0x5FbDB2315678afecb367f032d93F642f64180aa3`) and automatically updates the configuration files in `client/` and `server/`.*

### Terminal 2: Start Express Backend

```bash
cd server
npm start
```
*The server starts on `http://localhost:5000` with the health check available at `http://localhost:5000/api/health`.*

### Terminal 3: Start React Frontend

```bash
cd client
npm start
```
*The React application opens automatically in your browser at `http://localhost:3000`.*

---

## 11. MetaMask Setup for Hardhat Localhost

1. Open your MetaMask browser extension.
2. Click **Add Network** &rarr; **Add a network manually**:
   - **Network Name:** Hardhat Localhost
   - **New RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`
3. Import a test account from the Hardhat terminal:
   - Copy Private Key for Account #0:
     `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - In MetaMask: Profile &rarr; **Import Account** &rarr; Paste Private Key.
   - You now have 10,000 test ETH on Hardhat Localhost!

---

## 12. Automated Testing

DeFileChain features comprehensive test coverage across smart contracts, backend endpoints, and frontend components:

### 1. Smart Contract Tests (Hardhat / Chai)
Tests deployment, registration, ownership, retrieval, access control, deactivation, and invalid inputs:
```bash
cd blockchain
npx hardhat test

npx hardhat node
```
*Result: 20 passing tests.*

### 2. Backend API Tests (Jest / Supertest)
Tests health check, upload validations, IPFS multihash generation, streaming retrieval, and cryptographic integrity verification:
```bash
cd server
npm test
```
*Result: 8 passing tests.*

### 3. Frontend Tests (React Testing Library)
Tests UI rendering, navigation links, and brand integrity:
```bash
cd client
npm test
```

---

## 13. Smart Contract Specification

The smart contract `FileRegistry.sol` is written in Solidity `^0.8.24`:

```solidity
struct FileRecord {
    uint256 id;
    string fileName;
    string cid;
    string fileType;
    uint256 fileSize;
    address owner;
    uint256 timestamp;
    bool active;
}
```

### Methods:
- `registerFile(string memory fileName, string memory cid, string memory fileType, uint256 fileSize) external returns (uint256)`
- `getFile(uint256 id) external view returns (FileRecord memory)`
- `getMyFiles() external view returns (FileRecord[] memory)`
- `getUserFiles(address user) external view returns (FileRecord[] memory)`
- `getFileCount() external view returns (uint256)`
- `deactivateFile(uint256 id) external` *(Restricted to file owner)*
- `verifyFile(uint256 id, string memory cid) external view returns (bool)`

### Events:
- `event FileRegistered(uint256 indexed id, string fileName, string cid, address indexed owner, uint256 timestamp);`
- `event FileDeactivated(uint256 indexed id, address indexed owner, uint256 timestamp);`

---

## 14. Security & Privacy Guarantees

- **No Private Keys in Frontend:** Frontend only interacts via standard MetaMask provider prompts (`eth_requestAccounts`, `eth_sendTransaction`).
- **IPFS Secrets Isolation:** Pinata API keys and JWTs exist exclusively in `server/.env` and are never exposed via API endpoints or frontend bundles.
- **Smart Contract Access Control:** Only the owner address stored on-chain can execute `deactivateFile`. Re-entrancy and integer overflow protected by Solidity `^0.8.24`.
- **Input Sanitization:** Express backend sanitizes filenames against directory traversal (`path.basename`), enforces strict size thresholds, and rejects 0-byte payloads.

---

## 15. Troubleshooting Guide

| Issue | Cause | Resolution |
| :--- | :--- | :--- |
| **MetaMask says "Nonce too high"** | Local Hardhat node was restarted while MetaMask kept previous transaction nonces | In MetaMask, go to **Settings &rarr; Advanced &rarr; Clear activity tab data** (Reset Account). |
| **"Network Mismatch" banner** | MetaMask is connected to Mainnet or another network | Click the **"Switch to Hardhat Localhost"** button in the notification banner. |
| **IPFS Upload fails with network error** | No internet or Pinata API credentials missing | The server automatically falls back to its local content-addressed IPFS repository, guaranteeing zero downtime. |
| **CORS error on API requests** | Backend is not running or running on a non-default port | Ensure `server/.env` has `PORT=5000` and start the server with `npm start`. |
| **Smart contract call reverts** | Attempting to deactivate a file owned by another wallet address | Ensure you are connected to the exact wallet address that registered the file. |

---

## 16. Future Enhancements

- **Client-Side Symmetric Encryption:** Integrate AES-256-GCM encryption before IPFS upload with private keys derived from wallet signatures.
- **ERC-721 / ERC-1155 NFT Minting:** Provide an option to wrap registered files into transferable digital asset tokens.
- **Decentralized File Sharing:** Threshold cryptography or Lit Protocol integration to share encrypted files with specific wallet addresses.
- **Layer 2 Deployment:** Support for Arbitrum, Optimism, and Polygon zkEVM for negligible gas fees.

---

## 17. License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
