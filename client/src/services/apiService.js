import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

/**
 * Checks server health
 */
export async function checkServerHealth() {
  try {
    const response = await apiClient.get("/health");
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || "Backend server unreachable",
    };
  }
}

/**
 * Uploads a physical file to the backend, which validates and pins to IPFS
 * @param {File} file
 * @param {Function} [onUploadProgress]
 * @returns {Promise<Object>}
 */
export async function uploadFileToIpfs(file, onUploadProgress) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post("/files/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percent);
      }
    },
  });

  return response.data;
}

/**
 * Fetches file metadata by CID or File
 * @param {string|File} target
 */
export async function fetchFileMetadata(target) {
  if (typeof target === "string") {
    const response = await apiClient.post("/files/metadata", { cid: target });
    return response.data;
  } else {
    const formData = new FormData();
    formData.append("file", target);
    const response = await apiClient.post("/files/metadata", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }
}

/**
 * Verifies physical file buffer against registered IPFS CID
 * @param {string} cid
 * @param {File} file
 */
export async function verifyFileIntegrity(cid, file) {
  const formData = new FormData();
  formData.append("cid", cid);
  formData.append("file", file);

  const response = await apiClient.post("/files/verify", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
}

/**
 * Generates direct download URL through backend gateway proxy
 * @param {string} cid
 * @param {boolean} [download=false]
 */
export function getFileUrl(cid, download = false) {
  return `${API_BASE_URL}/files/${cid}${download ? "?download=true" : ""}`;
}

/**
 * Fetches raw file data buffer/blob from backend proxy
 * @param {string} cid
 */
export async function fetchFileBlob(cid) {
  const response = await apiClient.get(`/files/${cid}`, {
    responseType: "blob",
  });
  return response.data;
}

export default apiClient;
