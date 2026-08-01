export type FileType = 'uploaded' | 'processed';

export interface PdfFile {
    id: string;
    filename: string;
    filepath: string;
    file_type: FileType;
    size: number;
    created_at: string;
}

export type TaskName =
    | 'fix_note_ids'
    | 'tag_viewer'
    | 'fix_index_tag'
    | 'apply_link_view_settings'
    | 'fix_links'
    | 'bidirectional_notes_linker';

export type TaskStatus = 'PENDING' | 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILURE';

export interface Task {
    id: string;
    name: TaskName;
    file_id: string;
    output_file_id?: string | null;
    status: TaskStatus;
    error?: string | null;
    log_output?: string | null;
    created_at: string;
    updated_at: string;
    input_filename?: string;
    input_filepath?: string;
    output_filename?: string;
    output_filepath?: string;
    celery_status?: string;
}

export interface BookmarkOutlineItem {
    title: string;
    page?: number | null;
    depth: number;
}

export interface SearchMatchItem {
    page: number;
    matches: number;
}

export interface PdfPagesInfo {
    file_id: string;
    filename: string;
    total_pages: number;
    outline: BookmarkOutlineItem[];
    search_results: SearchMatchItem[];
}

export interface UploadResponse {
    file_id: string;
    filename: string;
    size: number;
    status: string;
}

export interface TaskEnqueueResponse {
    task_id: string;
    status: string;
}

// Remediation tool request interfaces
export interface NoteIdsRequest {
    file_id: string;
    output_name?: string;
}

export interface TagViewerRequest {
    file_id: string;
}

export interface FixIndexTagRequest {
    file_id: string;
    pages: number[];
    output_name?: string;
}

export type LinkViewSetting = 'Fit' | 'FitH' | 'InheritZoom' | 'InheritScrollAndZoom';

export interface ApplyLinkViewRequest {
    file_id: string;
    view: LinkViewSetting;
    custom_view?: string | null;
    output_name?: string;
}

export interface FixLinksRequest {
    file_id: string;
    output_name?: string;
}

export interface BidirectionalNotesLinkerRequest {
    file_id: string;
    notes_pages?: string;
    chapter_notes?: boolean;
    book_notes?: boolean;
    note_pattern?: string;
    dry_run?: boolean;
    verbose?: boolean;
    output_name?: string;
}
