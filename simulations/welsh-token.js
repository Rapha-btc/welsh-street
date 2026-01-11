import { SimulationBuilder } from "stxer";
import { uintCV, principalCV, noneCV } from "@stacks/transactions";
import { readFileSync } from "fs";

// Load contract source
const welshcorgicoinSource = readFileSync("./contracts/welshcorgicoin.clar", "utf8");

// Simnet addresses
const deployer = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const wallet1 = "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5";
const wallet2 = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG";

console.log("=== WELSH TOKEN STXER SIMULATIONS ===\n");

// Simulation 1: Deploy contract and check balance
console.log("1. Deploy welshcorgicoin and check deployer balance...");
try {
  const sim1 = await SimulationBuilder.new({ network: "testnet" })
    .withSender(deployer)
    .addContractDeploy({
      contract_name: "welshcorgicoin",
      source_code: welshcorgicoinSource
    })
    .addContractCall({
      contract_id: `${deployer}.welshcorgicoin`,
      function_name: "get-balance",
      function_args: [principalCV(deployer)]
    })
    .run();

  console.log("   Simulation ID:", sim1);
  console.log("   View at: https://stxer.xyz/simulations/testnet/" + sim1);
} catch (e) {
  console.log("   Error:", e.message);
}
console.log("");

// Simulation 2: Transfer tokens
console.log("2. Transfer WELSH tokens...");
try {
  const transferAmount = 1000_000_000n; // 1000 WELSH

  const sim2 = await SimulationBuilder.new({ network: "testnet" })
    .withSender(deployer)
    .addContractDeploy({
      contract_name: "welshcorgicoin",
      source_code: welshcorgicoinSource
    })
    .addContractCall({
      contract_id: `${deployer}.welshcorgicoin`,
      function_name: "transfer",
      function_args: [
        uintCV(transferAmount),
        principalCV(deployer),
        principalCV(wallet1),
        noneCV()
      ]
    })
    .addContractCall({
      contract_id: `${deployer}.welshcorgicoin`,
      function_name: "get-balance",
      function_args: [principalCV(wallet1)]
    })
    .run();

  console.log("   Simulation ID:", sim2);
  console.log("   View at: https://stxer.xyz/simulations/testnet/" + sim2);
} catch (e) {
  console.log("   Error:", e.message);
}
console.log("");

// Simulation 3: Get token metadata
console.log("3. Check token metadata...");
try {
  const sim3 = await SimulationBuilder.new({ network: "testnet" })
    .withSender(deployer)
    .addContractDeploy({
      contract_name: "welshcorgicoin",
      source_code: welshcorgicoinSource
    })
    .addContractCall({
      contract_id: `${deployer}.welshcorgicoin`,
      function_name: "get-name",
      function_args: []
    })
    .addContractCall({
      contract_id: `${deployer}.welshcorgicoin`,
      function_name: "get-symbol",
      function_args: []
    })
    .addContractCall({
      contract_id: `${deployer}.welshcorgicoin`,
      function_name: "get-decimals",
      function_args: []
    })
    .run();

  console.log("   Simulation ID:", sim3);
  console.log("   View at: https://stxer.xyz/simulations/testnet/" + sim3);
} catch (e) {
  console.log("   Error:", e.message);
}
console.log("");

// Simulation 4: Unauthorized transfer
console.log("4. Unauthorized transfer attempt...");
try {
  const sim4 = await SimulationBuilder.new({ network: "testnet" })
    .withSender(deployer)
    .addContractDeploy({
      contract_name: "welshcorgicoin",
      source_code: welshcorgicoinSource
    })
    .withSender(wallet1)
    .addContractCall({
      contract_id: `${deployer}.welshcorgicoin`,
      function_name: "transfer",
      function_args: [
        uintCV(1000n),
        principalCV(deployer), // trying to transfer FROM deployer
        principalCV(wallet2),
        noneCV()
      ]
    })
    .run();

  console.log("   Simulation ID:", sim4);
  console.log("   View at: https://stxer.xyz/simulations/testnet/" + sim4);
} catch (e) {
  console.log("   Error:", e.message);
}
console.log("");

console.log("=== WELSH TOKEN SIMULATIONS COMPLETE ===");
