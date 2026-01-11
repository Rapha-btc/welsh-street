/**
 * Welsh Street DEX - Stxer Simulations
 *
 * Run all simulations: npm run simul
 * Run specific: npm run simul:welsh, npm run simul:exchange
 *
 * View results at: https://stxer.xyz/simulations/testnet/{simulationId}
 */

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║         WELSH STREET DEX - STXER SIMULATIONS               ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

// Import and run all simulations
await import("./welsh-token.js");
console.log("\n" + "─".repeat(60) + "\n");

await import("./exchange.js");

console.log("\n╔════════════════════════════════════════════════════════════╗");
console.log("║              ALL SIMULATIONS COMPLETE                      ║");
console.log("╚════════════════════════════════════════════════════════════╝");
