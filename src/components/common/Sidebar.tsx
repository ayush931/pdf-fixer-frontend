import React from 'react';
import { useApp } from '../../context/useApp';
import { Files, Wrench, Terminal, FileText, CheckCircle2, Eye, UploadCloud, AlertCircle, Activity, Database, Network } from 'lucide-react';
import { formatFileSize } from '../../utils/formatters';

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
      count: 6,
    },
    {
      id: 'tasks' as const,
      label: 'Task Queue & Logs',
      description: 'Celery background workers',
      icon: Terminal,
      count: tasks.length,
      badge: pendingCount > 0 ? pendingCount : null,
    },
  ];

  return (
    <aside className="hidden md:flex md:flex-col justify-between w-64 h-full bg-slate-200/50 backdrop-blur-md border-r border-slate-300/80 shrink-0 p-4 overflow-y-auto">
      <div className="space-y-6">
        <div className="px-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Navigation Menu
          </h2>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-white text-indigo-950 border border-indigo-200 shadow-md shadow-indigo-500/10 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-lg transition-colors ${
                      isActive ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-900">{item.label}</div>
                    <div className="text-[11px] text-slate-500 truncate">{item.description}</div>
                  </div>
                </div>

                {item.badge !== null && item.badge !== undefined ? (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-400 text-amber-950 shadow-2xs">
                    {item.badge}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-600 font-mono px-2 py-0.5 rounded-md bg-slate-200/80 border border-slate-300/60 font-semibold">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Selected PDF Card Widget */}
      <div className="pt-6 border-t border-slate-300/80">
        {activeFile ? (
          <div className="p-3.5 rounded-xl bg-white border border-slate-300 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Active PDF
              </span>
              <span className="text-[10px] text-slate-500 font-mono font-bold">{formatFileSize(activeFile.size)}</span>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
              <p className="text-xs font-bold text-slate-900 truncate" title={activeFile.filename}>
                {activeFile.filename}
              </p>
            </div>

            <button
              onClick={() => setSelectedFileForInspector(activeFile)}
              className="w-full py-1.5 px-3 text-xs font-bold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" /> Inspect PDF Structure
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-300 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-amber-700 text-xs font-bold">
              <AlertCircle className="w-4 h-4" /> No PDF Selected
            </div>
            <p className="text-[11px] text-slate-500">
              Upload or pick a PDF file to run remediation tools.
            </p>
            <button
              onClick={() => setActiveTab('files')}
              className="w-full py-1.5 px-3 text-xs font-bold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5" /> Upload PDF
            </button>
          </div>
        )}
      </div>

      {/* System Status Panel */}
      <div className="pt-4 mt-4 border-t border-slate-300/80 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-600" /> System Status
          </span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${
              systemHealth.status === 'healthy'
                ? 'bg-emerald-500 animate-pulse'
                : systemHealth.status === 'degraded'
                ? 'bg-amber-500 animate-pulse'
                : 'bg-rose-500 animate-pulse'
            }`} />
            <span className="text-[10px] font-bold text-slate-600 capitalize">
              {systemHealth.status}
            </span>
          </span>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-300 space-y-2 text-[11px] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Database
            </span>
            <span className={`font-bold ${
              systemHealth.database.startsWith('online') ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {systemHealth.database.startsWith('online') ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1">
              <Network className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Message Broker
            </span>
            {systemHealth.redis.startsWith('online') ? (
              <a 
                href="http://localhost:15672" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-bold text-emerald-600 hover:underline flex items-center gap-0.5"
                title="Open RabbitMQ Management Console"
              >
                Online <span className="text-[9px]">↗</span>
              </a>
            ) : (
              <span className="font-bold text-rose-600">Offline</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Celery Workers
            </span>
            <span className={`font-bold ${
              systemHealth.celery_workers.startsWith('online') 
                ? 'text-emerald-600' 
                : systemHealth.celery_workers.includes('no active workers')
                ? 'text-amber-500 font-bold animate-pulse'
                : 'text-rose-600'
            }`} title={systemHealth.celery_workers}>
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
