import React, { useState } from 'react';
import { useApp } from '../../context/useApp';
import { apiService } from '../../services/apiService';
import { StatusBadge } from '../common/StatusBadge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { getTaskLabel, formatDate } from '../../utils/formatters';
import {
  Terminal,
  Download,
  Filter,
  FileText,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const TaskMonitor: React.FC = () => {
  const { tasks, loadingTasks, refreshTasks, setSelectedTaskForLogs } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'running') return t.status === 'RUNNING' || t.status === 'PENDING' || t.status === 'QUEUED';
    return t.status.toLowerCase() === filterStatus.toLowerCase();
  });

  if (loadingTasks) {
    return <LoadingSpinner label="Loading Celery task queue..." size="lg" />;
  }

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-200/60 border border-slate-300 rounded-xl p-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-2" />
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-colors ${
                filterStatus === 'all'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({tasks.length})
            </button>

            <button
              onClick={() => setFilterStatus('running')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-colors ${
                filterStatus === 'running'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active (
              {tasks.filter(
                (t) => t.status === 'RUNNING' || t.status === 'PENDING' || t.status === 'QUEUED'
              ).length}
              )
            </button>

            <button
              onClick={() => setFilterStatus('success')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-colors ${
                filterStatus === 'success'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Successful ({tasks.filter((t) => t.status === 'SUCCESS').length})
            </button>

            <button
              onClick={() => setFilterStatus('failure')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-colors ${
                filterStatus === 'failure'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Failed ({tasks.filter((t) => t.status === 'FAILURE').length})
            </button>
          </div>
        </div>

        <button
          onClick={refreshTasks}
          className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-200/80 hover:bg-slate-300 border border-slate-300 text-slate-700 transition-colors flex items-center justify-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-100/90 rounded-2xl border border-slate-300 space-y-3">
          <Terminal className="w-12 h-12 text-slate-400 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-800">No background tasks found</h3>
            <p className="text-xs text-slate-500">
              Run a remediation tool to queue background processing jobs here.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-300 bg-slate-100/90 shadow-sm">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-200/80 border-b border-slate-300 uppercase tracking-wider text-[11px] font-bold text-slate-600">
              <tr>
                <th scope="col" className="px-4 py-3.5">Remediation Task</th>
                <th scope="col" className="px-4 py-3.5">Status</th>
                <th scope="col" className="px-4 py-3.5">Input PDF</th>
                <th scope="col" className="px-4 py-3.5">Output PDF</th>
                <th scope="col" className="px-4 py-3.5">Updated</th>
                <th scope="col" className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTasks.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-indigo-50/40">
                  {/* Task Name & ID */}
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 shrink-0">
                        <Terminal className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{getTaskLabel(t.name)}</div>
                        <span className="text-[10px] text-slate-500 font-mono">ID: {t.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} size="sm" />
                  </td>

                  {/* Input File */}
                  <td className="px-4 py-3 text-slate-700">
                    <div className="flex items-center gap-1.5 truncate max-w-[150px]" title={t.input_filename}>
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-semibold">{t.input_filename || t.file_id.slice(0, 8)}</span>
                    </div>
                  </td>

                  {/* Output File */}
                  <td className="px-4 py-3 text-slate-700">
                    {t.output_filename ? (
                      <div className="flex items-center gap-1.5 text-emerald-700 font-bold truncate max-w-[150px]" title={t.output_filename}>
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                        <span className="truncate">{t.output_filename}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No output file</span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-slate-600 font-medium">
                    {formatDate(t.updated_at || t.created_at)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedTaskForLogs(t)}
                        className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300 transition-colors flex items-center gap-1"
                        title="View Execution Logs & STDOUT"
                      >
                        <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Logs</span>
                      </button>

                      {t.output_file_id && (
                        <a
                          href={apiService.getDownloadUrl(t.output_file_id)}
                          download={t.output_filename || 'remediated.pdf'}
                          className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 transition-colors"
                          title="Download Output PDF"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
