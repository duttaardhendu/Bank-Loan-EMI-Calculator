
import { AmortizationEntry } from '../types';

export const calculateEMI = (principal: number, annualRate: number, tenureMonths: number): number => {
  if (principal <= 0 || annualRate <= 0 || tenureMonths <= 0) return 0;
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) return principal / tenureMonths;
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return emi;
};

export const calculateLoanAmount = (emi: number, annualRate: number, tenureMonths: number): number => {
  if (emi <= 0 || annualRate <= 0 || tenureMonths <= 0) return 0;
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) return emi * tenureMonths;
  const loanAmount =
    (emi * (Math.pow(1 + monthlyRate, tenureMonths) - 1)) /
    (monthlyRate * Math.pow(1 + monthlyRate, tenureMonths));
  return loanAmount;
};

export const calculateTenure = (principal: number, annualRate: number, emi: number): number => {
    if (principal <= 0 || annualRate <= 0 || emi <= 0) return 0;
    const monthlyRate = annualRate / 12 / 100;
    if (principal * monthlyRate >= emi) return Infinity; // Loan will never be paid off
    const tenure = Math.log(emi / (emi - principal * monthlyRate)) / Math.log(1 + monthlyRate);
    return tenure;
};


export const generateAmortizationSchedule = (
    loanAmount: number,
    annualRate: number,
    tenureMonths: number,
    emi: number,
    startDateStr: string
): AmortizationEntry[] => {
  if (loanAmount <= 0 || annualRate < 0 || tenureMonths <= 0 || emi <= 0) return [];

  const schedule: AmortizationEntry[] = [];
  let remainingBalance = loanAmount;
  const monthlyRate = annualRate / 12 / 100;
  const [startYear, startMonth] = startDateStr.split('-').map(Number);

  for (let i = 1; i <= Math.ceil(tenureMonths) && remainingBalance > 0; i++) {
    const interest = remainingBalance * monthlyRate;
    let principal = emi - interest;
    
    // Adjust final payment
    if (remainingBalance < emi) {
        principal = remainingBalance;
        emi = remainingBalance + interest;
    }
    
    remainingBalance -= principal;

    // To prevent negative balance due to floating point inaccuracies
    if (remainingBalance < 0) {
        principal += remainingBalance;
        remainingBalance = 0;
    }
    
    const currentDate = new Date(startYear, startMonth - 1 + (i-1), 1);

    schedule.push({
      month: i,
      principal: principal,
      interest: interest,
      totalPayment: emi,
      remainingBalance: remainingBalance,
      date: currentDate,
    });
  }

  return schedule;
};
