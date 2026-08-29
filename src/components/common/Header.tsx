import React, { useState } from 'react';
import { useApp } from '../../context/useApp';
import { FileCheck2, Cpu, Activity, ExternalLink, Sparkles, RefreshCw, Trash2, Menu, X, Files, Wrench, Terminal } from 'lucide-react';
import { TOOLS } from '../tools/RemediationTools';

export const Header: React.FC = () => {
  const { tasks, files, refreshFiles, refreshTasks, loadingFiles, loadingTasks, clearAllBackendData, activeTab, setActiveTab } = useApp();
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeTaskCount = tasks.filter(
    (t) => t.status === 'PENDING' || t.status === 'RUNNING' || t.status === 'QUEUED'
  ).length;

  const handleRefresh = async () => {
    await Promise.all([refreshFiles(), refreshTasks()]);
  };

  const handleClearData = async () => {
    await clearAllBackendData();
    setShowConfirmClear(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-200/60 backdrop-blur-xl border-b border-slate-300/80 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
        {/* Left logo & title */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 p-0.5 shadow-md shadow-indigo-500/15 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#f3f5f8] rounded-[10px] flex items-center justify-center">
              <FileCheck2 className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-800 bg-clip-text text-transparent truncate max-w-[160px] sm:max-w-none">
                PDF Fixer Studio
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                <Sparkles className="w-2.5 h-2.5 text-indigo-600" /> v1.0 Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-600 hidden lg:block">
              Automated PDF Accessibility, Tag Repair & Link Remediation Suite
            </p>
          </div>
        </div>

        {/* Right Stats & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Tasks Badge */}
          {activeTaskCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold animate-pulse">
              <Activity className="w-3.5 h-3.5" />
              <span>{activeTaskCount} <span className="hidden sm:inline">Running</span></span>
            </div>
          )}

          {/* Server Status Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-300 text-xs text-slate-700 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-600">FastAPI & Celery Connected</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loadingFiles || loadingTasks}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition-colors disabled:opacity-50"
            title="Refresh files and tasks"
          >
            <RefreshCw className={`w-4 h-4 ${loadingFiles || loadingTasks ? 'animate-spin' : ''}`} />
          </button>

          {/* Clear All Data Button */}
          <button
            onClick={() => setShowConfirmClear(true)}
            className="px-2.5 py-1.5 sm:px-3 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all flex items-center gap-1.5"
            title="Clear all backend files and database records"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Clear Backend</span>
          </button>

          {/* API Docs Link */}
          <a
            href={`${import.meta.env.VITE_API_BASE_URL || ''}/documentation`}
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all shadow-xs"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>API Docs</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>
      </header>

      {/* Mobile Responsive Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-100 border-b border-slate-300 p-4 space-y-2 animate-fade-in shadow-md">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Navigation Menu
          </div>
          <button
            onClick={() => { setActiveTab('files'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs transition-colors ${
              activeTab === 'files' ? 'bg-indigo-600 text-white' : 'bg-slate-200/70 text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2"><Files className="w-4 h-4" /> PDF Library</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-300/60 text-slate-800 font-mono text-[10px]">{files.length}</span>
          </button>

          <button
            onClick={() => { setActiveTab('tools'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs transition-colors ${
              activeTab === 'tools' ? 'bg-indigo-600 text-white' : 'bg-slate-200/70 text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2"><Wrench className="w-4 h-4" /> Remediation Tools</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-300/60 text-slate-800 font-mono text-[10px]">{TOOLS.length} Tools</span>
          </button>

          <button
            onClick={() => { setActiveTab('tasks'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs transition-colors ${
              activeTab === 'tasks' ? 'bg-indigo-600 text-white' : 'bg-slate-200/70 text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2"><Terminal className="w-4 h-4" /> Task Queue & Logs</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-300/60 text-slate-800 font-mono text-[10px]">{tasks.length}</span>
          </button>

          <a
            href={`${import.meta.env.VITE_API_BASE_URL || ''}/documentation`}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-indigo-50 border border-indigo-200 font-bold text-indigo-700 text-xs mt-3"
          >
            <Cpu className="w-4 h-4" /> Open Postman API Documentation <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>
      )}

      {/* Confirmation Modal for Clearing Backend Data */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowConfirmClear(false)} />
          <div className="relative bg-slate-100 border border-slate-300 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 z-10 text-slate-800 animate-scale-up">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-100 border border-rose-200">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Clear All Backend Data?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This action will permanently delete all uploaded PDF files from disk storage, remove processed outputs, and clear all database task logs in FastAPI and SQLite.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearData}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm & Delete All</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
