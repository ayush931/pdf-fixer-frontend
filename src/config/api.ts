const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const ENDPOINTS = {
  UPLOAD: `${API_BASE_URL}/api/upload`,
  FILES: `${API_BASE_URL}/api/files`,
  FILE_DETAILS: (fileId: string) => `${API_BASE_URL}/api/files/${fileId}`,
  PAGES_INFO: (fileId: string, search_query?: string) => 
    `${API_BASE_URL}/api/files/${fileId}/pages-info${search_query ? `?search_query=${encodeURIComponent(search_query)}` : ''}`,
  DOWNLOAD: (fileId: string, deleteAfter?: boolean) => 
    `${API_BASE_URL}/api/download/${fileId}${deleteAfter ? '?delete_after=true' : ''}`,
  CLEAR_ALL: `${API_BASE_URL}/api/clear-all`,
  CLEANUP: `${API_BASE_URL}/api/cleanup`,
  
  PROCESS_NOTE_IDS: `${API_BASE_URL}/api/process/note-ids`,
  PROCESS_REFERENCE_NOTE_IDS: `${API_BASE_URL}/api/process/reference-note-ids`,
  PROCESS_TAG_VIEWER: `${API_BASE_URL}/api/process/tag-viewer`,
  PROCESS_INDEX_TAGS: `${API_BASE_URL}/api/process/index-tags`,
  PROCESS_TAG_INDEX_PHRASES: `${API_BASE_URL}/api/process/tag-index-phrases`,
  PROCESS_LINK_VIEW: `${API_BASE_URL}/api/process/link-view-settings`,
  PROCESS_FIX_LINKS: `${API_BASE_URL}/api/process/fix-links`,
  PROCESS_BIDIRECTIONAL: `${API_BASE_URL}/api/process/bidirectional-linker`,
  PROCESS_REMOVE_PAGE_IDS: `${API_BASE_URL}/api/process/remove-page-ids`,
  PROCESS_ID_REMOVER_INSPECT: `${API_BASE_URL}/api/process/id-remover/inspect`,
  PROCESS_ID_REMOVER_STRIP: `${API_BASE_URL}/api/process/id-remover/strip`,
  PROCESS_AUTO_TAGGER: `${API_BASE_URL}/api/process/auto-tagger`,
  PROCESS_STRUCTURE_ANALYSIS: `${API_BASE_URL}/api/process/structure-analyzer`,
  PROCESS_REORDER_READING_ORDER: `${API_BASE_URL}/api/process/reorder-reading-order`,
  
  TASKS: `${API_BASE_URL}/api/tasks`,
  TASK_STATUS: (taskId: string) => `${API_BASE_URL}/api/tasks/${taskId}`,
  HEALTH: `${API_BASE_URL}/api/health`,
};
