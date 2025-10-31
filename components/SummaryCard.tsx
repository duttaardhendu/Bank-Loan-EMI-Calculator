
import React from 'react';

interface SummaryCardProps {
  label: string;
  value: string;
  bgColorClass: string;
  textColorClass: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, bgColorClass, textColorClass }) => {
  return (
    <div className={`p-6 rounded-xl shadow-lg ${bgColorClass}`}>
      <p className={`text-sm font-medium ${textColorClass} opacity-80`}>{label}</p>
      <p className={`text-3xl font-bold mt-1 ${textColorClass}`}>{value}</p>
    </div>
  );
};

export default SummaryCard;
