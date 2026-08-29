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
  ShieldCheck,
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
    return <LoadingSpinner label="Loading Celery worker queue..." size="lg" />;
  }

  return (
    <div className="space-y-3.5">
      {/* Ephemeral Privacy Notice Banner */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-slate-700 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-slate-200 text-slate-700 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900">Ephemeral Privacy Lifecycle Active:</span>
            <span className="text-slate-500 ml-1">
              Source and remediated PDFs are processed in isolation and automatically purged from server storage after download.
            </span>
          </div>
        </div>
      </div>

      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white border border-slate-200/80 rounded-xl p-1 text-xs shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 font-semibold rounded-lg transition-colors ${
                filterStatus === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({tasks.length})
            </button>

            <button
              onClick={() => setFilterStatus('running')}
              className={`px-3 py-1 font-semibold rounded-lg transition-colors ${
                filterStatus === 'running'
                  ? 'bg-slate-900 text-white shadow-xs'
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
              className={`px-3 py-1 font-semibold rounded-lg transition-colors ${
                filterStatus === 'success'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Successful ({tasks.filter((t) => t.status === 'SUCCESS').length})
            </button>

            <button
              onClick={() => setFilterStatus('failure')}
              className={`px-3 py-1 font-semibold rounded-lg transition-colors ${
                filterStatus === 'failure'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Failed ({tasks.filter((t) => t.status === 'FAILURE').length})
            </button>
          </div>
        </div>

        <button
          onClick={refreshTasks}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200/80 space-y-3 shadow-2xs">
          <Terminal className="w-12 h-12 text-slate-300 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-slate-800">No background tasks found</h3>
            <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">
              Run a remediation engine from the suite above to queue background jobs here.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-[11px] font-semibold text-slate-600">
              <tr>
                <th scope="col" className="px-4 py-3.5">Remediation Engine</th>
                <th scope="col" className="px-4 py-3.5">Status</th>
                <th scope="col" className="px-4 py-3.5">Input PDF</th>
                <th scope="col" className="px-4 py-3.5">Output PDF</th>
                <th scope="col" className="px-4 py-3.5">Updated</th>
                <th scope="col" className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-slate-50/60">
                  {/* Task Name & ID */}
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                        <Terminal className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{getTaskLabel(t.name)}</div>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {t.id.slice(0, 8)}...</span>
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
                      <div className="flex items-center gap-1.5 text-emerald-700 font-semibold truncate max-w-[150px]" title={t.output_filename}>
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                        <span className="truncate">{t.output_filename}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No output file</span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-slate-500 font-medium">
                    {formatDate(t.updated_at || t.created_at)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedTaskForLogs(t)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5"
                        title="View Execution Logs & STDOUT"
                      >
                        <Terminal className="w-3.5 h-3.5 text-slate-600" />
                        <span>Logs</span>
                      </button>

                      {t.output_file_id && (
                        <a
                          href={apiService.getDownloadUrl(t.output_file_id)}
                          download={t.output_filename || 'remediated.pdf'}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                          title="Download Output PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
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


