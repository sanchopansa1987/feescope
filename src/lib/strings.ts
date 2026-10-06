// All user-facing strings, keyed by locale. English only for now; the routing
// layer is ready for /es, /pt, /tr subdirectories without refactoring.
export type Locale = "en";
export const DEFAULT_LOCALE: Locale = "en";

const en = {
  siteName: "FeeScope",
  tagline: "The live fee + funding comparison tool that also explains the math.",
  navFundingRates: "Funding Rates",
  navFees: "Fees",
  navAbout: "About",
  homeTitle: "FeeScope",
  fundingRatesTitle: "Funding Rates",
  fundingRatesLede:
    "Perp funding rates across the tracked universe. Historical frozen data for Phase 1; a live feed replaces it in Phase 2.",
  fundingRatesColSymbol: "Symbol",
  fundingRatesColCadence: "Cadence",
  fundingRatesColRate: "Funding rate",
  fundingRatesColApr: "Annualized APR",
  fundingRatesCol7d: "7d mean",
  fundingRatesCol30d: "30d mean",
  fundingRatesColUpdated: "Last updated",
  feesTitle: "Fee Calculator",
  feesLede: "What your trading volume actually costs per exchange, at VIP-0 futures rates.",
  feesLabelAccount: "Account size (USD)",
  feesLabelVolume: "Monthly volume (USD)",
  feesLabelMaker: "Maker ratio (0–1)",
  feesColExchange: "Exchange",
  feesColTaker: "Taker",
  feesColMaker: "Maker",
  feesColBlended: "Blended",
  feesColMonthly: "Monthly fee",
  feesColAnnual: "Annual fee",
  aboutTitle: "About",
  aboutBody:
    "FeeScope is the live fee + funding comparison tool that also explains the math. The tool is the product; content supports it.",
  homeSeoTitle: "FeeScope — live funding rates across crypto exchanges",
  homeDescription:
    "Live crypto funding rates across exchanges. See what funding actually costs you before you pay it.",
  fundingRatesSeoTitle: "Funding rate comparison — FeeScope",
  fundingRatesDescription:
    "Compare perpetual funding rates across OKX, MEXC, Hyperliquid, Gate.io, and Bitget. The full table.",
  feesSeoTitle: "Crypto exchange fees — FeeScope",
  feesDescription:
    "Crypto exchange fee comparison — spot and perpetual taker fees across major venues.",
  aboutSeoTitle: "About — FeeScope",
  aboutDescription: "About FeeScope — the crypto funding rate comparison tool.",
  notFound: "That page doesn't exist.",
  backHome: "Back home",
  disclosure:
    "Affiliate disclosure: this site may earn referral commissions from linked exchanges. No affiliate links are currently active.",
  fpLong: "If you're LONG",
  fpShort: "If you're SHORT",
  fpPaying: "you're paying",
  fpEarning: "you're earning",
  fpBestLong: "Best venue for longs",
  fpBestShort: "Best venue for shorts",
  fpStabilityUnknown: "Stability data pending",
  fpSeeTable: "See full venue table ↓",
  fpNewToFunding: "New to funding rates? Here's what this means.",
  fpPlainLanguage:
    "A funding rate is a small periodic payment between traders on a perpetual futures contract. When it's positive, longs pay shorts; when negative, shorts pay longs. It exists to keep the perpetual price close to the spot price.",
  fpTableTitle: "Full venue breakdown",
  fpColVenue: "Venue",
  fpColRaw: "Raw funding",
  fpColNetLong: "Net APR (long)",
  fpColNetShort: "Net APR (short)",
  fpColStability: "30d stability",
  fpColVolume: "Volume",
  fpNetAprTooltip:
    "Raw funding minus estimated fees for entering and exiting.",
  fpChartTitle: "Funding rate — last 30 days",
  fpChartPending: "30-day history chart coming with the live feed.",
  fpHowItWorks: "How it works",
  fpWhatIsFunding: "What is funding?",
  fpWhatIsFundingBody:
    "Funding is a periodic payment between longs and shorts, set by the market to keep perpetual prices near spot. You pay or receive it depending on which side you hold.",
  fpWhyMatters: "Why does it matter?",
  fpWhyMattersBody:
    "A high funding rate is a slow drain on one side and a slow income on the other. Over days and weeks, it can outweigh a small price move — so it belongs in every position decision.",
  fpWhatIsNetApr: "What is net APR?",
  fpWhatIsNetAprBody:
    "Raw funding annualized, minus the round-trip trading fees you pay to enter and exit. This is the number that actually hits your account.",
  fpWhatIsStability: "What is stability?",
  fpWhatIsStabilityBody:
    "How consistently the funding has pointed the same direction over the last 30 days. A stable rate is more predictable; a volatile one can flip your cost suddenly.",
  fpAlertsCta: "Get alerts when funding rates change",
  fpAlertsPlaceholder: "Email capture coming soon",
  fpVenueTableId: "venue-table",
  fpColMark: "Mark price",
  fpStable: "STABLE",
  fpModerate: "MODERATE",
  fpVolatile: "VOLATILE",
  fpStableFor: "Stable for",
  fpStableOfLast: "of last",
  fpStableDays: "days",
  fpFundingNow: "funding — now",
  fpPerYear: "/year per $1,000 position",
  fpCheapestLong: "Cheapest venue to LONG",
  fpBestShort: "Best venue to SHORT",
  fpStabilityHeading: "Stability",
  fpCalcTitle: "Project your funding cost",
  fpCalcSize: "Position size",
  fpCalcPeriod: "Holding period",
  fpCalcDirection: "Direction",
  fpCalcLong: "Long",
  fpCalcShort: "Short",
  fpCalcFees: "Include round-trip fees",
  fpCalcPay: "pay",
  fpCalcEarn: "earn",
  fpColFundingApr: "Funding APR",
  fpFundingAprTooltip: "Annualized funding rate. Positive = longs pay, shorts earn.",
  fpProjCost: "Proj. cost",
  fpProjCostTooltip: "Based on your calculator settings above.",
  fpChartComing: "30-day funding history coming soon.",
  fpHowCostsMoney: "How does funding cost you money?",
  fpHowCostsMoneyBody:
    "If you hold a long position and funding is positive, you pay it every settlement. A short earns it instead. At 10% APR, a $10,000 long pays about $83 a month — real money, not a paper metric.",
  fpWhyVenuesDiffer: "Why do venues charge different rates?",
  fpWhyVenuesDifferBody:
    "Each exchange sets its own funding from its own order book. The same ETH perp can be 1.77% APR on one venue and 10.32% on another — the difference between paying $15 and $86 a month on $10,000.",
  fpSettlements: "settlements",
  fpPositive: "positive",
  fpNegative: "negative",
  fpDataPending: "data pending",
} as const;

export type StringKey = keyof typeof en;

const strings: Record<Locale, Record<StringKey, string>> = { en };

export function t(locale: Locale, key: StringKey): string {
  return strings[locale][key];
}

export const tEn = (key: StringKey): string => t(DEFAULT_LOCALE, key);
