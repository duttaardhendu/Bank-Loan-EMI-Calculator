
import React, { useState, useEffect, useCallback } from 'react';
import LoanInput from './components/LoanInput';
import AmortizationTable from './components/AmortizationTable';
import SummaryCard from './components/SummaryCard';
import { AmortizationEntry, CalculableField, LoanDetails } from './types';
import { calculateEMI, calculateLoanAmount, calculateTenure, generateAmortizationSchedule } from './services/loanCalculator';
import { RupeeIcon, PercentIcon, ClockIcon, CalendarIcon } from './constants';

const App: React.FC = () => {
    const [loanAmount, setLoanAmount] = useState<string>('2500000');
    const [interestRate, setInterestRate] = useState<string>('9.55');
    const [tenureYears, setTenureYears] = useState<string>('10');
    const [tenureMonths, setTenureMonths] = useState<string>('120');
    const [emi, setEmi] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('2015-01');
    const [endDate, setEndDate] = useState<string>('');
    
    const [lastEdited, setLastEdited] = useState<CalculableField | 'tenureYears' | null>('tenureYears');

    const [amortizationSchedule, setAmortizationSchedule] = useState<AmortizationEntry[]>([]);
    const [summary, setSummary] = useState({ totalPayment: 0, totalInterest: 0 });

    const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, field: CalculableField | 'tenureYears') => (e: React.ChangeEvent<HTMLInputElement>) => {
        setter(e.target.value);
        setLastEdited(field);
    };

    const handleReset = () => {
        setLoanAmount('');
        setInterestRate('');
        setTenureYears('');
        setTenureMonths('');
        setEmi('');
        setStartDate(new Date().toISOString().slice(0, 7));
        setEndDate('');
        setAmortizationSchedule([]);
        setSummary({ totalPayment: 0, totalInterest: 0 });
        setLastEdited(null);
    };

    // Sync tenure years and months
    useEffect(() => {
        if (lastEdited === 'tenureYears') {
            const years = parseFloat(tenureYears);
            if (!isNaN(years) && years > 0) {
                setTenureMonths(String(Math.round(years * 12)));
            }
        }
    }, [tenureYears, lastEdited]);

    useEffect(() => {
        if (lastEdited === 'tenure') {
            const months = parseInt(tenureMonths, 10);
            if (!isNaN(months) && months > 0) {
                setTenureYears((months / 12).toFixed(2));
            }
        }
    }, [tenureMonths, lastEdited]);

    const runCalculations = useCallback(() => {
        const p = parseFloat(loanAmount);
        const r = parseFloat(interestRate);
        const n = parseInt(tenureMonths, 10);
        const e = parseFloat(emi);

        const validInputs = {
            loanAmount: !isNaN(p) && p > 0,
            interestRate: !isNaN(r) && r > 0,
            tenure: !isNaN(n) && n > 0,
            emi: !isNaN(e) && e > 0
        };

        const validCount = Object.values(validInputs).filter(Boolean).length;

        if (validCount >= 3) {
            let calculatedEmi = e;
            let calculatedTenure = n;
            let finalP = p;

            if (validInputs.loanAmount && validInputs.interestRate && validInputs.tenure && lastEdited !== 'emi') {
                const newEmi = calculateEMI(p, r, n);
                setEmi(newEmi > 0 ? newEmi.toFixed(2) : '');
                calculatedEmi = newEmi;
            } else if (validInputs.loanAmount && validInputs.interestRate && validInputs.emi && lastEdited !== 'tenure' && lastEdited !== 'tenureYears') {
                const newTenure = calculateTenure(p, r, e);
                if (isFinite(newTenure) && newTenure > 0) {
                    const newTenureMonths = Math.ceil(newTenure);
                    setTenureMonths(newTenureMonths.toString());
                    setTenureYears((newTenureMonths / 12).toFixed(2));
                    calculatedTenure = newTenureMonths;
                } else {
                    setTenureMonths('');
                    setTenureYears('');
                }
            } else if (validInputs.interestRate && validInputs.tenure && validInputs.emi && lastEdited !== 'loanAmount') {
                const newAmount = calculateLoanAmount(e, r, n);
                setLoanAmount(newAmount > 0 ? newAmount.toFixed(2) : '');
                finalP = newAmount;
            }

            // Generate schedule and summary after calculations
            const finalR = parseFloat(interestRate);
            
            if (!isNaN(finalP) && finalP > 0 && !isNaN(finalR) && finalR > 0 && !isNaN(calculatedTenure) && calculatedTenure > 0 && !isNaN(calculatedEmi) && calculatedEmi > 0 && startDate) {
                const schedule = generateAmortizationSchedule(finalP, finalR, calculatedTenure, calculatedEmi, startDate);
                setAmortizationSchedule(schedule);

                if (schedule.length > 0) {
                    const totalPayment = schedule.reduce((acc, item) => acc + item.totalPayment, 0);
                    const totalInterest = schedule.reduce((acc, item) => acc + item.interest, 0);
                    setSummary({ totalPayment, totalInterest });

                    const [startYear, startMonth] = startDate.split('-').map(Number);
                    const endDateObj = new Date(startYear, startMonth - 1 + schedule.length - 1, 1);
                    setEndDate(endDateObj.toLocaleString('default', { month: 'long', year: 'numeric' }));
                } else {
                    setAmortizationSchedule([]);
                    setSummary({ totalPayment: 0, totalInterest: 0 });
                    setEndDate('');
                }
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loanAmount, interestRate, tenureMonths, emi, lastEdited, startDate]);
    
    useEffect(() => {
        runCalculations();
    }, [runCalculations]);

    const loanDetails: LoanDetails = {
        loanAmount,
        interestRate,
        tenureMonths,
        emi,
        startDate,
        endDate,
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800">Advanced Loan Calculator</h1>
                    <p className="mt-2 text-lg text-gray-600">Enter your loan details and see the magic happen!</p>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Loan Parameters</h2>
                        <div className="space-y-6">
                            <LoanInput id="loanAmount" label="Loan Amount" value={loanAmount} onChange={handleInputChange(setLoanAmount, 'loanAmount')} placeholder="e.g., 2500000" type="number" icon={<RupeeIcon />} />
                            <LoanInput id="interestRate" label="Annual Interest Rate" value={interestRate} onChange={handleInputChange(setInterestRate, 'interestRate')} placeholder="e.g., 9.55" type="number" icon={<PercentIcon />} unit="%" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <LoanInput id="tenureYears" label="Tenure (Years)" value={tenureYears} onChange={handleInputChange(setTenureYears, 'tenureYears')} placeholder="e.g., 10" type="number" icon={<ClockIcon />} />
                                <LoanInput id="tenureMonths" label="Tenure (Months)" value={tenureMonths} onChange={handleInputChange(setTenureMonths, 'tenure')} placeholder="e.g., 120" type="number" />
                            </div>
                            <LoanInput id="emi" label="Monthly EMI" value={emi} onChange={handleInputChange(setEmi, 'emi')} placeholder="Calculated automatically" type="number" icon={<RupeeIcon />} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                                <LoanInput id="startDate" label="Loan Start Date" value={startDate} onChange={(e) => setStartDate(e.target.value)} type="month" icon={<CalendarIcon />} />
                                <div className="flex flex-col">
                                    <label className="mb-2 font-semibold text-gray-700">Loan End Date</label>
                                    <div className="w-full px-3 py-2 text-gray-500 bg-gray-100 border border-gray-300 rounded-md h-[42px] flex items-center">
                                        {endDate || 'Calculated'}
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleReset} className="w-full mt-4 py-3 px-4 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition-transform transform hover:scale-105">
                                Reset Calculator
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-3 space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <SummaryCard label="Principal Amount" value={currencyFormatter.format(parseFloat(loanAmount) || 0)} bgColorClass="bg-blue-500" textColorClass="text-white" />
                            <SummaryCard label="Total Interest" value={currencyFormatter.format(summary.totalInterest)} bgColorClass="bg-yellow-400" textColorClass="text-yellow-900" />
                            <SummaryCard label="Total Payment" value={currencyFormatter.format(summary.totalPayment)} bgColorClass="bg-green-500" textColorClass="text-white" />
                        </div>
                        <AmortizationTable schedule={amortizationSchedule} currencyFormatter={currencyFormatter} loanDetails={loanDetails} />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;
