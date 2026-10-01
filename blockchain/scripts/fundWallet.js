const hre = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("=================================================");
  console.log("DeFileChain - Local Development Wallet Funding");
  console.log("=================================================");

  // 1. Verify connected network is a local development network
  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  console.log(`Connected Network: ${hre.network.name} (Chain ID: ${chainId})`);

  if (chainId !== 31337 && chainId !== 1337 && hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    throw new Error(
      `Safety guard triggered: Funding script is only permitted on local test networks (Chain ID 31337 or 1337). Current Chain ID: ${chainId}`
    );
  }

  // 2. Extract recipient address from environment variable or command line arguments
  // Example CLI: npx hardhat run scripts/fundWallet.js --network localhost
  // With env var: RECIPIENT_ADDRESS=0x...
  let recipient = process.env.RECIPIENT_ADDRESS || process.env.RECEIVER_ADDRESS;

  if (!recipient) {
    // Check if passed via command line flags/args (e.g. process.argv)
    const rawArgs = process.argv.slice(2);
    for (let i = 0; i < rawArgs.length; i++) {
      if (rawArgs[i] === "--to" || rawArgs[i] === "--recipient" || rawArgs[i] === "--address") {
        recipient = rawArgs[i + 1];
        break;
      }
      if (hre.ethers.isAddress(rawArgs[i])) {
        recipient = rawArgs[i];
        break;
      }
    }
  }

  if (!recipient) {
    console.error("\n[Error] Missing recipient address!");
    console.log("Please specify your MetaMask wallet address using one of the following methods:");
    console.log("  Method A (Env variable in PowerShell):");
    console.log('    $env:RECIPIENT_ADDRESS="0xYourMetaMaskAddress"; npx hardhat run scripts/fundWallet.js --network localhost');
    console.log("  Method B (CLI argument):");
    console.log("    npx hardhat run scripts/fundWallet.js --network localhost --address 0xYourMetaMaskAddress");
    console.log("  Method C (In blockchain/.env):");
    console.log("    RECIPIENT_ADDRESS=0xYourMetaMaskAddress\n");
    process.exitCode = 1;
    return;
  }

  recipient = recipient.trim();

  // 3. Validate recipient address format
  if (!hre.ethers.isAddress(recipient)) {
    throw new Error(`Invalid Ethereum address provided: "${recipient}". Please provide a valid 42-character 0x... address.`);
  }

  if (recipient.toLowerCase() === hre.ethers.ZeroAddress.toLowerCase()) {
    throw new Error("Cannot send funds to the zero address (0x000...000).");
  }

  // 4. Configure amount of test ETH to transfer (default: 10 ETH)
  const amountEth = process.env.AMOUNT_ETH || "10.0";
  const amountWei = hre.ethers.parseEther(amountEth);

  // 5. Select funded local account (Account #0)
  const [deployer] = await hre.ethers.getSigners();
  const deployerBalanceBefore = await hre.ethers.provider.getBalance(deployer.address);
  const recipientBalanceBefore = await hre.ethers.provider.getBalance(recipient);

  console.log("-------------------------------------------------");
  console.log(`Funding Source (Hardhat #0): ${deployer.address}`);
  console.log(`Source Balance:               ${hre.ethers.formatEther(deployerBalanceBefore)} ETH`);
  console.log(`Target Recipient:             ${recipient}`);
  console.log(`Recipient Initial Balance:    ${hre.ethers.formatEther(recipientBalanceBefore)} ETH`);
  console.log(`Transfer Amount:              ${amountEth} test ETH`);
  console.log("-------------------------------------------------");

  if (deployerBalanceBefore < amountWei) {
    throw new Error(
      `Insufficient funds in Hardhat development account #0 (${hre.ethers.formatEther(deployerBalanceBefore)} ETH available, ${amountEth} ETH requested).`
    );
  }

  // 6. Execute transfer transaction
  console.log("Submitting funding transaction to local blockchain...");
  const tx = await deployer.sendTransaction({
    to: recipient,
    value: amountWei,
  });

  console.log(`Transaction broadcast. Hash: ${tx.hash}`);
  console.log("Waiting for block confirmation...");

  const receipt = await tx.wait(1);

  // 7. Verify receipt and updated recipient balance
  const recipientBalanceAfter = await hre.ethers.provider.getBalance(recipient);

  console.log("-------------------------------------------------");
  console.log("Funding Transaction Confirmed!");
  console.log(`Block Number:       ${receipt.blockNumber}`);
  console.log(`Gas Used:           ${receipt.gasUsed.toString()} units`);
  console.log(`Recipient Address:  ${recipient}`);
  console.log(`New Balance:        ${hre.ethers.formatEther(recipientBalanceAfter)} ETH`);
  console.log("-------------------------------------------------");
  console.log("Success: Your MetaMask wallet now has local test ETH to execute transactions on DeFileChain!");
}

main().catch((error) => {
  console.error("\n[Funding Failed]:", error.message || error);
  process.exitCode = 1;
});
