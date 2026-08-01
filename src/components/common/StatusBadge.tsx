import React from 'react';
import type { TaskStatus, FileType } from '../../types/pdf';
import { CheckCircle2, AlertCircle, Clock, Loader2, FileText, CheckCheck } from 'lucide-react';

interface StatusBadgeProps {
  status: TaskStatus | FileType | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const upperStatus = status.toUpperCase();

  let bgColor = 'bg-slate-200 text-slate-700 border-slate-300';
  let icon = <Clock className="w-3.5 h-3.5 mr-1.5 animate-spin" />;

  switch (upperStatus) {
    case 'SUCCESS':
      bgColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      icon = <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />;
      break;
    case 'FAILURE':
      bgColor = 'bg-rose-100 text-rose-800 border-rose-300';
      icon = <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-rose-600" />;
      break;
    case 'RUNNING':
      bgColor = 'bg-amber-100 text-amber-800 border-amber-300';
      icon = <Loader2 className="w-3.5 h-3.5 mr-1.5 text-amber-600 animate-spin" />;
      break;
    case 'PENDING':
    case 'QUEUED':
      bgColor = 'bg-indigo-100 text-indigo-800 border-indigo-300';
      icon = <Clock className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />;
      break;
    case 'UPLOADED':
      bgColor = 'bg-cyan-100 text-cyan-800 border-cyan-300';
      icon = <FileText className="w-3.5 h-3.5 mr-1.5 text-cyan-600" />;
      break;
    case 'PROCESSED':
      bgColor = 'bg-purple-100 text-purple-800 border-purple-300';
      icon = <CheckCheck className="w-3.5 h-3.5 mr-1.5 text-purple-600" />;
      break;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-bold',
    md: 'text-xs px-2.5 py-1 font-bold',
    lg: 'text-sm px-3 py-1.5 font-bold',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-2xs backdrop-blur-md transition-all ${bgColor} ${sizeClasses}`}
    >
      {icon}
      {status}
    </span>
  );
};
