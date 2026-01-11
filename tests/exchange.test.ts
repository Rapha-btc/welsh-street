import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("Welsh Street DEX - Basic Simulations", () => {

  describe("Welshcorgicoin Token", () => {
    it("deployer has initial supply of 10B WELSH", () => {
      const { result } = simnet.callReadOnlyFn(
        "welshcorgicoin",
        "get-balance",
        [Cl.principal(deployer)],
        deployer
      );
      // 10B with 6 decimals = 10_000_000_000_000_000
      expect(result).toBeOk(Cl.uint(10_000_000_000_000_000n));
    });

    it("can transfer WELSH between wallets", () => {
      const amount = 1_000_000_000n; // 1000 WELSH

      const { result } = simnet.callPublicFn(
        "welshcorgicoin",
        "transfer",
        [
          Cl.uint(amount),
          Cl.principal(deployer),
          Cl.principal(wallet1),
          Cl.none()
        ],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));

      // Check wallet1 balance
      const { result: balance } = simnet.callReadOnlyFn(
        "welshcorgicoin",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(balance).toBeOk(Cl.uint(amount));
    });

    it("get-name returns Welshcorgicoin", () => {
      const { result } = simnet.callReadOnlyFn(
        "welshcorgicoin",
        "get-name",
        [],
        deployer
      );
      expect(result).toBeOk(Cl.stringAscii("Welshcorgicoin"));
    });

    it("get-symbol returns WELSH", () => {
      const { result } = simnet.callReadOnlyFn(
        "welshcorgicoin",
        "get-symbol",
        [],
        deployer
      );
      expect(result).toBeOk(Cl.stringAscii("WELSH"));
    });

    it("get-decimals returns 6", () => {
      const { result } = simnet.callReadOnlyFn(
        "welshcorgicoin",
        "get-decimals",
        [],
        deployer
      );
      expect(result).toBeOk(Cl.uint(6));
    });
  });

  describe("Street Token", () => {
    it("deployer can mint STREET tokens", () => {
      const amount = 1_000_000_000_000n; // 1M STREET

      const { result } = simnet.callPublicFn(
        "street",
        "street-mint",
        [Cl.uint(amount)],
        deployer
      );
      expect(result).toBeOk(Cl.tuple({
        amount: Cl.uint(amount),
        block: Cl.uint(simnet.burnBlockHeight),
        epoch: Cl.uint(0)
      }));

      // Check deployer balance
      const { result: balance } = simnet.callReadOnlyFn(
        "street",
        "get-balance",
        [Cl.principal(deployer)],
        deployer
      );
      expect(balance).toBeOk(Cl.uint(amount));
    });

    it("non-owner cannot mint STREET tokens", () => {
      const amount = 1_000_000_000n;

      const { result } = simnet.callPublicFn(
        "street",
        "street-mint",
        [Cl.uint(amount)],
        wallet1
      );
      // Should fail with ERR_NOT_CONTRACT_OWNER (u901)
      expect(result).toBeErr(Cl.uint(901));
    });

    it("get-name returns Street", () => {
      const { result } = simnet.callReadOnlyFn(
        "street",
        "get-name",
        [],
        deployer
      );
      expect(result).toBeOk(Cl.stringAscii("Street"));
    });
  });

  describe("Exchange - Liquidity", () => {
    it("deployer can provide initial liquidity", () => {
      // First mint some STREET tokens
      const streetAmount = 100_000_000_000_000n; // 100M STREET
      simnet.callPublicFn("street", "street-mint", [Cl.uint(streetAmount)], deployer);

      // Provide initial liquidity: 1M WELSH + 1M STREET
      const welshAmount = 1_000_000_000_000n; // 1M WELSH
      const streetLiq = 1_000_000_000_000n; // 1M STREET

      const { result } = simnet.callPublicFn(
        "exchange",
        "provide-initial-liquidity",
        [Cl.uint(welshAmount), Cl.uint(streetLiq)],
        deployer
      );

      expect(result).toBeOk(Cl.tuple({
        "added-a": Cl.uint(welshAmount),
        "added-b": Cl.uint(streetLiq),
        "minted-lp": Cl.uint(1_000_000_000_000n) // sqrt(1M * 1M) = 1M LP tokens
      }));
    });

    it("can read exchange info after providing liquidity", () => {
      // First setup liquidity
      const streetAmount = 100_000_000_000_000n;
      simnet.callPublicFn("street", "street-mint", [Cl.uint(streetAmount)], deployer);

      const welshAmount = 1_000_000_000_000n;
      const streetLiq = 1_000_000_000_000n;
      simnet.callPublicFn(
        "exchange",
        "provide-initial-liquidity",
        [Cl.uint(welshAmount), Cl.uint(streetLiq)],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        "exchange",
        "get-exchange-info",
        [],
        deployer
      );

      expect(result).toBeOk(Cl.tuple({
        "avail-a": Cl.uint(welshAmount),
        "avail-b": Cl.uint(streetLiq),
        "fee": Cl.uint(100),
        "locked-a": Cl.uint(0),
        "locked-b": Cl.uint(0),
        "reserve-a": Cl.uint(welshAmount),
        "reserve-b": Cl.uint(streetLiq),
        "revenue": Cl.uint(100),
        "tax": Cl.uint(100)
      }));
    });

    it("non-owner cannot provide initial liquidity", () => {
      const { result } = simnet.callPublicFn(
        "exchange",
        "provide-initial-liquidity",
        [Cl.uint(1000000), Cl.uint(1000000)],
        wallet1
      );
      // Should fail with ERR_NOT_CONTRACT_OWNER (u701)
      expect(result).toBeErr(Cl.uint(701));
    });
  });

  describe("Exchange - Swaps", () => {
    beforeEach(() => {
      // Setup: mint STREET and provide initial liquidity
      const streetAmount = 100_000_000_000_000n;
      simnet.callPublicFn("street", "street-mint", [Cl.uint(streetAmount)], deployer);

      const welshAmount = 10_000_000_000_000n; // 10M WELSH
      const streetLiq = 10_000_000_000_000n; // 10M STREET
      simnet.callPublicFn(
        "exchange",
        "provide-initial-liquidity",
        [Cl.uint(welshAmount), Cl.uint(streetLiq)],
        deployer
      );

      // Transfer some WELSH to wallet1 for testing
      simnet.callPublicFn(
        "welshcorgicoin",
        "transfer",
        [Cl.uint(1_000_000_000_000n), Cl.principal(deployer), Cl.principal(wallet1), Cl.none()],
        deployer
      );
    });

    it("can swap WELSH for STREET (swap-a-b)", () => {
      const swapAmount = 100_000_000_000n; // 100K WELSH

      const { result } = simnet.callPublicFn(
        "exchange",
        "swap-a-b",
        [Cl.uint(swapAmount)],
        wallet1
      );

      // Should succeed and return swap details
      expect(result).toBeOk(Cl.tuple({
        "amount-in": Cl.uint(swapAmount),
        "amount-out": expect.anything(), // Output depends on AMM formula
        "fee-a": expect.anything(),
        "res-a": expect.anything(),
        "res-a-new": expect.anything(),
        "res-b": expect.anything(),
        "res-b-new": expect.anything(),
        "rev-a": expect.anything()
      }));
    });
  });

  describe("Credit Token (LP)", () => {
    it("LP tokens are minted when providing liquidity", () => {
      // Setup
      const streetAmount = 100_000_000_000_000n;
      simnet.callPublicFn("street", "street-mint", [Cl.uint(streetAmount)], deployer);

      const welshAmount = 1_000_000_000_000n;
      const streetLiq = 1_000_000_000_000n;
      simnet.callPublicFn(
        "exchange",
        "provide-initial-liquidity",
        [Cl.uint(welshAmount), Cl.uint(streetLiq)],
        deployer
      );

      // Check LP balance
      const { result } = simnet.callReadOnlyFn(
        "credit",
        "get-balance",
        [Cl.principal(deployer)],
        deployer
      );

      expect(result).toBeOk(Cl.uint(1_000_000_000_000n));
    });

    it("get-total-supply shows total LP minted", () => {
      // Setup
      const streetAmount = 100_000_000_000_000n;
      simnet.callPublicFn("street", "street-mint", [Cl.uint(streetAmount)], deployer);

      const welshAmount = 1_000_000_000_000n;
      const streetLiq = 1_000_000_000_000n;
      simnet.callPublicFn(
        "exchange",
        "provide-initial-liquidity",
        [Cl.uint(welshAmount), Cl.uint(streetLiq)],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        "credit",
        "get-total-supply",
        [],
        deployer
      );

      expect(result).toBeOk(Cl.uint(1_000_000_000_000n));
    });
  });
});
