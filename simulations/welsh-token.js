import { SimulationBuilder } from "stxer";
import { uintCV, principalCV, noneCV } from "@stacks/transactions";
import { readFileSync } from "fs";

// Load contract source
const welshcorgicoinSource = readFileSync("./contracts/welshcorgicoin.clar", "utf8");

// Use mainnet addresses since contracts reference mainnet SIP-010 trait
const deployer = "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE"; // mainnet (SIP-010 owner)
const wallet1 = "SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G"; // welshcorgicoin owner
const wallet2 = "SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1";

console.log("=== WELSH TOKEN STXER SIMULATIONS (MAINNET) ===\n");

// Simulation 1: Deploy contract and check balance
console.log("1. Deploy welshcorgicoin and check deployer balance...");
try {
  const sim1 = await SimulationBuilder.new({ network: "mainnet" })
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
  console.log("   View at: https://stxer.xyz/simulations/mainnet/" + sim1);
} catch (e) {
  console.log("   Error:", e.message);
}
console.log("");

// Simulation 2: Transfer tokens
console.log("2. Transfer WELSH tokens...");
try {
  const transferAmount = 1000_000_000n; // 1000 WELSH

  const sim2 = await SimulationBuilder.new({ network: "mainnet" })
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
  console.log("   View at: https://stxer.xyz/simulations/mainnet/" + sim2);
} catch (e) {
  console.log("   Error:", e.message);
}
console.log("");

// Simulation 3: Get token metadata
console.log("3. Check token metadata...");
try {
  const sim3 = await SimulationBuilder.new({ network: "mainnet" })
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
  console.log("   View at: https://stxer.xyz/simulations/mainnet/" + sim3);
} catch (e) {
  console.log("   Error:", e.message);
}
console.log("");

// Simulation 4: Unauthorized transfer
console.log("4. Unauthorized transfer attempt (expect err)...");
try {
  const sim4 = await SimulationBuilder.new({ network: "mainnet" })
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
        principalCV(deployer),
        principalCV(wallet2),
        noneCV()
      ]
    })
    .run();

  console.log("   Simulation ID:", sim4);
  console.log("   View at: https://stxer.xyz/simulations/mainnet/" + sim4);
} catch (e) {
  console.log("   Error:", e.message);
}
console.log("");

console.log("=== WELSH TOKEN SIMULATIONS COMPLETE ===");
