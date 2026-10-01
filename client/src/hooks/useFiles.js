import { useState, useEffect, useCallback } from "react";
import { useWallet } from "../context/WalletContext";
import { getMyFiles } from "../services/blockchainService";

export function useFiles() {
  const { signer, isConnected } = useWallet();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserFiles = useCallback(async () => {
    if (!isConnected || !signer) {
      setFiles([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const records = await getMyFiles(signer);
      setFiles(records);
    } catch (err) {
      console.error("useFiles error:", err);
      setError(err.message || "Failed to fetch files from blockchain.");
    } finally {
      setLoading(false);
    }
  }, [isConnected, signer]);

  useEffect(() => {
    fetchUserFiles();
  }, [fetchUserFiles]);

  return {
    files,
    loading,
    error,
    refreshFiles: fetchUserFiles,
  };
}

export default useFiles;
