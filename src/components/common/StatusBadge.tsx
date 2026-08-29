import React from 'react';
import type { TaskStatus, FileType } from '../../types/pdf';
import { CheckCircle2, AlertCircle, Clock, Loader2, FileText, CheckCheck } from 'lucide-react';

interface StatusBadgeProps {
  status: TaskStatus | FileType | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const upperStatus = status.toUpperCase();

  let bgColor = 'bg-slate-100 text-slate-700 border-slate-200';
  let icon = <Clock className="w-3.5 h-3.5 mr-1.5 animate-spin" />;

  switch (upperStatus) {
    case 'SUCCESS':
      bgColor = 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs';
      icon = <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />;
      break;
    case 'FAILURE':
      bgColor = 'bg-rose-50 text-rose-800 border-rose-200 shadow-2xs';
      icon = <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-rose-600" />;
      break;
    case 'RUNNING':
      bgColor = 'bg-orange-100 text-orange-900 border-orange-300 shadow-2xs';
      icon = <Loader2 className="w-3.5 h-3.5 mr-1.5 text-orange-600 animate-spin" />;
      break;
    case 'PENDING':
    case 'QUEUED':
      bgColor = 'bg-amber-50 text-amber-800 border-amber-200 shadow-2xs';
      icon = <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-600" />;
      break;
    case 'UPLOADED':
      bgColor = 'bg-orange-50 text-orange-800 border-orange-200 shadow-2xs';
      icon = <FileText className="w-3.5 h-3.5 mr-1.5 text-orange-600" />;
      break;
    case 'PROCESSED':
      bgColor = 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs';
      icon = <CheckCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />;
      break;
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5 font-bold',
    md: 'text-xs px-3 py-1 font-bold',
    lg: 'text-sm px-3.5 py-1.5 font-bold',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border backdrop-blur-md transition-all ${bgColor} ${sizeClasses}`}
    >
      {icon}
      {status}
    </span>
  );
};

