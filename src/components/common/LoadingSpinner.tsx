import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading...',
  size = 'md',
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 text-slate-400 gap-3">
      <Loader2 className={`${sizeMap[size]} animate-spin text-indigo-400`} />
      {label && <p className="text-sm font-medium text-slate-300">{label}</p>}
    </div>
  );
};
