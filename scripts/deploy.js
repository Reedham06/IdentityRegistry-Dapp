const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment...");

  const IdentityRegistry = await hre.ethers.getContractFactory("IdentityRegistry");
  console.log("📝 Deploying IdentityRegistry contract...");
  
  const identityRegistry = await IdentityRegistry.deploy();
  await identityRegistry.waitForDeployment();

  const address = await identityRegistry.getAddress();

  console.log("✅ IdentityRegistry deployed to:", address);
  console.log("\n" + "=".repeat(60));
  console.log("📋 SAVE THIS ADDRESS - YOU'LL NEED IT FOR THE FRONTEND!");
  console.log("CONTRACT_ADDRESS:", address);
  console.log("=".repeat(60) + "\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("🔑 Deployed by:", deployer.address);
  console.log("💰 Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});