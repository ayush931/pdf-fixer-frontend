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
  SetLinkObjrRequest,
  TagUntaggedIndexRequest,
  ReorderReadingOrderRequest,
  SystemHealth,
} from '../types/pdf';
import type { User, AuthResponse, LoginPayload, RegisterPayload } from '../types/auth';

class ApiService {
  private token: string | null = localStorage.getItem('pdf_fixer_jwt_token');

  public setAuthToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('pdf_fixer_jwt_token', token);
    } else {
      localStorage.removeItem('pdf_fixer_jwt_token');
    }
  }

  public getAuthToken(): string | null {
    return this.token || localStorage.getItem('pdf_fixer_jwt_token');
  }

  private getAuthHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = { ...customHeaders };
    const curToken = this.getAuthToken();
    if (curToken) {
      headers['Authorization'] = `Bearer ${curToken}`;
    }
    return headers;
  }

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

  // ----------------- AUTHENTICATION METHODS -----------------
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await fetch(ENDPOINTS.AUTH_LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await this.handleResponse<AuthResponse>(res);
    this.setAuthToken(data.access_token);
    return data;
  }

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await fetch(ENDPOINTS.AUTH_REGISTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await this.handleResponse<AuthResponse>(res);
    this.setAuthToken(data.access_token);
    return data;
  }

  async getCurrentUser(): Promise<User> {
    const res = await fetch(ENDPOINTS.AUTH_ME, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<User>(res);
  }

  async logout(): Promise<void> {
    try {
      await fetch(ENDPOINTS.AUTH_LOGOUT, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
    } catch {}
    this.setAuthToken(null);
  }

  // ----------------- FILE & PROCESSING METHODS -----------------
  // Upload PDF file
  async uploadPdf(file: File, onProgress?: (percent: number) => void): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', ENDPOINTS.UPLOAD);

      const token = this.getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

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
    const res = await fetch(ENDPOINTS.FILES, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<PdfFile[]>(res);
  }

  async getFileDetails(fileId: string): Promise<PdfFile> {
    const res = await fetch(ENDPOINTS.FILE_DETAILS(fileId), {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<PdfFile>(res);
  }

  async deleteFile(fileId: string): Promise<{ status: string; message: string }> {
    const res = await fetch(ENDPOINTS.FILE_DETAILS(fileId), {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<{ status: string; message: string }>(res);
  }

  async getPdfPagesInfo(fileId: string, searchQuery?: string): Promise<PdfPagesInfo> {
    const res = await fetch(ENDPOINTS.PAGES_INFO(fileId, searchQuery), {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<PdfPagesInfo>(res);
  }

  getDownloadUrl(fileId: string, deleteAfter?: boolean): string {
    return ENDPOINTS.DOWNLOAD(fileId, deleteAfter);
  }

  async clearAllData(): Promise<{ status: string; message: string }> {
    const res = await fetch(ENDPOINTS.CLEAR_ALL, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<{ status: string; message: string }>(res);
  }

  async cleanup(): Promise<{ status: string; message: string; deleted_count: number }> {
    const res = await fetch(ENDPOINTS.CLEANUP, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<{ status: string; message: string; deleted_count: number }>(res);
  }

  // Process Endpoints
  async processNoteIds(req: NoteIdsRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_NOTE_IDS, {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processReferenceNoteIds(req: ReferenceNoteIdsRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_REFERENCE_NOTE_IDS, {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processTagViewer(req: TagViewerRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_TAG_VIEWER, {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processIndexTags(req: FixIndexTagRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_INDEX_TAGS, {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processTagIndexPhrases(req: TagIndexPhrasesRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_TAG_INDEX_PHRASES, {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processLinkView(req: ApplyLinkViewRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_LINK_VIEW, {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processFixLinks(req: FixLinksRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_FIX_LINKS, {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processBidirectionalNotes(req: BidirectionalNotesLinkerRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_BIDIRECTIONAL, {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processBidirectional(req: BidirectionalNotesLinkerRequest): Promise<TaskEnqueueResponse> {
    return this.processBidirectionalNotes(req);
  }

  async processRemovePageIds(req: RemovePageIdsRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_REMOVE_PAGE_IDS, {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processIdRemoverInspect(req: IdRemoverInspectRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_ID_REMOVER_INSPECT, {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processIdRemoverStrip(req: IdRemoverStripRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_ID_REMOVER_STRIP, {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processAutoTagger(req: AutoTaggerRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_AUTO_TAGGER, {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processSetLinkObjr(req: SetLinkObjrRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_SET_LINK_OBJR, {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processTagUntaggedIndex(req: TagUntaggedIndexRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_TAG_UNTAGGED_INDEX, {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processStructureAnalysis(fileId: string): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_STRUCTURE_ANALYSIS, {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ file_id: fileId }),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  async processReorderReadingOrder(req: ReorderReadingOrderRequest): Promise<TaskEnqueueResponse> {
    const res = await fetch(ENDPOINTS.PROCESS_REORDER_READING_ORDER, {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(req),
    });
    return this.handleResponse<TaskEnqueueResponse>(res);
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    const res = await fetch(ENDPOINTS.TASKS, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<Task[]>(res);
  }

  async getTaskStatus(taskId: string): Promise<Task> {
    const res = await fetch(ENDPOINTS.TASK_STATUS(taskId), {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<Task>(res);
  }

  async getHealth(): Promise<SystemHealth> {
    const res = await fetch(ENDPOINTS.HEALTH, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<SystemHealth>(res);
  }
}

export const apiService = new ApiService();
