const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const ENDPOINTS = {
  UPLOAD: `${API_BASE_URL}/api/upload`,
  FILES: `${API_BASE_URL}/api/files`,
  FILE_DETAILS: (fileId: string) => `${API_BASE_URL}/api/files/${fileId}`,
  PAGES_INFO: (fileId: string, search_query?: string) => 
    `${API_BASE_URL}/api/files/${fileId}/pages-info${search_query ? `?search_query=${encodeURIComponent(search_query)}` : ''}`,
  DOWNLOAD: (fileId: string) => `${API_BASE_URL}/api/download/${fileId}`,
  CLEAR_ALL: `${API_BASE_URL}/api/clear-all`,
  
  PROCESS_NOTE_IDS: `${API_BASE_URL}/api/process/note-ids`,
  PROCESS_TAG_VIEWER: `${API_BASE_URL}/api/process/tag-viewer`,
  PROCESS_INDEX_TAGS: `${API_BASE_URL}/api/process/index-tags`,
  PROCESS_LINK_VIEW: `${API_BASE_URL}/api/process/link-view-settings`,
  PROCESS_FIX_LINKS: `${API_BASE_URL}/api/process/fix-links`,
  PROCESS_BIDIRECTIONAL: `${API_BASE_URL}/api/process/bidirectional-linker`,
  PROCESS_STRUCTURE_ANALYSIS: `${API_BASE_URL}/api/process/structure-analyzer`,
  PROCESS_REORDER_READING_ORDER: `${API_BASE_URL}/api/process/reorder-reading-order`,
  
  TASKS: `${API_BASE_URL}/api/tasks`,
  TASK_STATUS: (taskId: string) => `${API_BASE_URL}/api/tasks/${taskId}`,
  HEALTH: `${API_BASE_URL}/api/health`,
};
