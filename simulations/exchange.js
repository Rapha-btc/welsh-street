import { SimulationBuilder } from "stxer";
import { uintCV, principalCV, noneCV } from "@stacks/transactions";
import { readFileSync } from "fs";

// Load contract sources - order matters for dependencies!
const welshcorgicoinSource = readFileSync("./contracts/welshcorgicoin.clar", "utf8");
const creditSource = readFileSync("./contracts/credit.clar", "utf8");
const streetSource = readFileSync("./contracts/street.clar", "utf8");
const rewardsSource = readFileSync("./contracts/rewards.clar", "utf8");
const exchangeSource = readFileSync("./contracts/exchange.clar", "utf8");

// Use mainnet addresses since contracts reference mainnet SIP-010 trait
const deployer = "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE"; // mainnet (SIP-010 owner)
const wallet1 = "SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G"; // welshcorgicoin owner

console.log("=== EXCHANGE STXER SIMULATIONS (MAINNET) ===\n");

// Helper to deploy all DEX contracts in correct order
function addDexContracts(builder) {
  return builder
    .addContractDeploy({ contract_name: "welshcorgicoin", source_code: welshcorgicoinSource })
    .addContractDeploy({ contract_name: "credit", source_code: creditSource })
    .addContractDeploy({ contract_name: "street", source_code: streetSource })
    .addContractDeploy({ contract_name: "rewards", source_code: rewardsSource })
    .addContractDeploy({ contract_name: "exchange", source_code: exchangeSource });
}

// Simulation 1: Deploy all contracts and mint STREET
console.log("1. Deploy DEX contracts and mint STREET tokens...");
try {
  const mintAmount = 100_000_000_000_000n; // 100M STREET

  let builder = SimulationBuilder.new({ network: "mainnet" }).withSender(deployer);
  builder = addDexContracts(builder);

  const sim1 = await builder
    .addContractCall({
      contract_id: `${deployer}.street`,
      function_name: "street-mint",
      function_args: [uintCV(mintAmount)]
    })
    .run();

  console.log("   Simulation ID:", sim1);
  console.log("   View at: https://stxer.xyz/simulations/mainnet/" + sim1);
} catch (e) {
  console.log("   Error:", e.message);
}
console.log("");

// Simulation 2: Provide initial liquidity
console.log("2. Provide initial liquidity...");
try {
  const mintAmount = 100_000_000_000_000n;
  const welshLiq = 1_000_000_000_000n; // 1M WELSH
  const streetLiq = 1_000_000_000_000n; // 1M STREET

  let builder = SimulationBuilder.new({ network: "mainnet" }).withSender(deployer);
  builder = addDexContracts(builder);

  const sim2 = await builder
    .addContractCall({
      contract_id: `${deployer}.street`,
      function_name: "street-mint",
      function_args: [uintCV(mintAmount)]
    })
    .addContractCall({
      contract_id: `${deployer}.exchange`,
      function_name: "provide-initial-liquidity",
      function_args: [uintCV(welshLiq), uintCV(streetLiq)]
    })
    .addContractCall({
      contract_id: `${deployer}.exchange`,
      function_name: "get-exchange-info",
      function_args: []
    })
    .run();

  console.log("   Simulation ID:", sim2);
  console.log("   View at: https://stxer.xyz/simulations/mainnet/" + sim2);
} catch (e) {
  console.log("   Error:", e.message);
}
console.log("");

// Simulation 3: Swap WELSH for STREET
console.log("3. Swap WELSH -> STREET...");
try {
  const mintAmount = 100_000_000_000_000n;
  const welshLiq = 10_000_000_000_000n; // 10M WELSH
  const streetLiq = 10_000_000_000_000n; // 10M STREET
  const swapAmount = 100_000_000_000n; // 100K WELSH

  let builder = SimulationBuilder.new({ network: "mainnet" }).withSender(deployer);
  builder = addDexContracts(builder);

  const sim3 = await builder
    .addContractCall({
      contract_id: `${deployer}.street`,
      function_name: "street-mint",
      function_args: [uintCV(mintAmount)]
    })
    .addContractCall({
      contract_id: `${deployer}.exchange`,
      function_name: "provide-initial-liquidity",
      function_args: [uintCV(welshLiq), uintCV(streetLiq)]
    })
    .addContractCall({
      contract_id: `${deployer}.exchange`,
      function_name: "swap-a-b",
      function_args: [uintCV(swapAmount)]
    })
    .run();

  console.log("   Simulation ID:", sim3);
  console.log("   View at: https://stxer.xyz/simulations/mainnet/" + sim3);
} catch (e) {
  console.log("   Error:", e.message);
}
console.log("");

// Simulation 4: Check LP tokens
console.log("4. Check LP token balance...");
try {
  const mintAmount = 100_000_000_000_000n;
  const welshLiq = 1_000_000_000_000n;
  const streetLiq = 1_000_000_000_000n;

  let builder = SimulationBuilder.new({ network: "mainnet" }).withSender(deployer);
  builder = addDexContracts(builder);

  const sim4 = await builder
    .addContractCall({
      contract_id: `${deployer}.street`,
      function_name: "street-mint",
      function_args: [uintCV(mintAmount)]
    })
    .addContractCall({
      contract_id: `${deployer}.exchange`,
      function_name: "provide-initial-liquidity",
      function_args: [uintCV(welshLiq), uintCV(streetLiq)]
    })
    .addContractCall({
      contract_id: `${deployer}.credit`,
      function_name: "get-balance",
      function_args: [principalCV(deployer)]
    })
    .addContractCall({
      contract_id: `${deployer}.credit`,
      function_name: "get-total-supply",
      function_args: []
    })
    .run();

  console.log("   Simulation ID:", sim4);
  console.log("   View at: https://stxer.xyz/simulations/mainnet/" + sim4);
} catch (e) {
  console.log("   Error:", e.message);
}
console.log("");

// Simulation 5: Non-owner liquidity (should fail)
console.log("5. Non-owner initial liquidity (expect err u701)...");
try {
  let builder = SimulationBuilder.new({ network: "mainnet" }).withSender(deployer);
  builder = addDexContracts(builder);

  const sim5 = await builder
    .withSender(wallet1)
    .addContractCall({
      contract_id: `${deployer}.exchange`,
      function_name: "provide-initial-liquidity",
      function_args: [uintCV(1000n), uintCV(1000n)]
    })
    .run();

  console.log("   Simulation ID:", sim5);
  console.log("   View at: https://stxer.xyz/simulations/mainnet/" + sim5);
} catch (e) {
  console.log("   Error:", e.message);
}
console.log("");

console.log("=== EXCHANGE SIMULATIONS COMPLETE ===");
