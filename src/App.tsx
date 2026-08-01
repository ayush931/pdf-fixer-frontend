import React from 'react';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/useApp';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { ToastStack } from './components/common/Toast';
import { FileUploadZone } from './components/files/FileUploadZone';
import { FileListTable } from './components/files/FileListTable';
import { PdfInspectorModal } from './components/files/PdfInspectorModal';
import { RemediationTools } from './components/tools/RemediationTools';
import { TaskMonitor } from './components/tasks/TaskMonitor';
import { TaskLogModal } from './components/tasks/TaskLogModal';
import { Files, Wrench, Terminal, ShieldCheck, Zap, FileCheck } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, files, tasks } = useApp();

  const activeTaskCount = tasks.filter(
    (t) => t.status === 'PENDING' || t.status === 'RUNNING' || t.status === 'QUEUED'
  ).length;

  const successTaskCount = tasks.filter((t) => t.status === 'SUCCESS').length;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8">
      {/* Overview Metric Banner Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-100/90 border border-slate-300 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">Total PDF Repository</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{files.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">Uploaded & Remediated</p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
            <Files className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-100/90 border border-slate-300 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">Remediation Tools</p>
            <p className="text-2xl font-black text-indigo-700 mt-1">6 Active</p>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">Tags, Links & IDs</p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-100/90 border border-slate-300 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">Active Queue Tasks</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{activeTaskCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">Celery Async Workers</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-100/90 border border-slate-300 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">Completed Jobs</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{successTaskCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">Successfully Processed</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Tab Routing Content */}
      {activeTab === 'files' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" /> PDF Document Manager
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Upload new PDF files or select existing files to run automated remediation tools.
              </p>
            </div>
          </div>

          <FileUploadZone />
          <FileListTable />
        </section>
      )}

      {activeTab === 'tools' && (
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-indigo-600" /> PDF Remediation & Tag Fixers
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Select a specialized PDF script runner to repair note IDs, fix auto-tagged index pages, or link citations.
            </p>
          </div>

          <RemediationTools />
        </section>
      )}

      {activeTab === 'tasks' && (
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-600" /> Celery Task Queue & Logs
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Real-time monitoring for background PDF processing jobs, execution logs & output files.
            </p>
          </div>

          <TaskMonitor />
        </section>
      )}

      {/* Modals */}
      <PdfInspectorModal />
      <TaskLogModal />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col bg-[#f3f5f8] text-slate-800 font-sans">
        <Header />
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <Sidebar />
          <MainContent />
        </div>
        <ToastStack />
      </div>
    </AppProvider>
  );
}

export default App;
