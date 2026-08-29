import React from 'react';
import { useApp } from '../../context/useApp';
import { Files, Wrench, Terminal, FileText, Eye, UploadCloud, Activity, Database, Network } from 'lucide-react';
import { formatFileSize } from '../../utils/formatters';
import { TOOLS } from '../tools/RemediationTools';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, files, tasks, activeFile, setSelectedFileForInspector, systemHealth } = useApp();

  const pendingCount = tasks.filter(
    (t) => t.status === 'PENDING' || t.status === 'RUNNING' || t.status === 'QUEUED'
  ).length;

  const navItems = [
    {
      id: 'files' as const,
      label: 'PDF Library',
      description: 'Upload & inspect PDFs',
      icon: Files,
      count: files.length,
    },
    {
      id: 'tools' as const,
      label: 'Remediation Tools',
      description: 'Fix links, tags & IDs',
      icon: Wrench,
      count: TOOLS.length,
    },
    {
      id: 'tasks' as const,
      label: 'Task Queue & Logs',
      description: 'Celery background jobs',
      icon: Terminal,
      count: tasks.length,
      badge: pendingCount > 0 ? pendingCount : null,
    },
  ];

  return (
    <aside className="hidden md:flex md:flex-col justify-between w-64 h-full bg-white border-r border-slate-200/80 shrink-0 p-4 overflow-y-auto">
      <div className="space-y-5">
        <div className="px-2">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </h2>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-1.5 rounded-lg transition-colors ${
                      isActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-slate-800'}`}>{item.label}</div>
                    <div className={`text-[10px] truncate ${isActive ? 'text-slate-400' : 'text-slate-500'}`}>{item.description}</div>
                  </div>
                </div>

                {item.badge !== null && item.badge !== undefined ? (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-400 text-amber-950 shadow-2xs">
                    {item.badge}
                  </span>
                ) : (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Selected PDF Card Widget */}
      <div className="pt-4 border-t border-slate-200/80">
        {activeFile ? (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Active PDF
              </span>
              <span className="text-[10px] text-slate-500 font-mono font-medium">{formatFileSize(activeFile.size)}</span>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-orange-600 shrink-0" />
              <p className="text-xs font-semibold text-slate-900 truncate" title={activeFile.filename}>
                {activeFile.filename}
              </p>
            </div>

            <button
              onClick={() => setSelectedFileForInspector(activeFile)}
              className="w-full py-1.5 px-3 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5" /> Inspect Structure
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
            <p className="text-xs font-medium text-slate-600">No PDF Selected</p>
            <p className="text-[11px] text-slate-400">
              Upload a document to run remediation tools.
            </p>
            <button
              onClick={() => setActiveTab('files')}
              className="w-full py-1.5 px-3 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <UploadCloud className="w-3.5 h-3.5" /> Upload File
            </button>
          </div>
        )}
      </div>

      {/* System Status Panel */}
      <div className="pt-4 mt-4 border-t border-slate-200/80 space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> System Status
          </span>
          <span className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${
              systemHealth.status === 'healthy'
                ? 'bg-emerald-500'
                : systemHealth.status === 'degraded'
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`} />
            <span className="text-[10px] font-semibold text-slate-600 capitalize">
              {systemHealth.status}
            </span>
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1">
              <Database className="w-3 h-3 text-slate-400 shrink-0" /> Database
            </span>
            <span className={`font-semibold ${
              systemHealth.database.startsWith('online') ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {systemHealth.database.startsWith('online') ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1">
              <Network className="w-3 h-3 text-slate-400 shrink-0" /> Message Broker
            </span>
            <span className={`font-semibold ${
              systemHealth.redis.startsWith('online') ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {systemHealth.redis.startsWith('online') ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1">
              <Terminal className="w-3 h-3 text-slate-400 shrink-0" /> Celery Workers
            </span>
            <span className={`font-semibold ${
              systemHealth.celery_workers.startsWith('online') 
                ? 'text-emerald-600' 
                : systemHealth.celery_workers.includes('no active workers')
                ? 'text-amber-600'
                : 'text-rose-600'
            }`}>
              {systemHealth.celery_workers.startsWith('online') 
                ? 'Online' 
                : systemHealth.celery_workers.includes('no active workers')
                ? 'No Workers'
                : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};


