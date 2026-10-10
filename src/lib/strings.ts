// All user-facing strings, keyed by locale. English only for now; the routing
// layer is ready for /es, /pt, /tr subdirectories without refactoring.
export type Locale = "en";
export const DEFAULT_LOCALE: Locale = "en";

const en = {
  siteName: "FeeScope",
  tagline: "The fee + funding comparison tool that also explains the math.",
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
  fundingRatesAsOf: "Historical snapshot — rates as of",
  fundingRatesFrozen: "frozen",
  fundingRatesNotLive: "Not a live feed.",
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
    "FeeScope is the fee + funding comparison tool that also explains the math. The tool is the product; content supports it.",
  homeSeoTitle: "FeeScope — crypto funding rate reference",
  homeDescription:
    "Historical crypto funding rates across exchanges. See what funding actually costs you before you pay it.",
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
  fpFundingNow: "funding — snapshot",
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
  // Author page (about/author)
  authorBio1:
    "Sanjar Talaibekovic is an operations and compliance professional who has been working in crypto since the 2017 cycle. He was an operational and compliance manager at ACX (Australian Crypto Exchange) through the 2018 crypto winter, then moved into compliance at Huobi Australia as a Compliance Officer.",
  authorBio2:
    "At ACX, he was part of the team behind one of the first arbitrage crypto trading bots — an automated system that bought and sold across exchanges to capture price differences. That experience shaped everything since: he saw first-hand how much of crypto is noise, how hard it is to find the specific information that matters, and what happens when traders don't understand the rules of the market they're trading. People lost money they couldn't afford to lose.",
  authorBio3: "FeeScope is his answer to that problem.",
  authorWhyHeading: "Why FeeScope exists",
  authorWhy1:
    "The first time you look at a funding rate, you think it's free money. It isn't. That's the thing almost no one explains when you're new — funding is a real cost that compounds, and it's different on every exchange. For an experienced trader, it's a line item. For a new one, it's invisible until it's already been paid.",
  authorWhy2:
    "FeeScope exists to make that cost visible before it's paid, in plain language, for both kinds of traders.",
  authorIsIsntHeading: "What FeeScope is / isn't",
  authorIsLabel: "IS:",
  authorIsntLabel: "ISN'T:",
  authorIs1:
    "A data tool that analyzes historical funding rates across perpetual futures venues, showing what funding actually cost traders over the past year — not just what it costs today.",
  authorIs3: "Free",
  authorIsnt1: "Financial advice",
  authorIsnt2: "A signal service",
  authorIsnt3: "A recommendation engine",
  authorIsnt4: "A promise of returns",
  authorAiHeading: "On AI use",
  authorAiBody:
    "Some code and copy on this site was developed with AI assistance. Every funding rate is pulled directly from public exchange APIs and cross-checked against the source. The methodology is documented in docs/FUNDING_PIPELINE.md.",
  authorAffiliateHeading: "Affiliate disclosure",
  authorAffiliateBody:
    "This site may include affiliate links to exchanges in the future. If you sign up through a link, we may earn a commission at no cost to you. This does not affect which venues are shown or how they're ranked.",
  authorContactHeading: "Contact",
  authorContactBody: "Corrections, questions, or feedback:",
  // Footer email signup (Phase 2)
  signupHeading: "Funding rate updates",
  signupBody: "One email when the live feed launches. No spam.",
  signupPlaceholder: "you@example.com",
  signupButton: "Subscribe",
  signupSuccess: "Thanks — you're on the list.",
  signupError: "Couldn't subscribe — check the email and try again.",
  signupDisclaimer: "Unsubscribe anytime.",
  unsubscribeHeading: "Unsubscribe",
  unsubscribeDone: "You've been unsubscribed from FeeScope updates.",
  unsubscribeError: "That unsubscribe link is invalid or expired.",
} as const;

export type StringKey = keyof typeof en;

const strings: Record<Locale, Record<StringKey, string>> = { en };

export function t(locale: Locale, key: StringKey): string {
  return strings[locale][key];
}

export const tEn = (key: StringKey): string => t(DEFAULT_LOCALE, key);
