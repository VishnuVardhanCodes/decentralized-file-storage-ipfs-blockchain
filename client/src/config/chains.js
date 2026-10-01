// Chain registry and metadata for supported EVM networks

export const SUPPORTED_CHAINS = {
  31337: {
    chainIdHex: "0x7a69",
    name: "Hardhat Localhost",
    rpcUrl: "http://127.0.0.1:8545",
    currency: "ETH",
    isTestnet: true,
    explorer: null,
  },
  1337: {
    chainIdHex: "0x539",
    name: "Localhost 1337",
    rpcUrl: "http://127.0.0.1:8545",
    currency: "ETH",
    isTestnet: true,
    explorer: null,
  },
  11155111: {
    chainIdHex: "0xaa36a7",
    name: "Ethereum Sepolia",
    rpcUrl: "https://rpc.sepolia.org",
    currency: "SepoliaETH",
    isTestnet: true,
    explorer: "https://sepolia.etherscan.io",
  },
};

export const DEFAULT_CHAIN_ID = parseInt(
  process.env.REACT_APP_DEFAULT_CHAIN_ID || "31337",
  10
);

export function getChainConfig(chainId) {
  const numericId = parseInt(chainId, 10);
  return (
    SUPPORTED_CHAINS[numericId] || {
      name: `Chain ${numericId}`,
      isTestnet: true,
      explorer: null,
      currency: "ETH",
    }
  );
}

export function isSupportedChain(chainId) {
  if (!chainId) return false;
  const numericId = parseInt(chainId, 10);
  return Boolean(SUPPORTED_CHAINS[numericId]);
}

export function getExplorerTxUrl(chainId, txHash) {
  const chain = getChainConfig(chainId);
  if (chain && chain.explorer) {
    return `${chain.explorer}/tx/${txHash}`;
  }
  return null;
}

export function getExplorerAddressUrl(chainId, address) {
  const chain = getChainConfig(chainId);
  if (chain && chain.explorer) {
    return `${chain.explorer}/address/${address}`;
  }
  return null;
}
