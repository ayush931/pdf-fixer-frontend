import React, { useState } from 'react';
import { useApp } from '../../context/useApp';
import { apiService } from '../../services/apiService';
import type { Task } from '../../types/pdf';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { getTaskLabel, formatDate } from '../../utils/formatters';
import { Terminal, Copy, Check, Download, AlertTriangle, RefreshCw } from 'lucide-react';

interface TaskLogContentProps {
  initialTask: Task;
}

const TaskLogContent: React.FC<TaskLogContentProps> = ({ initialTask }) => {
  const { setSelectedTaskForLogs, addToast, refreshTasks, refreshFiles } = useApp();
  const [task, setTask] = useState<Task>(initialTask);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Keep state in sync if prop changes
  React.useEffect(() => {
    setTask(initialTask);
  }, [initialTask]);

  // Poll status in real time if task is active
  React.useEffect(() => {
    const isRunning = task.status === 'PENDING' || task.status === 'RUNNING' || task.status === 'QUEUED';
    if (!isRunning) return;

    const interval = setInterval(async () => {
      try {
        const updated = await apiService.getTaskStatus(task.id);
        setTask(updated);
        
        // Sync lists when task finishes
        if (updated.status === 'SUCCESS' || updated.status === 'FAILURE') {
          refreshTasks();
          refreshFiles();
        }
      } catch (err) {
        console.error('Failed to poll task logs:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [task.id, task.status, refreshTasks, refreshFiles]);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const updated = await apiService.getTaskStatus(task.id);
      setTask(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update task status.';
      addToast('error', 'Task Fetch Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLogs = () => {
    if (!task.log_output) return;
    navigator.clipboard.writeText(task.log_output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => setSelectedTaskForLogs(null)}
      maxWidth="4xl"
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{getTaskLabel(task.name)}</h3>
            <p className="text-xs text-slate-500 font-mono">Task ID: {task.id}</p>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Status Bar */}
        <div className="p-4 rounded-xl bg-slate-200/60 border border-slate-300 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <StatusBadge status={task.status} size="md" />
            <span className="text-xs text-slate-600 font-mono font-bold">
              Created: {formatDate(task.created_at)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
              title="Refresh Task Logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {task.log_output && (
              <button
                onClick={handleCopyLogs}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300 transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Logs' : 'Copy Logs'}</span>
              </button>
            )}

            {task.output_file_id && (
              <a
                href={apiService.getDownloadUrl(task.output_file_id)}
                download={task.output_filename || 'remediated.pdf'}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Output PDF</span>
              </a>
            )}
          </div>
        </div>

        {/* Error Alert Box */}
        {task.error && (
          <div className="p-4 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs space-y-1">
            <h4 className="font-bold flex items-center gap-2 text-rose-800">
              <AlertTriangle className="w-4 h-4" /> Task Failed
            </h4>
            <p className="font-mono font-semibold">{task.error}</p>
          </div>
        )}

        {/* Console Execution Terminal Log Viewer */}
        <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 font-mono text-xs shadow-md">
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span className="ml-2 font-bold text-slate-300">STDOUT & STDERR Execution Trace</span>
            </span>
            <span className="text-slate-400">UTF-8</span>
          </div>

          <div className="p-4 max-h-[380px] overflow-y-auto space-y-1 text-slate-200 leading-relaxed whitespace-pre-wrap selection:bg-indigo-500 selection:text-white">
            {loading ? (
              <LoadingSpinner label="Fetching execution logs..." size="sm" />
            ) : task.log_output ? (
              task.log_output
            ) : (
              <span className="text-slate-500 italic">No execution logs output recorded yet.</span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export const TaskLogModal: React.FC = () => {
  const { selectedTaskForLogs } = useApp();

  if (!selectedTaskForLogs) return null;

  return <TaskLogContent key={selectedTaskForLogs.id} initialTask={selectedTaskForLogs} />;
};
