// ─── Cash Flow Calculations ───────────────────────────────────────────────────

export function calculateCashFlow(inputs) {
  const {
    purchasePrice,
    downPaymentPercent,
    interestRate,
    loanTerm,
    grossRentalIncome,
    vacancyRate,
    taxes,
    insurance,
    management,
    maintenance,
    capexReserve,
    rentGrowthYear1 = 0,
    rentGrowthYear2 = 0,
    rentGrowthYear3 = 0,
    rentGrowthYear4 = 0,
    rentGrowthYear5 = 0,
  } = inputs;

  const pp = parseFloat(purchasePrice);
  const downPct = parseFloat(downPaymentPercent) / 100;
  const rate = parseFloat(interestRate) / 100;
  const term = parseInt(loanTerm);
  const gri = parseFloat(grossRentalIncome);
  const vacPct = parseFloat(vacancyRate) / 100;

  // Loan calculations
  const downPayment = pp * downPct;
  const loanAmount = pp - downPayment;
  const monthlyRate = rate / 12;
  const nPayments = term * 12;

  // Monthly mortgage payment (P&I)
  const monthlyPayment = loanAmount > 0
    ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, nPayments)) /
      (Math.pow(1 + monthlyRate, nPayments) - 1)
    : 0;
  const annualDebtService = monthlyPayment * 12;

  // Year 1 operating calculations
  const effectiveGrossIncome = gri * (1 - vacPct);
  const totalOpex = parseFloat(taxes || 0) + parseFloat(insurance || 0) +
    parseFloat(management || 0) + parseFloat(maintenance || 0) + parseFloat(capexReserve || 0);
  const noi = effectiveGrossIncome - totalOpex;
  const cashFlowAfterDebt = noi - annualDebtService;

  // Key metrics
  const capRate = pp > 0 ? (noi / pp) * 100 : 0;
  const cashOnCash = downPayment > 0 ? (cashFlowAfterDebt / downPayment) * 100 : 0;
  const dscr = annualDebtService > 0 ? noi / annualDebtService : 0;
  const grm = gri > 0 ? pp / gri : 0;

  // 5-year projection
  const rentGrowthRates = [
    parseFloat(rentGrowthYear1) / 100,
    parseFloat(rentGrowthYear2) / 100,
    parseFloat(rentGrowthYear3) / 100,
    parseFloat(rentGrowthYear4) / 100,
    parseFloat(rentGrowthYear5) / 100,
  ];

  const yearlyProjections = [];
  let currentGRI = gri;
  let cumulativeCashFlow = -downPayment;
  let remainingBalance = loanAmount;

  for (let yr = 1; yr <= 5; yr++) {
    if (yr > 1) {
      currentGRI = currentGRI * (1 + rentGrowthRates[yr - 2]);
    }
    const yearEGI = currentGRI * (1 - vacPct);
    const yearNOI = yearEGI - totalOpex;
    const yearCFAD = yearNOI - annualDebtService;

    // Principal paydown this year
    let yearPrincipalPaydown = 0;
    for (let m = 0; m < 12; m++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      yearPrincipalPaydown += principalPayment;
      remainingBalance -= principalPayment;
    }

    cumulativeCashFlow += yearCFAD;

    yearlyProjections.push({
      year: yr,
      grossRentalIncome: Math.round(currentGRI),
      effectiveGrossIncome: Math.round(yearEGI),
      operatingExpenses: Math.round(totalOpex),
      noi: Math.round(yearNOI),
      debtService: Math.round(annualDebtService),
      cashFlowAfterDebt: Math.round(yearCFAD),
      principalPaydown: Math.round(yearPrincipalPaydown),
      capRate: pp > 0 ? ((yearNOI / pp) * 100).toFixed(2) : 0,
      cashOnCash: downPayment > 0 ? ((yearCFAD / downPayment) * 100).toFixed(2) : 0,
    });
  }

  // IRR calculation (5-year hold, no sale - using cash flows only)
  const cashFlows = [-downPayment, ...yearlyProjections.map(y => y.cashFlowAfterDebt)];
  const irr = calculateIRR(cashFlows);

  // Equity multiple (5-year, including equity paydown)
  const totalEquityIn = downPayment;
  const totalCashReturned = yearlyProjections.reduce((sum, y) => sum + y.cashFlowAfterDebt, 0);
  const equityPaydown = loanAmount - remainingBalance;
  const equityMultiple = totalEquityIn > 0
    ? ((totalCashReturned + equityPaydown) / totalEquityIn)
    : 0;

  return {
    // Summary metrics
    loanAmount: Math.round(loanAmount),
    downPayment: Math.round(downPayment),
    monthlyPayment: Math.round(monthlyPayment),
    annualDebtService: Math.round(annualDebtService),
    effectiveGrossIncome: Math.round(effectiveGrossIncome),
    totalOperatingExpenses: Math.round(totalOpex),
    noi: Math.round(noi),
    cashFlowAfterDebt: Math.round(cashFlowAfterDebt),
    capRate: parseFloat(capRate.toFixed(2)),
    cashOnCash: parseFloat(cashOnCash.toFixed(2)),
    dscr: parseFloat(dscr.toFixed(2)),
    grm: parseFloat(grm.toFixed(1)),
    irr: parseFloat((irr * 100).toFixed(2)),
    equityMultiple: parseFloat(equityMultiple.toFixed(2)),
    yearlyProjections,
  };
}

// Newton-Raphson IRR solver
function calculateIRR(cashFlows, guess = 0.1) {
  const MAX_ITER = 1000;
  const TOLERANCE = 1e-6;
  let rate = guess;

  for (let i = 0; i < MAX_ITER; i++) {
    let npv = 0;
    let dnpv = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + rate, t);
      if (t > 0) dnpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
    }

    const newRate = rate - npv / dnpv;

    if (Math.abs(newRate - rate) < TOLERANCE) return newRate;
    rate = newRate;
  }

  return rate;
}
