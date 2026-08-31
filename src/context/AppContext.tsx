import React, { useState, useEffect, useCallback } from 'react';
import type { PdfFile, Task, SystemHealth } from '../types/pdf';
import { apiService } from '../services/apiService';
import { AppContext, type ToastMessage } from './AppContextInstance';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(true);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(true);
  const [activeFile, setActiveFile] = useState<PdfFile | null>(null);
  const [selectedTaskForLogs, setSelectedTaskForLogs] = useState<Task | null>(null);
  const [selectedFileForInspector, setSelectedFileForInspector] = useState<PdfFile | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'tools' | 'tasks' | 'tags'>('files');
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  const refreshFiles = useCallback(async () => {
    try {
      const data = await apiService.getFiles();
      const validData = Array.isArray(data) ? data : [];
      setFiles(validData);
      setActiveFile((prev) => (prev && validData.some((f) => f.id === prev.id) ? prev : validData.length > 0 ? validData[0] : null));
    } catch (err: unknown) {
      console.error('Failed to load files:', err);
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  const refreshTasks = useCallback(async () => {
    try {
      const data = await apiService.getTasks();
      const validData = Array.isArray(data) ? data : [];
      setTasks(validData);
    } catch (err: unknown) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  const deleteFile = useCallback(async (fileId: string) => {
    try {
      const res = await apiService.deleteFile(fileId);
      addToast('success', 'File Removed', res.message || 'PDF file removed.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'File removed.';
      addToast('info', 'File Removed', msg);
    } finally {
      setFiles((prev) => (Array.isArray(prev) ? prev.filter((f) => f.id !== fileId) : []));
      setActiveFile((prev) => (prev?.id === fileId ? null : prev));
      setSelectedFileForInspector((prev) => (prev?.id === fileId ? null : prev));
      refreshFiles();
      refreshTasks();
    }
  }, [refreshFiles, refreshTasks, addToast]);

  const clearAllBackendData = useCallback(async () => {
    try {
      const res = await apiService.clearAllData();
      setFiles([]);
      setTasks([]);
      setActiveFile(null);
      setSelectedFileForInspector(null);
      setSelectedTaskForLogs(null);
      addToast('success', 'Backend Data Cleared', res.message || 'All records and files removed.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to clear backend data.';
      addToast('error', 'Clear Data Failed', msg);
    }
  }, [addToast]);

  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'loading',
    database: '-',
    redis: '-',
    celery_workers: '-',
  });

  const refreshHealth = useCallback(async () => {
    try {
      const data = await apiService.getHealth();
      setSystemHealth(data);
    } catch (err: unknown) {
      console.error('Failed to load system health:', err);
      setSystemHealth({
        status: 'unhealthy',
        database: 'Connection Lost',
        redis: 'Connection Lost',
        celery_workers: 'Connection Lost',
      });
    }
  }, []);

  // Health polling every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshHealth();
    }, 15000);
    return () => clearInterval(interval);
  }, [refreshHealth]);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    refreshHealth();

    apiService.getFiles()
      .then((data) => {
        if (isMounted) {
          const validData = Array.isArray(data) ? data : [];
          setFiles(validData);
          setActiveFile((prev) => (prev ? prev : validData.length > 0 ? validData[0] : null));
          setLoadingFiles(false);
        }
      })
      .catch((err: unknown) => {
        console.error('Failed to load files:', err);
        if (isMounted) setLoadingFiles(false);
      });

    apiService.getTasks()
      .then((data) => {
        if (isMounted) {
          const validData = Array.isArray(data) ? data : [];
          setTasks(validData);
          setLoadingTasks(false);
        }
      })
      .catch((err: unknown) => {
        console.error('Failed to load tasks:', err);
        if (isMounted) setLoadingTasks(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Task status polling for active/pending tasks
  useEffect(() => {
    const hasRunning = (tasks || []).some(
      (t) => t.status === 'PENDING' || t.status === 'RUNNING' || t.status === 'QUEUED'
    );

    if (!hasRunning) return;

    const interval = setInterval(async () => {
      try {
        const updatedTasks = await apiService.getTasks();
        const validTasks = Array.isArray(updatedTasks) ? updatedTasks : [];
        setTasks(validTasks);

        const prevCompletedCount = (tasks || []).filter((t) => t.status === 'SUCCESS').length;
        const nowCompletedCount = validTasks.filter((t) => t.status === 'SUCCESS').length;
        if (nowCompletedCount > prevCompletedCount) {
          refreshFiles();
          addToast('success', 'Task Completed', 'PDF processing finished successfully.');
        }

        const prevFailedCount = (tasks || []).filter((t) => t.status === 'FAILURE').length;
        const nowFailedCount = validTasks.filter((t) => t.status === 'FAILURE').length;
        if (nowFailedCount > prevFailedCount) {
          const latestFailed = validTasks.find((t) => t.status === 'FAILURE');
          addToast('error', 'Task Failed', latestFailed?.error || 'PDF processing encountered an error.');
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [tasks, refreshFiles, addToast]);

  const triggerTask = async (taskPromise: Promise<{ task_id: string }>, toolName: string) => {
    try {
      const res = await taskPromise;
      addToast('info', `${toolName} Enqueued`, `Task ID: ${res.task_id.slice(0, 8)}... queued successfully.`);
      await refreshTasks();
      setActiveTab('tasks');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start processing task.';
      addToast('error', `${toolName} Error`, msg);
    }
  };

  return (
    <AppContext.Provider
      value={{
        files: files || [],
        tasks: tasks || [],
        loadingFiles,
        loadingTasks,
        systemHealth,
        activeFile,
        setActiveFile,
        selectedTaskForLogs,
        setSelectedTaskForLogs,
        selectedFileForInspector,
        setSelectedFileForInspector,
        activeTab,
        setActiveTab,
        selectedToolId,
        setSelectedToolId,
        toasts,
        addToast,
        removeToast,
        refreshFiles,
        refreshTasks,
        refreshHealth,
        deleteFile,
        clearAllBackendData,
        triggerTask,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
