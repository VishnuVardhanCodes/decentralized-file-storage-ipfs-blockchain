const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=========================================");
  console.log("DeFileChain - Deploying FileRegistry Smart Contract");
  console.log("=========================================");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  const FileRegistry = await hre.ethers.getContractFactory("FileRegistry");
  const fileRegistry = await FileRegistry.deploy();
  await fileRegistry.waitForDeployment();

  const contractAddress = await fileRegistry.getAddress();
  console.log("-----------------------------------------");
  console.log("FileRegistry successfully deployed to:", contractAddress);
  console.log("-----------------------------------------");

  // Fetch full contract artifact for ABI
  const artifact = await hre.artifacts.readArtifact("FileRegistry");

  // Prepare deployment info payload
  const deploymentInfo = {
    address: contractAddress,
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: artifact.abi,
  };

  // Export deployment info to blockchain directory
  const blockchainDeployPath = path.join(__dirname, "../deployment.json");
  fs.writeFileSync(blockchainDeployPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Saved deployment metadata to:", blockchainDeployPath);

  // Sync to frontend config folder
  const clientConfigDir = path.join(__dirname, "../../client/src/config");
  if (!fs.existsSync(clientConfigDir)) {
    fs.mkdirSync(clientConfigDir, { recursive: true });
  }
  const clientConfigPath = path.join(clientConfigDir, "contractConfig.json");
  fs.writeFileSync(clientConfigPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Synced deployment metadata to client config:", clientConfigPath);

  // Sync to server config folder
  const serverConfigDir = path.join(__dirname, "../../server/src/config");
  if (!fs.existsSync(serverConfigDir)) {
    fs.mkdirSync(serverConfigDir, { recursive: true });
  }
  const serverConfigPath = path.join(serverConfigDir, "contractConfig.json");
  fs.writeFileSync(serverConfigPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Synced deployment metadata to server config:", serverConfigPath);

  console.log("Deployment completed successfully.");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
