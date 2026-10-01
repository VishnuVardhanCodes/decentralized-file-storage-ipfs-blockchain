import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  DEFAULT_CHAIN_ID,
  isSupportedChain,
  getChainConfig,
} from "../config/chains";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Check if MetaMask or compatible EVM provider is injected
  const isMetaMaskInstalled = typeof window !== "undefined" && Boolean(window.ethereum);

  // Clear wallet error
  const clearError = useCallback(() => setError(null), []);

  /**
   * Disconnects current session state
   */
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setSigner(null);
    setProvider(null);
    setError(null);
  }, []);

  /**
   * Initializes browser provider and queries chain info
   */
  const updateWalletState = useCallback(async (browserProvider, accounts) => {
    try {
      if (!accounts || accounts.length === 0) {
        disconnectWallet();
        return;
      }

      const activeAccount = accounts[0];
      const network = await browserProvider.getNetwork();
      const currentChainId = Number(network.chainId);
      const activeSigner = await browserProvider.getSigner();

      setAccount(activeAccount);
      setChainId(currentChainId);
      setProvider(browserProvider);
      setSigner(activeSigner);
      setError(null);
    } catch (err) {
      console.error("Error updating wallet state:", err);
      setError(err.message || "Failed to update wallet state.");
    }
  }, [disconnectWallet]);

  /**
   * Connect Wallet initiated by user click
   */
  const connectWallet = useCallback(async () => {
    if (!isMetaMaskInstalled) {
      const msg = "MetaMask is not detected. Please install the MetaMask extension to use DeFileChain.";
      setError(msg);
      return { success: false, error: msg };
    }

    setIsConnecting(true);
    setError(null);

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      
      // Request user account authorization
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No Ethereum accounts found or connection was rejected.");
      }

      await updateWalletState(browserProvider, accounts);
      setIsConnecting(false);
      return { success: true, account: accounts[0] };
    } catch (err) {
      setIsConnecting(false);
      let friendlyError = err.message || "Failed to connect MetaMask.";
      if (err.code === 4001) {
        friendlyError = "Connection request was rejected in MetaMask.";
      } else if (err.code === -32002) {
        friendlyError = "A connection request is already pending in MetaMask. Please check your extension.";
      }
      setError(friendlyError);
      return { success: false, error: friendlyError };
    }
  }, [isMetaMaskInstalled, updateWalletState]);

  /**
   * Switch Network in MetaMask to designated chain
   */
  const switchNetwork = useCallback(async (targetChainId = DEFAULT_CHAIN_ID) => {
    if (!isMetaMaskInstalled) return false;
    const targetConfig = getChainConfig(targetChainId);

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetConfig.chainIdHex || ethers.toQuantity(targetChainId) }],
      });
      return true;
    } catch (switchError) {
      // Error code 4902 means the chain has not been added to MetaMask yet
      if (switchError.code === 4902 && targetConfig.rpcUrl) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: targetConfig.chainIdHex || ethers.toQuantity(targetChainId),
                chainName: targetConfig.name,
                rpcUrls: [targetConfig.rpcUrl],
                nativeCurrency: {
                  name: targetConfig.currency || "ETH",
                  symbol: targetConfig.currency || "ETH",
                  decimals: 18,
                },
                blockExplorerUrls: targetConfig.explorer ? [targetConfig.explorer] : null,
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error("Failed to add target chain to MetaMask:", addError);
          setError(`Could not add network ${targetConfig.name} to MetaMask.`);
          return false;
        }
      }
      console.error("Failed to switch network:", switchError);
      setError(`Failed to switch network to ${targetConfig.name}.`);
      return false;
    }
  }, [isMetaMaskInstalled]);

  // Event listeners for account and chain changes
  useEffect(() => {
    if (!isMetaMaskInstalled) return;

    const handleAccountsChanged = (accounts) => {
      console.log("[WalletContext] Accounts changed:", accounts);
      if (!accounts || accounts.length === 0) {
        disconnectWallet();
      } else {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        updateWalletState(browserProvider, accounts);
      }
    };

    const handleChainChanged = (chainHex) => {
      const numericId = parseInt(chainHex, 16);
      console.log("[WalletContext] Chain changed to:", numericId);
      setChainId(numericId);
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts) => {
          if (accounts && accounts.length > 0) {
            updateWalletState(browserProvider, accounts);
          }
        })
        .catch(console.error);
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [isMetaMaskInstalled, disconnectWallet, updateWalletState]);

  const isConnected = Boolean(account && signer);
  const isSupported = chainId ? isSupportedChain(chainId) : true;
  const currentChainConfig = chainId ? getChainConfig(chainId) : getChainConfig(DEFAULT_CHAIN_ID);

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        chainName: currentChainConfig.name,
        currentChainConfig,
        provider,
        signer,
        isConnected,
        isConnecting,
        isSupported,
        isMetaMaskInstalled,
        error,
        clearError,
        connectWallet,
        disconnectWallet,
        switchNetwork,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
