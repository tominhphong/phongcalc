// Financial math formulas

/** Monthly payment (PMT) */
export function pmt(principal: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/** Generate amortization schedule */
export interface AmortRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  totalInterest: number;
  totalPrincipal: number;
}

export function amortizationSchedule(
  principal: number,
  annualRate: number,
  years: number,
  extraMonthly: number = 0
): AmortRow[] {
  const r = annualRate / 100 / 12;
  const monthlyPmt = pmt(principal, annualRate, years);
  const rows: AmortRow[] = [];
  let balance = principal;
  let totalInterest = 0;
  let totalPrincipal = 0;

  const maxMonths = years * 12;
  for (let m = 1; m <= maxMonths && balance > 0; m++) {
    const interest = balance * r;
    let principalPart = monthlyPmt - interest + extraMonthly;
    if (principalPart > balance) principalPart = balance;
    balance -= principalPart;
    if (balance < 0) balance = 0;
    totalInterest += interest;
    totalPrincipal += principalPart;

    rows.push({
      month: m,
      payment: principalPart + interest,
      principal: principalPart,
      interest,
      balance,
      totalInterest,
      totalPrincipal,
    });
  }
  return rows;
}

/** Max home price based on income */
export function maxHomePrice(
  annualIncome: number,
  monthlyDebt: number,
  downPayment: number,
  annualRate: number,
  years: number,
  dtiRatio: number = 0.36
): number {
  const maxMonthlyPayment = (annualIncome / 12) * dtiRatio - monthlyDebt;
  if (maxMonthlyPayment <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return maxMonthlyPayment * n + downPayment;
  const loanAmount = maxMonthlyPayment * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));
  return loanAmount + downPayment;
}

/** Rent vs Buy cumulative cost over years */
export interface RentVsBuyYear {
  year: number;
  rentCost: number;
  buyCost: number;
}

export function rentVsBuyAnalysis(
  homePrice: number,
  monthlyRent: number,
  downPayment: number,
  annualRate: number,
  years: number,
  annualAppreciation: number = 3,
  annualRentIncrease: number = 3,
  propertyTaxRate: number = 2.2,
  insuranceYearly: number = 1500,
  maintenanceRate: number = 1,
  hoaMonthly: number = 0
): RentVsBuyYear[] {
  const loanAmount = homePrice - downPayment;
  const monthlyMortgage = pmt(loanAmount, annualRate, 30);
  const results: RentVsBuyYear[] = [];
  let cumulativeRent = 0;
  let cumulativeBuy = downPayment;
  let currentRent = monthlyRent;
  let currentHomeValue = homePrice;

  for (let y = 1; y <= years; y++) {
    // Rent costs
    cumulativeRent += currentRent * 12;
    currentRent *= (1 + annualRentIncrease / 100);

    // Buy costs (mortgage + tax + insurance + maintenance + HOA - equity gained)
    const yearlyMortgage = monthlyMortgage * 12;
    const yearlyTax = currentHomeValue * (propertyTaxRate / 100);
    const yearlyMaintenance = currentHomeValue * (maintenanceRate / 100);
    const yearlyHoa = hoaMonthly * 12;
    cumulativeBuy += yearlyMortgage + yearlyTax + insuranceYearly + yearlyMaintenance + yearlyHoa;

    // Home appreciation
    currentHomeValue *= (1 + annualAppreciation / 100);

    results.push({
      year: y,
      rentCost: cumulativeRent,
      buyCost: cumulativeBuy - (currentHomeValue - homePrice), // subtract equity gain
    });
  }
  return results;
}

/** Seller net proceeds */
export function sellerNetProceeds(
  salePrice: number,
  mortgageBalance: number,
  commissionPct: number = 6,
  closingCosts: number = 0,
  repairCosts: number = 0,
  transferTax: number = 0
): { proceeds: number; totalCosts: number; commission: number } {
  const commission = salePrice * (commissionPct / 100);
  const totalCosts = commission + closingCosts + repairCosts + transferTax;
  const proceeds = salePrice - mortgageBalance - totalCosts;
  return { proceeds, totalCosts, commission };
}

/** Buyer closing costs estimate */
export function buyerClosingCosts(
  purchasePrice: number,
  downPaymentPct: number = 20,
  loanOriginationPct: number = 1,
  appraisalFee: number = 500,
  inspectionFee: number = 400,
  titleInsurance: number = 1000,
  escrowFee: number = 800,
  recordingFee: number = 200,
  prepaidTaxMonths: number = 3,
  prepaidInsuranceMonths: number = 14,
  propertyTaxRate: number = 2.2,
  annualInsurance: number = 1500
): { totalClosing: number; cashToClose: number; items: { label: string; amount: number }[] } {
  const downPayment = purchasePrice * (downPaymentPct / 100);
  const loanAmount = purchasePrice - downPayment;
  const origination = loanAmount * (loanOriginationPct / 100);
  const prepaidTax = (purchasePrice * propertyTaxRate / 100 / 12) * prepaidTaxMonths;
  const prepaidInsurance = (annualInsurance / 12) * prepaidInsuranceMonths;

  const items = [
    { label: 'Phí khởi tạo khoản vay', amount: origination },
    { label: 'Phí thẩm định', amount: appraisalFee },
    { label: 'Phí kiểm tra nhà', amount: inspectionFee },
    { label: 'Bảo hiểm quyền sở hữu', amount: titleInsurance },
    { label: 'Phí ký quỹ', amount: escrowFee },
    { label: 'Phí ghi danh', amount: recordingFee },
    { label: 'Thuế trả trước', amount: prepaidTax },
    { label: 'Bảo hiểm trả trước', amount: prepaidInsurance },
  ];

  const totalClosing = items.reduce((sum, i) => sum + i.amount, 0);
  const cashToClose = downPayment + totalClosing;

  return { totalClosing, cashToClose, items };
}

/** Investment cashflow */
export function investmentCashflow(
  homePrice: number,
  downPaymentPct: number,
  annualRate: number,
  years: number,
  monthlyRent: number,
  vacancyPct: number = 5,
  managementPct: number = 10,
  monthlyInsurance: number = 125,
  monthlyTax: number = 400,
  monthlyMaintenance: number = 150,
  monthlyHoa: number = 0
): { monthlyCashflow: number; annualReturn: number; expenses: { label: string; amount: number }[]; income: number } {
  const downPayment = homePrice * (downPaymentPct / 100);
  const loanAmount = homePrice - downPayment;
  const monthlyMortgage = pmt(loanAmount, annualRate, years);
  const effectiveRent = monthlyRent * (1 - vacancyPct / 100);
  const managementFee = effectiveRent * (managementPct / 100);

  const expenses = [
    { label: 'Trả góp hàng tháng', amount: monthlyMortgage },
    { label: 'Thuế BĐS', amount: monthlyTax },
    { label: 'Bảo hiểm', amount: monthlyInsurance },
    { label: 'Bảo trì', amount: monthlyMaintenance },
    { label: 'Phí quản lý', amount: managementFee },
    { label: 'HOA', amount: monthlyHoa },
  ];

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const monthlyCashflow = effectiveRent - totalExpenses;
  const annualReturn = downPayment > 0 ? (monthlyCashflow * 12) / downPayment * 100 : 0;

  return { monthlyCashflow, annualReturn, expenses, income: effectiveRent };
}
