// ─── Debt Sizing Calculations ─────────────────────────────────────────────────

export function calculateDebtMetrics(inputs) {
  const {
    noi,
    purchasePrice,
    requestedLtv,
    loanTerm,
    amortization,
  } = inputs;

  const noiVal = parseFloat(noi);
  const price = parseFloat(purchasePrice);
  const ltv = parseFloat(requestedLtv) / 100;
  const term = parseInt(loanTerm);
  const amort = parseInt(amortization);

  // Standard CRE underwriting rates by property type (approximate current market)
  // In production these would come from a market data feed
  const BENCHMARK_RATE = 0.065; // 6.5% — adjust as needed

  // Loan amount based on requested LTV
  const ltvBasedLoan = price * ltv;

  // Sizing via DSCR constraint (min 1.25x)
  const minDSCR = 1.25;
  const monthlyRate = BENCHMARK_RATE / 12;
  const nPayments = amort * 12;

  // Max payment that maintains min DSCR
  const maxAnnualPayment = noiVal / minDSCR;
  const maxMonthlyPayment = maxAnnualPayment / 12;

  // Max loan via DSCR
  const dscrBasedLoan = monthlyRate > 0
    ? (maxMonthlyPayment * (1 - Math.pow(1 + monthlyRate, -nPayments))) / monthlyRate
    : maxMonthlyPayment * nPayments;

  // Max loan is lesser of LTV-based and DSCR-based
  const maxLoanAmount = Math.min(ltvBasedLoan, dscrBasedLoan);
  const actualLtv = price > 0 ? (maxLoanAmount / price) * 100 : 0;

  // Annual debt service on max loan
  const monthlyPayment = monthlyRate > 0
    ? (maxLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, nPayments)) /
      (Math.pow(1 + monthlyRate, nPayments) - 1)
    : maxLoanAmount / nPayments;
  const annualDebtService = monthlyPayment * 12;

  // Actual DSCR
  const actualDscr = annualDebtService > 0 ? noiVal / annualDebtService : 0;

  // Debt yield
  const debtYield = maxLoanAmount > 0 ? (noiVal / maxLoanAmount) * 100 : 0;

  // Implied cap rate
  const capRate = price > 0 ? (noiVal / price) * 100 : 0;

  return {
    maxLoanAmount: Math.round(maxLoanAmount),
    actualLtv: parseFloat(actualLtv.toFixed(1)),
    requestedLtv: parseFloat(requestedLtv),
    dscr: parseFloat(actualDscr.toFixed(2)),
    debtYield: parseFloat(debtYield.toFixed(2)),
    capRate: parseFloat(capRate.toFixed(2)),
    annualDebtService: Math.round(annualDebtService),
    monthlyPayment: Math.round(monthlyPayment),
    benchmarkRate: (BENCHMARK_RATE * 100).toFixed(2),
    constrainedBy: maxLoanAmount === ltvBasedLoan ? 'LTV' : 'DSCR',
  };
}
