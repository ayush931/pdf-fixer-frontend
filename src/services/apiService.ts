import { ENDPOINTS } from '../config/api';
import type {
  PdfFile,
  Task,
  PdfPagesInfo,
  UploadResponse,
  TaskEnqueueResponse,
  NoteIdsRequest,
  ReferenceNoteIdsRequest,
  TagViewerRequest,
  FixIndexTagRequest,
  TagIndexPhrasesRequest,
  ApplyLinkViewRequest,
  FixLinksRequest,
  BidirectionalNotesLinkerRequest,
  RemovePageIdsRequest,
  IdRemoverInspectRequest,
  IdRemoverStripRequest,
  AutoTaggerRequest,
  ReorderReadingOrderRequest,
  SystemHealth,
} from '../types/pdf';

class ApiService {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        }
      } catch {
        // Response wasn't JSON
      }
      throw new Error(errorMessage);
    }
    return response.json() as Promise<T>;
  }

  // Upload PDF file
  async uploadPdf(file: File, onProgress?: (percent: number) => void): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', ENDPOINTS.UPLOAD);

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            reject(new Error('Invalid JSON response from server'));
          }
        } else {
          try {
            const errorObj = JSON.parse(xhr.responseText);
            reject(new Error(errorObj.detail || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error during file upload'));
      xhr.send(formData);
    });
  }

  // Files
  async getFiles(): Promise<PdfFile[]> {
    const res = await fetch(ENDPOINTS.FILES);
    return this.handleResponse<PdfFile[]>(res);
  }

  async getFileDetails(fileId: string): Promise<PdfFile> {
    const res = await fetch(ENDPOINTS.FILE_DETAILS(fileId));
    return this.handleResponse<PdfFile>(res);
  }

  async deleteFile(fileId: string): Promise<{ status: string; message: string }> {
    const res = await fetch(ENDPOINTS.FILE_DETAILS(fileId), { method: 'DELETE' });
    return this.handleResponse<{ status: string; message: string }>(res);
  }

  async getPdfPagesInfo(fileId: string, searchQuery?: string): Promise<PdfPagesInfo> {
    const res = await fetch(ENDPOINTS.PAGES_INFO(fileId, searchQuery));
    return this.handleResponse<PdfPagesInfo>(res);
  }

  getDownloadUrl(fileId: string, deleteAfter: boolean = false): string {
    return ENDPOINTS.DOWNLOAD(fileId, deleteAfter);
  }

  async cleanupStorage(fileId?: string): Promise<{ status: string; message: string; purged_count?: number }> {
    const res = await fetch(ENDPOINTS.CLEANUP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fileId ? { file_id: fileId } : { purge_all: true }),
    });
    return this.handleResponse<{ status: string; message: string; purged_count?: number }>(res);
  }

  async clearAllData(): Promise<{ status: string; message: string }> {
    const res = await fetch(ENDPOINTS.CLEAR_ALL, { method: 'POST' });
    return this.handleResponse<{ status: string; message: string }>(res);
  }

  // Remediation Tools Process Endpoints
  async processNoteIds(req: NoteIdsRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_NOTE_IDS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processReferenceNoteIds(req: ReferenceNoteIdsRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_REFERENCE_NOTE_IDS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processTagViewer(req: TagViewerRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_TAG_VIEWER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processIndexTags(req: FixIndexTagRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_INDEX_TAGS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processTagIndexPhrases(req: TagIndexPhrasesRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_TAG_INDEX_PHRASES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processLinkView(req: ApplyLinkViewRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_LINK_VIEW, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processFixLinks(req: FixLinksRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_FIX_LINKS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processBidirectional(req: BidirectionalNotesLinkerRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_BIDIRECTIONAL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processRemovePageIds(req: RemovePageIdsRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_REMOVE_PAGE_IDS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processIdRemoverInspect(req: IdRemoverInspectRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_ID_REMOVER_INSPECT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processIdRemoverStrip(req: IdRemoverStripRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_ID_REMOVER_STRIP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processAutoTagger(req: AutoTaggerRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_AUTO_TAGGER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processStructureAnalysis(fileId: string): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_STRUCTURE_ANALYSIS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: fileId }),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processReorderReadingOrder(req: ReorderReadingOrderRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_REORDER_READING_ORDER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    const res = await fetch(ENDPOINTS.TASKS);
    return this.handleResponse<Task[]>(res);
  }

  async getTaskStatus(taskId: string): Promise<Task> {
    const res = await fetch(ENDPOINTS.TASK_STATUS(taskId));
    return this.handleResponse<Task>(res);
  }

  async getHealth(): Promise<SystemHealth> {
    const res = await fetch(ENDPOINTS.HEALTH);
    return this.handleResponse<SystemHealth>(res);
  }
}

export const apiService = new ApiService();
