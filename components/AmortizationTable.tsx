import React from 'react';
import { AmortizationEntry, LoanDetails } from '../types';

// Declare XLSX to inform TypeScript about the global variable from the CDN script
declare const XLSX: any;

interface AmortizationTableProps {
  schedule: AmortizationEntry[];
  currencyFormatter: Intl.NumberFormat;
  loanDetails: LoanDetails;
}

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const AmortizationTable: React.FC<AmortizationTableProps> = ({ schedule, currencyFormatter, loanDetails }) => {
  if (schedule.length === 0) {
    return (
      <div className="text-center py-10 px-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-700">Amortization Schedule</h3>
        <p className="mt-2 text-sm text-gray-500">Enter loan details to see the payment schedule.</p>
      </div>
    );
  }
  
  const formatDate = (date: Date) => {
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  };

  const handleDownloadExcel = () => {
    try {
      const { loanAmount, interestRate, tenureMonths, emi, startDate } = loanDetails;

      // Use the last date from the schedule for the end date to ensure accuracy.
      const finalEndDate = schedule.length > 0 ? schedule[schedule.length - 1].date : null;

      // 1. Prepare Summary Data
      const summaryHeader = [{ v: "Loan Summary" }];
      const summaryData = [
        ["Loan Amount", parseFloat(loanAmount) || 0],
        // Store rate as a decimal (e.g., 0.0955) for correct Excel percentage formatting
        ["Annual Interest Rate", (parseFloat(interestRate) || 0) / 100],
        ["Tenure (Months)", parseInt(tenureMonths, 10) || 0],
        ["Monthly EMI", parseFloat(emi) || 0],
        ["Loan Start Date", startDate ? new Date(startDate) : 'N/A'],
        ["Loan End Date", finalEndDate],
      ];

      // 2. Prepare Amortization Table Data
      const tableData = schedule.map(entry => ({
        '#': entry.month,
        'Date': entry.date,
        'Principal': parseFloat(entry.principal.toFixed(2)),
        'Interest': parseFloat(entry.interest.toFixed(2)),
        'EMI': parseFloat(entry.totalPayment.toFixed(2)),
        'Balance': parseFloat(entry.remainingBalance.toFixed(2)),
      }));

      // 3. Create a new worksheet and add data
      const worksheet = XLSX.utils.aoa_to_sheet([summaryHeader]);
      XLSX.utils.sheet_add_aoa(worksheet, [[]], { origin: 'A2' }); // Spacer
      XLSX.utils.sheet_add_aoa(worksheet, summaryData, { origin: 'A3', cellDates: true });

      const tableStartRow = 3 + summaryData.length + 1;
      XLSX.utils.sheet_add_json(worksheet, tableData, {
        origin: `A${tableStartRow}`,
        skipHeader: false,
        cellDates: true,
      });

      // 4. Define formats
      const currencySymbol = currencyFormatter.formatToParts(0).find(p => p.type === 'currency')?.value || '₹';
      const currencyFormat = `"${currencySymbol}"#,##0.00`;
      const percentFormat = `0.00%`;
      const intFormat = '0';
      const dateFormat = 'mmm-yy';

      // 5. Apply formats to summary
      if (worksheet['B3']) worksheet['B3'].z = currencyFormat; // Loan Amount
      if (worksheet['B4']) worksheet['B4'].z = percentFormat; // Interest Rate
      if (worksheet['B5']) worksheet['B5'].z = intFormat; // Tenure
      if (worksheet['B6']) worksheet['B6'].z = currencyFormat; // EMI
      if (worksheet['B7']?.t === 'n') worksheet['B7'].z = dateFormat; // Start Date
      if (worksheet['B8']?.t === 'n') worksheet['B8'].z = dateFormat; // End Date

      // 6. Apply formats to the table data with safety checks
      for (let i = 0; i < tableData.length; i++) {
        const row = tableStartRow + 1 + i;
        const applyFormat = (col: number, format: string) => {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellAddress];
          if (cell) {
            cell.z = format;
          }
        };

        applyFormat(1, dateFormat);      // Date
        applyFormat(2, currencyFormat);  // Principal
        applyFormat(3, currencyFormat);  // Interest
        applyFormat(4, currencyFormat);  // EMI
        applyFormat(5, currencyFormat);  // Balance
      }

      // 7. Set column widths and merges
      worksheet['!cols'] = [
        { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }
      ];
      worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }]; // Merge title row

      // 8. Create workbook and download
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Loan Details');
      XLSX.writeFile(workbook, 'Loan-Details-and-Schedule.xlsx');
    } catch (error) {
        console.error("Failed to download Excel file:", error);
        alert("Sorry, there was an error generating the Excel file. Please check your loan parameters and try again.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-800">Amortization Schedule</h3>
          {schedule.length > 0 && (
            <button
                onClick={handleDownloadExcel}
                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition-transform transform hover:scale-105 flex items-center"
                aria-label="Download amortization schedule as Excel file"
            >
                <DownloadIcon />
                <span>Download Excel</span>
            </button>
          )}
      </div>
      <div className="overflow-auto max-h-[40rem] rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Interest</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">EMI</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schedule.map((entry) => (
              <tr key={entry.month} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.month}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(entry.date)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{currencyFormatter.format(entry.principal)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{currencyFormatter.format(entry.interest)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600 text-right">{currencyFormatter.format(entry.totalPayment)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{currencyFormatter.format(entry.remainingBalance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AmortizationTable;