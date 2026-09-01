import React from 'react';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/useApp';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { ToastStack } from './components/common/Toast';
import { FileUploadZone } from './components/files/FileUploadZone';
import { FileListTable } from './components/files/FileListTable';
import { PdfInspectorModal } from './components/files/PdfInspectorModal';
import { PdfTagTreeInspector } from './components/tags/PdfTagTreeInspector';
import { RemediationTools, TOOLS } from './components/tools/RemediationTools';
import { TaskMonitor } from './components/tasks/TaskMonitor';
import { TaskLogModal } from './components/tasks/TaskLogModal';
import { Files, Wrench, ShieldCheck, Zap } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, files, tasks } = useApp();

  const activeTaskCount = tasks.filter(
    (t) => t.status === 'PENDING' || t.status === 'RUNNING' || t.status === 'QUEUED'
  ).length;

  const successTaskCount = tasks.filter((t) => t.status === 'SUCCESS').length;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">PDF Documents</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{files.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Uploaded & Remediated</p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700">
            <Files className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Remediation Tools</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{TOOLS.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tags, Links & IDs</p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Active Tasks</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{activeTaskCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Celery Workers</p>
          </div>
          <div className={`p-2.5 rounded-lg ${activeTaskCount > 0 ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-700'}`}>
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Completed Jobs</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{successTaskCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">WCAG Compliant</p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Tab Routing Content */}
      {activeTab === 'files' && (
        <section className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">PDF Document Manager</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload PDF files or inspect existing documents for structure trees, tags, and compliance.
            </p>
          </div>

          <FileUploadZone />
          <FileListTable />
        </section>
      )}

      {activeTab === 'tools' && (
        <section className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">PDF Remediation & Accessibility Tools</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select specialized tools to repair note IDs, fix auto-tagged index pages, link citations, and auto-tag PDF/UA elements.
            </p>
          </div>

          <RemediationTools />
        </section>
      )}

      {activeTab === 'tasks' && (
        <section className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Celery Task Queue & Logs</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time monitoring for background PDF processing jobs, execution logs, and output download links.
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

const AppLayout: React.FC = () => {
  const { activeTab } = useApp();

  if (activeTab === 'tags') {
    return (
      <div className="h-screen w-screen flex flex-col bg-white overflow-hidden select-none">
        <PdfTagTreeInspector isStandaloneFullPage={true} />
        <PdfInspectorModal />
        <TaskLogModal />
        <ToastStack />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 font-sans selection:bg-orange-600 selection:text-white">
      <Header />
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
      <ToastStack />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}

export default App;
