import { createContext } from 'react';
import type { PdfFile, Task, SystemHealth } from '../types/pdf';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

export interface AppContextType {
  files: PdfFile[];
  tasks: Task[];
  loadingFiles: boolean;
  loadingTasks: boolean;
  systemHealth: SystemHealth;
  activeFile: PdfFile | null;
  setActiveFile: (file: PdfFile | null) => void;
  selectedTaskForLogs: Task | null;
  setSelectedTaskForLogs: (task: Task | null) => void;
  selectedFileForInspector: PdfFile | null;
  setSelectedFileForInspector: (file: PdfFile | null) => void;
  activeTab: 'files' | 'tools' | 'tasks';
  setActiveTab: (tab: 'files' | 'tools' | 'tasks') => void;
  selectedToolId: string | null;
  setSelectedToolId: (toolId: string | null) => void;
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  removeToast: (id: string) => void;
  refreshFiles: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  refreshHealth: () => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  clearAllBackendData: () => Promise<void>;
  triggerTask: (taskPromise: Promise<{ task_id: string }>, toolName: string) => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
