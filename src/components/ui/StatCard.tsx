import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: { value: string; positive: boolean };
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, className = '' }) => (
  <div className={`bg-white border border-neutral-200 rounded-xl p-4 min-w-0 ${className}`}>
    <div className="flex items-start justify-between">
      <div className="min-w-0">
        <p className="m-0 text-xs text-neutral-500 font-medium">{label}</p>
        <p className="m-0 mt-1 text-2xl font-bold text-black leading-tight">{value}</p>
        {trend && (
          <p className={`m-0 mt-1 text-xs font-medium ${trend.positive ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </div>
      {icon && (
        <div className="text-2xl leading-none shrink-0">{icon}</div>
      )}
    </div>
  </div>
);

export default StatCard;
