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
    | 'run_fix_note_ids'
    | 'fix_reference_note_ids'
    | 'run_fix_reference_note_ids'
    | 'tag_viewer'
    | 'run_tag_viewer'
    | 'fix_index_tag'
    | 'run_fix_index_tag'
    | 'tag_index_phrases'
    | 'run_tag_index_phrases'
    | 'apply_link_view_settings'
    | 'run_apply_link_view_settings'
    | 'fix_links'
    | 'run_fix_links'
    | 'bidirectional_notes_linker'
    | 'run_bidirectional_notes_linker'
    | 'remove_page_ids'
    | 'run_remove_page_ids'
    | 'id_remover_inspect'
    | 'run_id_remover_inspect'
    | 'id_remover_strip'
    | 'run_id_remover_strip'
    | 'auto_tagger'
    | 'run_auto_tagger'
    | 'set_link_objr'
    | 'run_set_link_objr'
    | 'tag_untagged_index'
    | 'run_tag_untagged_index'
    | 'document_structure_analyzer'
    | 'run_document_structure_analyzer'
    | 'reorder_reading_order'
    | 'run_reorder_reading_order';

export type TaskStatus = 'PENDING' | 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILURE';

export interface Task {
    id: string;
    name: TaskName | string;
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
    info?: string;
    mode?: string;
}

// Remediation tool request interfaces
export interface NoteIdsRequest {
    file_id: string;
    output_name?: string;
}

export interface ReferenceNoteIdsRequest {
    file_id: string;
    output_name?: string;
}

export interface TagViewerRequest {
    file_id: string;
}

export interface FixIndexTagRequest {
    file_id: string;
    pages?: number[];
    output_name?: string;
}

export interface TagIndexPhrasesRequest {
    file_id: string;
    pages?: number[];
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

export interface RemovePageIdsRequest {
    file_id: string;
    output_name?: string;
}

export interface IdRemoverInspectRequest {
    file_id: string;
}

export interface IdRemoverStripRequest {
    file_id: string;
    output_name?: string;
    pattern?: string | null;
    tag_filter?: string | null;
    clusters?: string | null;
    auto?: boolean;
    prune_empty_nodes?: boolean;
    dry_run?: boolean;
}

export interface AutoTaggerRequest {
    file_id: string;
    output_name?: string;
    verbose?: boolean;
}

export interface SetLinkObjrRequest {
    file_id: string;
    output_name?: string;
    verbose?: boolean;
}

export interface TagUntaggedIndexRequest {
    file_id: string;
    output_name?: string;
    pages?: (number | string)[];
    debug?: boolean;
}

export interface ReorderReadingOrderRequest {
    file_id: string;
    custom_order: Record<string, string[]>;
    output_name?: string;
}

export interface PageElement {
    id: string;
    type: 'Heading' | 'Paragraph' | 'Table' | 'Figure';
    subtype?: string | null;
    bbox: [number, number, number, number];
    text: string;
    font_name?: string;
    font_size?: number;
    reading_order: number;
}

export interface PageStructure {
    page: number;
    width: number;
    height: number;
    column_layout: string;
    figures_count: number;
    tables_count: number;
    elements: PageElement[];
}

export interface DocumentStructureReport {
    summary: {
        total_pages: number;
        total_elements: number;
        total_headings: number;
        total_paragraphs: number;
        total_figures: number;
        total_tables: number;
    };
    pages: PageStructure[];
}

export interface SystemHealth {
    status: 'healthy' | 'degraded' | 'unhealthy' | 'loading';
    database: string;
    redis: string;
    celery_workers: string;
    details?: {
        workers?: string[];
    };
}

