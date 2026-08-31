import React, { useState } from 'react';
import { useApp } from '../../context/useApp';
import { useAuth } from '../../context/AuthContext';
import { FileCheck2, Cpu, Activity, ExternalLink, RefreshCw, Trash2, Menu, X, Files, Wrench, Terminal, ChevronDown, LogOut, ShieldCheck } from 'lucide-react';
import { TOOLS } from '../tools/RemediationTools';

export const Header: React.FC = () => {
  const { tasks, files, refreshFiles, refreshTasks, loadingFiles, loadingTasks, clearAllBackendData, activeTab, setActiveTab } = useApp();
  const { user, logout } = useAuth();
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-2xs">
        {/* Left logo & title */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <a href="https://nexografix.com/" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Nexografix <span className="text-xs font-normal text-slate-500 hidden sm:inline">| PDF Remediation Studio</span>
                </h1>
                <span className="hidden sm:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  WCAG · 508
                </span>
              </div>
            </div>
          </a>
        </div>

        {/* Right Stats & Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Active Tasks Badge */}
          {activeTaskCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold animate-pulse">
              <Activity className="w-3.5 h-3.5 text-amber-600" />
              <span>{activeTaskCount} <span className="hidden sm:inline">Active</span></span>
            </div>
          )}

          {/* Server Status Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>API & Workers Connected</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loadingFiles || loadingTasks}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
            title="Refresh files and tasks"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingFiles || loadingTasks ? 'animate-spin' : ''}`} />
          </button>

          {/* Clear All Data Button */}
          <button
            onClick={() => setShowConfirmClear(true)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 transition-all flex items-center gap-1.5"
            title="Clear all backend files and database records"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Data</span>
          </button>

          {/* API Docs Link */}
          <a
            href={`${import.meta.env.VITE_API_BASE_URL || ''}/documentation`}
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>API Docs</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>

          {/* User Profile & Sign Out Dropdown */}
          {user && (
            <div className="relative ml-1">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Account Settings"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 leading-none">{user.username}</div>
                  <div className="text-[9px] font-mono text-slate-400 capitalize">{user.role}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-slate-200 p-3 w-56 z-50 space-y-2.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="border-b border-slate-100 pb-2">
                    <div className="font-bold text-xs text-slate-900">{user.full_name || user.username}</div>
                    <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                    <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      {user.role} Account
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      setUserMenuOpen(false);
                      await logout();
                    }}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Mobile Responsive Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-2 animate-fade-in shadow-md">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Navigation Menu
          </div>
          <button
            onClick={() => { setActiveTab('files'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between p-2.5 rounded-lg font-bold text-xs transition-colors ${
              activeTab === 'files' ? 'bg-orange-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2"><Files className="w-4 h-4" /> PDF Library</span>
            <span className="px-2 py-0.5 rounded-full bg-black/10 text-xs font-mono">{files.length}</span>
          </button>

          <button
            onClick={() => { setActiveTab('tools'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between p-2.5 rounded-lg font-bold text-xs transition-colors ${
              activeTab === 'tools' ? 'bg-orange-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2"><Wrench className="w-4 h-4" /> Remediation Tools</span>
            <span className="px-2 py-0.5 rounded-full bg-black/10 text-xs font-mono">{TOOLS.length} Tools</span>
          </button>

          <button
            onClick={() => { setActiveTab('tasks'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between p-2.5 rounded-lg font-bold text-xs transition-colors ${
              activeTab === 'tasks' ? 'bg-orange-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2"><Terminal className="w-4 h-4" /> Task Queue & Logs</span>
            <span className="px-2 py-0.5 rounded-full bg-black/10 text-xs font-mono">{tasks.length}</span>
          </button>

          <a
            href={`${import.meta.env.VITE_API_BASE_URL || ''}/documentation`}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-900 text-white font-semibold text-xs mt-3"
          >
            <Cpu className="w-4 h-4" /> Open API Documentation <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>
      )}

      {/* Confirmation Modal for Clearing Backend Data */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowConfirmClear(false)} />
          <div className="relative bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 z-10 text-slate-800 animate-scale-up">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
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
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearData}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
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


