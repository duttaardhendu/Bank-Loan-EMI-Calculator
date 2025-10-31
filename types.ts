
export interface AmortizationEntry {
  month: number;
  principal: number;
  interest: number;
  totalPayment: number;
  remainingBalance: number;
  date: Date;
}

export type CalculableField = 'loanAmount' | 'interestRate' | 'tenure' | 'emi';

export interface LoanDetails {
  loanAmount: string;
  interestRate: string;
  tenureMonths: string;
  emi: string;
  startDate: string;
  endDate: string;
}
