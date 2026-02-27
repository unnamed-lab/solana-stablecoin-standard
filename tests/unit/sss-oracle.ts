import { expect } from "chai";
import { OraclePresets, FeedType, PRICE_SCALE, CPI_SCALE } from "../../sdk/src/modules/oracle";

describe("OracleModule SDK — Pure TS Math Simulation", () => {
  const oracle = OraclePresets.brl(); // uses BRL as preset, but math is universal

  it("Simulates Direct feed (EUR/USD) mint quote correctly", () => {
    // Deposit $108.00 (10,800 cents) at EUR/USD = 1.08 (1,080,000 scaled)
    // Should return 100 EURUSD tokens, minus fee.
    // Fee = 30 bps (0.3%)
    const usdCents = 10_800; // $108.00
    const priceScaled = 1_080_000; // 1.08
    const feeBps = 30; // 0.3%

    const result = oracle.simulateMintQuote(usdCents, priceScaled, FeedType.Direct, feeBps);

    // Gross should be exactly 100 tokens * 10^6
    expect(result.gross).to.equal(100_000_000);
    // Fee should be 0.3% of 100_000_000 = 300_000
    expect(result.fee).to.equal(300_000);
    // Net should be 99_700_000
    expect(result.net).to.equal(99_700_000);
    expect(result.priceHuman).to.equal(1.08);
  });

  it("Simulates Inverse feed (BRL/USD) mint quote correctly", () => {
    // Deposit $100.00 (10,000 cents) at BRL/USD = 5.72 (5,720_000 scaled)
    // Should return 572 BRLUSD tokens, minus fee. 
    // Fee = 50 bps (0.5%)
    const usdCents = 10_000; // $100.00
    const priceScaled = 5_720_000; // 5.72
    const feeBps = 50; // 0.5%

    const result = oracle.simulateMintQuote(usdCents, priceScaled, FeedType.Inverse, feeBps);

    // Gross should be exactly 572 tokens * 10^6 = 572_000_000
    expect(result.gross).to.equal(572_000_000);
    // Fee should be 0.5% of 572_000_000 = 2_860_000
    expect(result.fee).to.equal(2_860_000);
    // Net should be 569_140_000
    expect(result.net).to.equal(569_140_000);
    expect(result.priceHuman).to.equal(5.72);
  });

  it("Simulates CpiIndexed feed mint quote correctly", () => {
    // Deposit $108.30 (10,830 cents) at CPI Multiplier = 1.083 (1,083_000 scaled)
    // Should return exactly 100 tokens.
    const usdCents = 10_830; // $108.30
    const priceScaled = PRICE_SCALE; // Unused for CPI
    const cpiMult = 1_083_000; // 1.083
    const feeBps = 0; // 0% fee

    const result = oracle.simulateMintQuote(usdCents, priceScaled, FeedType.CpiIndexed, feeBps, cpiMult);

    expect(result.gross).to.equal(100_000_000);
    expect(result.fee).to.equal(0);
    expect(result.net).to.equal(100_000_000);
  });

  it("Simulates Inverse feed (BRL/USD) redeem quote correctly", () => {
    // Redeem 572 tokens at BRL/USD = 5.72
    // Should return $100.00 (10,000 cents), minus 0.3% fee
    const tokenAmount = 572_000_000;
    const priceScaled = 5_720_000;
    const feeBps = 30; // 0.3%

    const result = oracle.simulateRedeemQuote(tokenAmount, priceScaled, FeedType.Inverse, feeBps);

    // Gross should be exactly $100.00 (10,000 cents)
    expect(result.gross).to.equal(10_000);
    // Fee = 0.3% of 10_000 = 30
    expect(result.fee).to.equal(30);
    // Net = 9_970 ($99.70)
    expect(result.net).to.equal(9_970);
  });

  it("Simulates Direct feed (EUR/USD) redeem quote correctly", () => {
    // Redeem 100 EURUSD tokens at EUR/USD = 1.08
    // Should return $108.00 (10,800 cents)
    const tokenAmount = 100_000_000;
    const priceScaled = 1_080_000;
    const feeBps = 0;

    const result = oracle.simulateRedeemQuote(tokenAmount, priceScaled, FeedType.Direct, feeBps);

    expect(result.gross).to.equal(10_800);
  });
});
