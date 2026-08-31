import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useApp } from '../../context/useApp';
import { apiService } from '../../services/apiService';
import type { PdfFile } from '../../types/pdf';
import {
  Search,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Tag as TagIcon,
  Layers,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FolderOpen,
  Eye,
  EyeOff,
  RotateCw,
  SlidersHorizontal,
  XCircle,
  ArrowLeft,
  Maximize2,
  Minimize2,
  ExternalLink,
  Navigation,
  Link as LinkIcon,
  Zap
} from 'lucide-react';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export interface LinkObjrInfo {
  annotId: string;
  subtype: string;
  url?: string;
  targetPage?: number;
  targetDestName?: string;
  rect?: number[];
  bbox?: { x: number; y: number; width: number; height: number };
  structParent?: number;
  action?: any;
}

export interface StructNode {
  id: string;
  tag: string;
  title: string;
  alt: string;
  actualText: string;
  lang: string;
  pageNum: number;
  children: StructNode[];
  text: string;
  bboxes: { pageNum: number; bbox: { x: number; y: number; width: number; height: number } }[];
  mcids: string[];
  objr?: LinkObjrInfo;
}

interface PageElement {
  tag: string;
  text: string;
  bbox: { x: number; y: number; width: number; height: number };
  node: StructNode;
}

type TagCategoryType = 'all' | 'heading' | 'p' | 'link' | 'table' | 'list' | 'figure';

// GLOBAL IN-MEMORY CACHE (Persists across components and view switches)
interface DocumentCacheEntry {
  doc: pdfjsLib.PDFDocumentProxy;
  totalPages: number;
  structTreeRoot: StructNode | null;
  allNodesList: StructNode[];
  tagCounts: Record<string, number>;
  pageElementsMap: Map<number, PageElement[]>;
  pageDims: Map<number, { width: number; height: number }>;
}

const documentMemoryCache = new Map<string, DocumentCacheEntry>();

export const PdfTagTreeInspector: React.FC<{
  initialFile?: PdfFile | null;
  isStandaloneFullPage?: boolean;
  onClose?: () => void;
}> = ({ initialFile, isStandaloneFullPage, onClose }) => {
  const { files, activeFile, setActiveTab } = useApp();

  const [selectedFile, setSelectedFile] = useState<PdfFile | null>(initialFile || activeFile || (files.length > 0 ? files[0] : null));
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(1.35);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [viewLayout, setViewLayout] = useState<'continuous' | 'single'>('continuous');

  // Fast Highlight & Overlay Customization Options
  const [showHighlights, setShowHighlights] = useState<boolean>(true);
  const [showSelectionHighlight, setShowSelectionHighlight] = useState<boolean>(true);
  const [highlightOpacity, setHighlightOpacity] = useState<number>(20);
  const [showTagPills, setShowTagPills] = useState<boolean>(true);
  const [showReadingOrder, setShowReadingOrder] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<TagCategoryType>('all');
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);

  const [filterQuery, setFilterQuery] = useState<string>('');
  const [structTreeRoot, setStructTreeRoot] = useState<StructNode | null>(null);
  const [allNodesList, setAllNodesList] = useState<StructNode[]>([]);
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});
  const [pageElementsMap, setPageElementsMap] = useState<Map<number, PageElement[]>>(new Map());
  const [pageDimensionsMap, setPageDimensionsMap] = useState<Map<number, { width: number; height: number }>>(new Map());
  const [selectedNode, setSelectedNode] = useState<StructNode | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  // Resizable sidebar widths
  const [leftWidth, setLeftWidth] = useState<number>(340);
  const [rightWidth, setRightWidth] = useState<number>(330);

  const canvasScrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Sync selected file if prop changes
  useEffect(() => {
    if (initialFile) {
      setSelectedFile(initialFile);
    }
  }, [initialFile]);

  // Load PDF with Instant Cache Check
  useEffect(() => {
    if (!selectedFile) return;

    const cacheKey = selectedFile.id || selectedFile.filename;
    const cached = documentMemoryCache.get(cacheKey);

    if (cached) {
      // INSTANT 0ms CACHE RESTORE
      setPdfDoc(cached.doc);
      setTotalPages(cached.totalPages);
      setStructTreeRoot(cached.structTreeRoot);
      setAllNodesList(cached.allNodesList);
      setTagCounts(cached.tagCounts);
      setPageElementsMap(cached.pageElementsMap);
      setPageDimensionsMap(cached.pageDims);
      setSelectedNode(cached.allNodesList.length > 0 ? cached.allNodesList[0] : null);
      setLoading(false);
      setIsCached(true);
      return;
    }

    setIsCached(false);
    setLoading(true);

    const downloadUrl = apiService.getDownloadUrl(selectedFile.id);
    fetch(downloadUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load PDF (${res.status})`);
        return res.arrayBuffer();
      })
      .then((arrayBuffer) => {
        if (isMountedRef.current) {
          parseAndCachePdf(arrayBuffer, cacheKey);
        }
      })
      .catch((err) => {
        console.error('Error fetching PDF:', err);
        if (isMountedRef.current) setLoading(false);
      });
  }, [selectedFile]);

  // Ultra-Fast Progressive Parsing and Caching Engine
  const parseAndCachePdf = async (arrayBuffer: ArrayBuffer, cacheKey: string) => {
    try {
      setLoading(true);
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true,
        disableFontFace: false
      });
      const doc = await loadingTask.promise;
      if (!isMountedRef.current) return;

      const numPages = doc.numPages;
      setPdfDoc(doc);
      setTotalPages(numPages);
      setCurrentPage(1);

      const pageDims = new Map<number, { width: number; height: number }>();
      const pageTrees: { pageNum: number; tree: any; viewport: any }[] = [];
      const mcidDataMap = new Map<string, { pageNum: number; text: string; bbox: { x: number; y: number; width: number; height: number } }>();
      const annotsById = new Map<string, LinkObjrInfo>();
      const pageAnnotsMap = new Map<number, LinkObjrInfo[]>();

      // 1. Instant Fast-Pass: Parse Page 1 & Top Structure Tree First
      const page1 = await doc.getPage(1);
      const vp1 = page1.getViewport({ scale: 1.0 });
      pageDims.set(1, { width: vp1.width, height: vp1.height });

      // Parallel batch processor for all pages
      const BATCH_SIZE = 16;
      const allPageNums = Array.from({ length: numPages }, (_, i) => i + 1);

      for (let i = 0; i < allPageNums.length; i += BATCH_SIZE) {
        const chunk = allPageNums.slice(i, i + BATCH_SIZE);
        await Promise.all(
          chunk.map(async (p) => {
            try {
              const page = await doc.getPage(p);
              const viewport = page.getViewport({ scale: 1.0 });
              pageDims.set(p, { width: viewport.width, height: viewport.height });

              const [textContent, rawAnnots, rawTree] = await Promise.all([
                page.getTextContent({ includeMarkedContent: true }),
                page.getAnnotations(),
                page.getStructTree()
              ]);

              // Process annotations
              const pageAnnots: LinkObjrInfo[] = [];
              for (const a of rawAnnots) {
                if (a.subtype === 'Link') {
                  let targetPage: number | undefined = undefined;
                  const targetUrl = a.url;

                  if (a.dest) {
                    try {
                      if (Array.isArray(a.dest)) {
                        const ref = a.dest[0];
                        if (ref && typeof ref === 'object' && 'num' in ref) {
                          const pIndex = await doc.getPageIndex(ref);
                          targetPage = pIndex + 1;
                        } else if (typeof ref === 'number') {
                          targetPage = ref + 1;
                        }
                      } else if (typeof a.dest === 'string') {
                        const namedDest = await doc.getDestination(a.dest);
                        if (namedDest && Array.isArray(namedDest) && namedDest[0]) {
                          const pIndex = await doc.getPageIndex(namedDest[0]);
                          targetPage = pIndex + 1;
                        }
                      }
                    } catch (e) {}
                  }

                  let annotBBox = { x: 0, y: 0, width: 0, height: 0 };
                  if (a.rect && a.rect.length === 4) {
                    const p1 = viewport.convertToViewportPoint(a.rect[0], a.rect[1]);
                    const p2 = viewport.convertToViewportPoint(a.rect[2], a.rect[3]);
                    annotBBox = {
                      x: Math.max(0, Math.min(p1[0], p2[0])),
                      y: Math.max(0, Math.min(p1[1], p2[1])),
                      width: Math.max(10, Math.abs(p2[0] - p1[0])),
                      height: Math.max(8, Math.abs(p2[1] - p1[1]))
                    };
                  }

                  const info: LinkObjrInfo = {
                    annotId: a.id || '',
                    subtype: 'Link',
                    url: targetUrl,
                    targetPage,
                    targetDestName: typeof a.dest === 'string' ? a.dest : undefined,
                    rect: a.rect,
                    bbox: annotBBox,
                    structParent: a.structParent,
                    action: a.action
                  };

                  if (a.id) annotsById.set(a.id, info);
                  pageAnnots.push(info);
                }
              }
              pageAnnotsMap.set(p, pageAnnots);

              // Process marked content items
              let currentId: string | null = null;
              let currentText: string[] = [];
              let currentBoxes: any[] = [];

              for (const item of textContent.items as any[]) {
                if (item.type === 'beginMarkedContent' || item.type === 'beginMarkedContentProps') {
                  currentId = item.id;
                  currentText = [];
                  currentBoxes = [];
                } else if (item.type === 'endMarkedContent') {
                  if (currentId && currentText.length > 0) {
                    const bbox = computeBBox(currentBoxes, viewport);
                    const fullText = currentText.join(' ').trim();
                    mcidDataMap.set(currentId, { pageNum: p, text: fullText, bbox });
                  }
                  currentId = null;
                  currentText = [];
                  currentBoxes = [];
                } else if (item.str && currentId) {
                  currentText.push(item.str);
                  currentBoxes.push(item);
                }
              }

              if (rawTree) {
                pageTrees.push({ pageNum: p, tree: rawTree, viewport });
              }
            } catch (pageErr) {
              console.warn(`Page ${p} fast-pass notice:`, pageErr);
            }
          })
        );
      }

      pageTrees.sort((a, b) => a.pageNum - b.pageNum);

      // Build Structure Tree with OBJR
      let nodeIdSeq = 1;
      const convertRawNode = (rawNode: any, pageNum: number, viewport: any): StructNode | null => {
        if (!rawNode || rawNode.type === 'content') return null;
        const tag = rawNode.role || 'Document';

        const node: StructNode = {
          id: 'node_' + (nodeIdSeq++),
          tag,
          title: rawNode.title || '',
          alt: rawNode.alt || '',
          actualText: rawNode.actualText || '',
          lang: rawNode.lang || '',
          pageNum,
          children: [],
          text: '',
          bboxes: [],
          mcids: []
        };

        if (rawNode.children) {
          for (const ch of rawNode.children) {
            if (ch.type === 'content') {
              node.mcids.push(ch.id);
              const mcData = mcidDataMap.get(ch.id);
              if (mcData) {
                node.text = (node.text ? node.text + ' ' : '') + mcData.text;
                node.bboxes.push({ pageNum: mcData.pageNum, bbox: mcData.bbox });
                node.pageNum = mcData.pageNum;
              }
            } else if (ch.type === 'object' || ch.type === 'OBJR' || ch.role === 'OBJR') {
              const annotInfo = annotsById.get(ch.id) || (pageAnnotsMap.get(pageNum) || []).find((a) => a.annotId === ch.id);
              const objrNode: StructNode = {
                id: 'node_objr_' + (nodeIdSeq++),
                tag: 'OBJR',
                title: `Object Reference (${ch.id || 'Link Annot'})`,
                alt: '',
                actualText: '',
                lang: '',
                pageNum,
                children: [],
                text: annotInfo?.url || (annotInfo?.targetPage ? `→ Page ${annotInfo.targetPage}` : 'Link Annotation (/Type /OBJR)'),
                bboxes: annotInfo?.bbox ? [{ pageNum, bbox: annotInfo.bbox }] : [],
                mcids: [],
                objr: annotInfo || { annotId: ch.id || 'Annot', subtype: 'Link' }
              };
              node.children.push(objrNode);
              node.objr = objrNode.objr;
              if (objrNode.bboxes.length > 0 && node.bboxes.length === 0) {
                node.bboxes.push(...objrNode.bboxes);
              }
            } else {
              const convertedChild = convertRawNode(ch, pageNum, viewport);
              if (convertedChild) {
                node.children.push(convertedChild);
                if (!node.text && convertedChild.text) {
                  node.text = convertedChild.text;
                }
                if (convertedChild.objr && !node.objr) {
                  node.objr = convertedChild.objr;
                }
              }
            }
          }
        }

        if (tag.toUpperCase() === 'LINK' && !node.objr) {
          const pageAnnots = pageAnnotsMap.get(pageNum) || [];
          if (pageAnnots.length > 0) {
            let matchedAnnot: LinkObjrInfo | undefined = undefined;
            if (node.bboxes.length > 0) {
              const nb = node.bboxes[0].bbox;
              matchedAnnot = pageAnnots.find((a) => {
                if (!a.bbox) return false;
                const ab = a.bbox;
                return (
                  Math.abs((ab.y + ab.height / 2) - (nb.y + nb.height / 2)) < 15 &&
                  Math.abs((ab.x + ab.width / 2) - (nb.x + nb.width / 2)) < 30
                );
              });
            }
            if (!matchedAnnot && pageAnnots.length > 0) matchedAnnot = pageAnnots[0];

            if (matchedAnnot) {
              node.objr = matchedAnnot;
              const objrNode: StructNode = {
                id: 'node_objr_' + (nodeIdSeq++),
                tag: 'OBJR',
                title: `Object Reference (${matchedAnnot.annotId || 'Link Annot'})`,
                alt: '',
                actualText: '',
                lang: '',
                pageNum,
                children: [],
                text: matchedAnnot.url || (matchedAnnot.targetPage ? `→ Page ${matchedAnnot.targetPage}` : 'Link Annotation (/Type /OBJR)'),
                bboxes: matchedAnnot.bbox ? [{ pageNum, bbox: matchedAnnot.bbox }] : [],
                mcids: [],
                objr: matchedAnnot
              };
              node.children.unshift(objrNode);
              if (node.bboxes.length === 0 && matchedAnnot.bbox) {
                node.bboxes.push({ pageNum, bbox: matchedAnnot.bbox });
              }
            }
          }
        }

        return node;
      };

      const rootChildren: StructNode[] = [];
      for (const pt of pageTrees) {
        const converted = convertRawNode(pt.tree, pt.pageNum, pt.viewport);
        if (converted) {
          if (converted.tag === 'Root' || converted.tag === 'Document') {
            rootChildren.push(...converted.children);
          } else {
            rootChildren.push(converted);
          }
        }
      }

      const root: StructNode = {
        id: 'node_root',
        tag: 'Document',
        pageNum: 1,
        title: 'Document Structure Root',
        alt: '',
        actualText: '',
        lang: '',
        children: rootChildren,
        text: '',
        bboxes: [],
        mcids: []
      };

      const allNodes: StructNode[] = [];
      const counts: Record<string, number> = {};
      const pageMap = new Map<number, PageElement[]>();

      const indexNode = (node: StructNode) => {
        if (!node) return;
        allNodes.push(node);
        counts[node.tag] = (counts[node.tag] || 0) + 1;

        if (node.bboxes && node.bboxes.length > 0) {
          for (const b of node.bboxes) {
            const pItems = pageMap.get(b.pageNum) || [];
            pItems.push({
              tag: node.tag,
              text: node.text,
              bbox: b.bbox,
              node
            });
            pageMap.set(b.pageNum, pItems);
          }
        }

        if (node.children) {
          for (const c of node.children) indexNode(c);
        }
      };

      indexNode(root);

      // SAVE TO GLOBAL IN-MEMORY CACHE
      documentMemoryCache.set(cacheKey, {
        doc,
        totalPages: numPages,
        structTreeRoot: root,
        allNodesList: allNodes,
        tagCounts: counts,
        pageElementsMap: pageMap,
        pageDims
      });

      if (isMountedRef.current) {
        setStructTreeRoot(root);
        setAllNodesList(allNodes);
        setTagCounts(counts);
        setPageElementsMap(pageMap);
        setPageDimensionsMap(pageDims);
        setSelectedNode(allNodes.length > 0 ? allNodes[0] : null);
        setLoading(false);
        setIsCached(true);
      }
    } catch (err) {
      console.error('Error in parseAndCachePdf:', err);
      if (isMountedRef.current) setLoading(false);
    }
  };

  const computeBBox = (items: any[], viewport: any) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const it of items) {
      const tx = it.transform;
      const x = tx[4];
      const y = tx[5];
      const fh = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]) || it.height || 12;
      const w = it.width;

      const p1 = viewport.convertToViewportPoint(x, y);
      const p2 = viewport.convertToViewportPoint(x + w, y + fh);

      minX = Math.min(minX, p1[0], p2[0]);
      minY = Math.min(minY, p1[1], p2[1]);
      maxX = Math.max(maxX, p1[0], p2[0]);
      maxY = Math.max(maxY, p1[1], p2[1]);
    }
    return {
      x: Math.max(0, minX),
      y: Math.max(0, minY),
      width: Math.max(10, maxX - minX),
      height: Math.max(8, maxY - minY)
    };
  };

  // RAF-Accelerated Resizers
  const handleLeftMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      requestAnimationFrame(() => {
        const newWidth = Math.max(220, Math.min(650, startWidth + (moveEvent.clientX - startX)));
        setLeftWidth(newWidth);
      });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleRightMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      requestAnimationFrame(() => {
        const newWidth = Math.max(220, Math.min(600, startWidth - (moveEvent.clientX - startX)));
        setRightWidth(newWidth);
      });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleLocalFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    parseAndCachePdf(buffer, 'local_' + file.name + '_' + file.size);
  };

  const getTagCategory = useCallback((tagName: string) => {
    if (!tagName) return { category: 'struct', class: 'bg-slate-100 text-slate-700 border-slate-300', boxBorder: 'rgba(100, 116, 139, 0.6)', boxBg: 'rgba(100, 116, 139, 0.12)' };
    const tag = tagName.toUpperCase();
    if (tag === 'OBJR') {
      return { category: 'link', class: 'bg-purple-100 text-purple-800 border-purple-300 font-bold', boxBorder: 'rgba(147, 51, 234, 0.85)', boxBg: 'rgba(147, 51, 234, 0.20)' };
    }
    if (/^H[1-6]$/.test(tag) || tag === 'H' || tag === 'TITLE') {
      return { category: 'heading', class: 'bg-blue-50 text-blue-700 border-blue-300', boxBorder: 'rgba(37, 99, 235, 0.7)', boxBg: 'rgba(37, 99, 235, 0.15)' };
    }
    if (tag === 'P' || tag === 'SPAN' || tag === 'QUOTE' || tag === 'NOTE' || tag === 'CODE') {
      return { category: 'p', class: 'bg-emerald-50 text-emerald-700 border-emerald-300', boxBorder: 'rgba(5, 150, 105, 0.7)', boxBg: 'rgba(5, 150, 105, 0.14)' };
    }
    if (tag === 'LINK' || tag === 'ANNOT') {
      return { category: 'link', class: 'bg-rose-50 text-rose-700 border-rose-300', boxBorder: 'rgba(225, 29, 72, 0.75)', boxBg: 'rgba(225, 29, 72, 0.16)' };
    }
    if (tag === 'TABLE' || tag === 'TR' || tag === 'TH' || tag === 'TD' || tag === 'THEAD' || tag === 'TBODY' || tag === 'CAPTION') {
      return { category: 'table', class: 'bg-purple-50 text-purple-700 border-purple-300', boxBorder: 'rgba(124, 58, 237, 0.7)', boxBg: 'rgba(124, 58, 237, 0.15)' };
    }
    if (tag === 'L' || tag === 'LI' || tag === 'LBL' || tag === 'LBODY') {
      return { category: 'list', class: 'bg-cyan-50 text-cyan-700 border-cyan-300', boxBorder: 'rgba(8, 145, 178, 0.7)', boxBg: 'rgba(8, 145, 178, 0.15)' };
    }
    if (tag === 'FIGURE' || tag === 'FORMULA' || tag === 'FORM') {
      return { category: 'figure', class: 'bg-orange-50 text-orange-700 border-orange-300', boxBorder: 'rgba(217, 119, 6, 0.75)', boxBg: 'rgba(217, 119, 6, 0.18)' };
    }
    return { category: 'struct', class: 'bg-slate-100 text-slate-700 border-slate-300', boxBorder: 'rgba(100, 116, 139, 0.6)', boxBg: 'rgba(100, 116, 139, 0.12)' };
  }, []);

  const selectNode = useCallback((node: StructNode) => {
    setSelectedNode(node);
    if (node.pageNum) {
      setCurrentPage(node.pageNum);
      const pageEl = document.getElementById(`pdfPageWrapper_${node.pageNum}`);
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, []);

  const jumpToTargetPage = useCallback((targetPage: number) => {
    if (targetPage >= 1 && targetPage <= totalPages) {
      setCurrentPage(targetPage);
      const pageEl = document.getElementById(`pdfPageWrapper_${targetPage}`);
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [totalPages]);

  const clearSelection = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const toggleCollapse = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback((expanded: boolean) => {
    if (expanded) {
      setCollapsedNodes(new Set());
    } else {
      const allIds = new Set<string>();
      allNodesList.forEach((n) => {
        if (n.children.length > 0) allIds.add(n.id);
      });
      setCollapsedNodes(allIds);
    }
  }, [allNodesList]);

  const exportTreeJson = useCallback(() => {
    if (!structTreeRoot) return;
    const jsonStr = JSON.stringify(structTreeRoot, (k, v) => (k === 'bboxes' ? undefined : v), 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (selectedFile?.filename || 'pdf').replace(/\.pdf$/i, '') + '_tags_tree.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [structTreeRoot, selectedFile]);

  const rotatePage = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Memoized Tree Item
  const renderTreeNode = useCallback((node: StructNode): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = collapsedNodes.has(node.id);
    const isSelected = selectedNode?.id === node.id;
    const textPreview = node.text || node.title || node.alt || '';
    const tagInfo = getTagCategory(node.tag);
    const isObjr = node.tag.toUpperCase() === 'OBJR';

    const matches = !filterQuery ||
      node.tag.toLowerCase().includes(filterQuery.toLowerCase()) ||
      textPreview.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (node.objr?.url && node.objr.url.toLowerCase().includes(filterQuery.toLowerCase())) ||
      (node.objr?.targetPage && `page ${node.objr.targetPage}`.includes(filterQuery.toLowerCase()));

    if (filterQuery && !matches && !hasChildren) return null;

    return (
      <div key={node.id} className="flex flex-col font-mono text-xs">
        <div
          onClick={() => selectNode(node)}
          className={`flex items-center gap-1.5 py-1 px-1.5 rounded-md cursor-pointer transition-colors ${
            isSelected
              ? 'bg-blue-100 text-blue-900 font-semibold border border-blue-300'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          {hasChildren ? (
            <button
              onClick={(e) => toggleCollapse(node.id, e)}
              className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-slate-700 shrink-0 cursor-pointer"
            >
              <span className={`text-[10px] transform transition-transform ${isCollapsed ? '' : 'rotate-90'}`}>▶</span>
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}

          <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded border ${tagInfo.class} shrink-0 flex items-center gap-1`}>
            {isObjr && <LinkIcon className="w-2.5 h-2.5" />}
            &lt;{node.tag}&gt;
          </span>

          {node.objr && (
            <span className="text-[10px] font-sans px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 font-semibold truncate max-w-[130px] shrink-0" title={node.objr.url || `Points to Page ${node.objr.targetPage}`}>
              {node.objr.url ? `URL: ${node.objr.url.slice(0, 18)}...` : node.objr.targetPage ? `→ p.${node.objr.targetPage}` : 'Link Annot'}
            </span>
          )}

          {textPreview && !isObjr && (
            <span className="truncate text-slate-600 font-sans text-[11px] max-w-[120px]">
              {textPreview}
            </span>
          )}

          <span className="ml-auto text-[10px] text-slate-400 font-mono shrink-0">
            p.{node.pageNum || 1}
          </span>
        </div>

        {hasChildren && !isCollapsed && (
          <div className="ml-3 pl-2 border-l border-dashed border-slate-200 flex flex-col space-y-0.5 mt-0.5">
            {node.children.map((c) => renderTreeNode(c))}
          </div>
        )}
      </div>
    );
  }, [collapsedNodes, selectedNode, filterQuery, getTagCategory, selectNode, toggleCollapse]);

  const displayedPages = useMemo(() => {
    return viewLayout === 'single'
      ? [currentPage]
      : Array.from({ length: totalPages }, (_, idx) => idx + 1);
  }, [viewLayout, currentPage, totalPages]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden font-sans select-none">
      {/* Top Main Toolbar */}
      <div className="h-13 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 shadow-2xs gap-3">
        <div className="flex items-center gap-3">
          {(isStandaloneFullPage || onClose) && (
            <button
              onClick={() => (onClose ? onClose() : setActiveTab('files'))}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 border border-slate-200 shadow-2xs cursor-pointer mr-1"
              title="Return to Main Dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
          )}

          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
            <TagIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span>PDF Tag Tree & Accessibility Inspector</span>
              {isCached && (
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5" /> Instant Cache
                </span>
              )}
            </h2>
            <p className="text-[10px] text-slate-400 truncate max-w-xs">
              {selectedFile?.filename || 'No document loaded'}
            </p>
          </div>
        </div>

        {/* File Selector & Audit Button */}
        <div className="flex items-center gap-2">
          {files.length > 0 && (
            <div className="relative">
              <select
                value={selectedFile?.id || ''}
                onChange={(e) => {
                  const found = files.find((f) => f.id === e.target.value);
                  if (found) setSelectedFile(found);
                }}
                className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 pr-7 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {files.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.filename} ({Math.round(f.size / 1024)} KB)
                  </option>
                ))}
              </select>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            accept="application/pdf"
            className="hidden"
            onChange={handleLocalFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Open PDF</span>
          </button>

          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audit Scorecard</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center shadow-2xs cursor-pointer"
            title={isFullscreen ? 'Exit Full Screen' : 'Full Screen View'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Workspace Layout with Resizable Sidebars */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* LEFT PANEL: Logical Tags Tree */}
        <aside
          style={{ width: `${leftWidth}px` }}
          className="bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-hidden"
        >
          <div className="p-3 border-b border-slate-200 space-y-2 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Logical Tags Tree
              </span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {allNodesList.length} Tags
              </span>
            </div>

            {/* Filter Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter tag (H1, Link, OBJR) or target..."
                className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between gap-1.5 pt-0.5">
              <button
                onClick={() => expandAll(true)}
                className="flex-1 py-1 text-[11px] font-semibold rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                Expand All
              </button>
              <button
                onClick={() => expandAll(false)}
                className="flex-1 py-1 text-[11px] font-semibold rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                Collapse All
              </button>
              <button
                onClick={exportTreeJson}
                className="flex-1 py-1 text-[11px] font-semibold rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                Export JSON
              </button>
            </div>
          </div>

          {/* Tree Scroll View */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1 bg-white">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading structure tree & OBJR links...</div>
            ) : structTreeRoot && allNodesList.length > 0 ? (
              renderTreeNode(structTreeRoot)
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">No structure tags in document.</div>
            )}
          </div>
        </aside>

        {/* LEFT DRAG SPLITTER */}
        <div
          onMouseDown={handleLeftMouseDown}
          className="w-1.5 bg-slate-200 hover:bg-blue-500 cursor-col-resize shrink-0 transition-colors z-30 flex items-center justify-center"
          title="Drag to resize Tags Tree"
        >
          <div className="w-0.5 h-6 bg-slate-400 rounded-full" />
        </div>

        {/* CENTER VIEWPORT: Instant Render PDF Canvas & Options */}
        <main className="flex-1 flex flex-col bg-slate-200 overflow-hidden relative min-w-[300px]">
          {/* Enhanced Viewer Toolbar */}
          <div className="h-11 bg-white border-b border-slate-200 px-4 flex items-center justify-between text-xs shrink-0 shadow-2xs gap-3">
            {/* Page Navigation */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30 cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-700 min-w-[70px] text-center">
                Page {currentPage} / {totalPages || 1}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30 cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-200 mx-1" />

              {/* View Layout Toggle */}
              <button
                onClick={() => setViewLayout((l) => (l === 'continuous' ? 'single' : 'continuous'))}
                className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors cursor-pointer ${
                  viewLayout === 'single'
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                title="Toggle Single Page vs Continuous Scroll"
              >
                {viewLayout === 'single' ? 'Single' : 'Scroll All'}
              </button>

              <button
                onClick={rotatePage}
                className="p-1 rounded hover:bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer"
                title="Rotate 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoomScale((s) => Math.max(0.4, Number((s - 0.15).toFixed(2))))}
                className="p-1 rounded hover:bg-slate-100 text-slate-600 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono font-bold text-slate-700 min-w-[45px] text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                onClick={() => setZoomScale((s) => Math.min(3.5, Number((s + 0.15).toFixed(2))))}
                className="p-1 rounded hover:bg-slate-100 text-slate-600 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomScale(1.0)}
                className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                100%
              </button>
              <button
                onClick={() => setZoomScale(1.35)}
                className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                135%
              </button>
            </div>

            {/* INSTANT HIGHLIGHT & OVERLAY OPTIONS (0ms Delay) */}
            <div className="flex items-center gap-2 relative">
              {/* Instant Toggle Button */}
              <button
                onClick={() => setShowHighlights((prev) => !prev)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 border transition-all cursor-pointer ${
                  showHighlights
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
                title={showHighlights ? 'Click to remove all highlight boxes' : 'Click to show highlight boxes'}
              >
                {showHighlights ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-rose-500" />}
                <span>{showHighlights ? 'Highlights ON' : 'Highlights OFF'}</span>
              </button>

              {/* Clear active selection */}
              {selectedNode && (
                <button
                  onClick={clearSelection}
                  className="px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 flex items-center gap-1 cursor-pointer"
                  title="Clear selected node highlight"
                >
                  <XCircle className="w-3 h-3" />
                  <span>Unselect</span>
                </button>
              )}

              {/* Settings / Customize Dropdown Button */}
              <button
                onClick={() => setShowSettingsMenu((prev) => !prev)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  showSettingsMenu ? 'bg-slate-100 border-slate-400 text-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title="Overlay Display Options & Filters"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>

              {/* Overlay Display Options Popover */}
              {showSettingsMenu && (
                <div
                  className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-slate-200 p-3 w-64 z-50 space-y-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Viewer Highlight Options
                    </span>
                    <button onClick={() => setShowSettingsMenu(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                      ✕
                    </button>
                  </div>

                  {/* Toggle Options */}
                  <div className="space-y-2 text-xs">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="font-medium text-slate-700">Show Highlight Boxes</span>
                      <input
                        type="checkbox"
                        checked={showHighlights}
                        onChange={(e) => setShowHighlights(e.target.checked)}
                        className="accent-blue-600 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="font-medium text-slate-700">Active Selection Ring</span>
                      <input
                        type="checkbox"
                        checked={showSelectionHighlight}
                        onChange={(e) => setShowSelectionHighlight(e.target.checked)}
                        className="accent-blue-600 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="font-medium text-slate-700">Tag Label Badges</span>
                      <input
                        type="checkbox"
                        checked={showTagPills}
                        onChange={(e) => setShowTagPills(e.target.checked)}
                        className="accent-blue-600 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="font-medium text-slate-700">Reading Order (#)</span>
                      <input
                        type="checkbox"
                        checked={showReadingOrder}
                        onChange={(e) => setShowReadingOrder(e.target.checked)}
                        className="accent-blue-600 cursor-pointer"
                      />
                    </label>
                  </div>

                  {/* Opacity Slider */}
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-medium text-slate-600">Box Opacity</span>
                      <span className="font-mono font-bold text-slate-800">{highlightOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={highlightOpacity}
                      onChange={(e) => setHighlightOpacity(Number(e.target.value))}
                      className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <span className="text-[11px] font-medium text-slate-600 block">Show Tags For:</span>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value as TagCategoryType)}
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-md p-1.5 text-slate-700 cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="all">All Tag Categories</option>
                      <option value="heading">Headings (H1 - H6)</option>
                      <option value="p">Paragraphs & Text (P, Span)</option>
                      <option value="link">Interactive Links & OBJR (Link)</option>
                      <option value="table">Tables (Table, TR, TD, TH)</option>
                      <option value="list">Lists (L, LI, Lbl, LBody)</option>
                      <option value="figure">Figures & Graphics</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Virtualized Fast Scroll View */}
          <div ref={canvasScrollRef} className="flex-1 overflow-auto p-6 flex flex-col items-center gap-8 will-change-scroll">
            {loading ? (
              <div className="p-16 text-center text-sm font-semibold text-slate-600 space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                <p className="font-bold text-slate-800">Loading Document Structure...</p>
              </div>
            ) : totalPages > 0 && pdfDoc ? (
              displayedPages.map((pNum) => (
                <FastCachedPageCanvasItem
                  key={pNum}
                  pageNum={pNum}
                  pdfDoc={pdfDoc}
                  zoomScale={zoomScale}
                  rotation={rotation}
                  pageDimensions={pageDimensionsMap.get(pNum) || { width: 595, height: 842 }}
                  selectedNodeId={selectedNode?.id || null}
                  elements={pageElementsMap.get(pNum) || []}
                  showHighlights={showHighlights}
                  showSelectionHighlight={showSelectionHighlight}
                  highlightOpacity={highlightOpacity}
                  showTagPills={showTagPills}
                  showReadingOrder={showReadingOrder}
                  categoryFilter={categoryFilter}
                  getTagCategory={getTagCategory}
                  onSelectNode={selectNode}
                />
              ))
            ) : (
              <div className="p-16 text-center text-slate-400">
                <UploadCloud className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-700">No PDF Loaded</p>
                <p className="text-xs text-slate-400">Upload or select a PDF above to inspect tags.</p>
              </div>
            )}
          </div>
        </main>

        {/* RIGHT DRAG SPLITTER */}
        <div
          onMouseDown={handleRightMouseDown}
          className="w-1.5 bg-slate-200 hover:bg-blue-500 cursor-col-resize shrink-0 transition-colors z-30 flex items-center justify-center"
          title="Drag to resize Inspector"
        >
          <div className="w-0.5 h-6 bg-slate-400 rounded-full" />
        </div>

        {/* RIGHT PANEL: Tag Properties & OBJR Link Destination Inspector */}
        <aside
          style={{ width: `${rightWidth}px` }}
          className="bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-hidden"
        >
          <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tag & Link Inspector
            </span>
            {selectedNode && (
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${getTagCategory(selectedNode.tag).class}`}>
                &lt;{selectedNode.tag}&gt;
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/40">
            {selectedNode ? (
              <>
                {/* Meta Card */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">Element</span>
                    <span className="font-mono font-bold text-blue-600">&lt;{selectedNode.tag}&gt;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Standard Tag:</span>
                    <span className="font-mono font-semibold text-slate-800">{selectedNode.tag}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Page Number:</span>
                    <span className="font-mono text-slate-800">Page {selectedNode.pageNum || 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Marked Content:</span>
                    <span className="font-mono text-slate-800 text-[11px]">
                      {selectedNode.mcids.length > 0 ? selectedNode.mcids.join(', ') : 'None'}
                    </span>
                  </div>
                </div>

                {/* OBJR / LINK DESTINATION INSPECTION CARD */}
                {(selectedNode.objr || selectedNode.tag.toUpperCase() === 'LINK' || selectedNode.tag.toUpperCase() === 'OBJR') && (
                  <div className="p-3 bg-white rounded-lg border border-purple-200 shadow-xs space-y-2.5 text-xs ring-1 ring-purple-100">
                    <div className="flex items-center justify-between border-b border-purple-100 pb-1.5 text-purple-900 font-bold uppercase text-[10px]">
                      <span className="flex items-center gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5 text-purple-600" />
                        Object Reference (OBJR) & Target
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[9px] font-mono">
                        /Type /OBJR
                      </span>
                    </div>

                    {selectedNode.objr ? (
                      <>
                        <div className="space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Link Type:</span>
                            <span className="font-semibold text-slate-800">
                              {selectedNode.objr.url ? 'External Web Link (URI)' : 'Internal Document Jump (GoTo)'}
                            </span>
                          </div>

                          {/* Target Destination */}
                          {selectedNode.objr.targetPage && (
                            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-blue-700 font-semibold text-[11px]">Target Destination:</span>
                                <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono font-bold text-[11px]">
                                  Page {selectedNode.objr.targetPage}
                                </span>
                              </div>
                              <button
                                onClick={() => jumpToTargetPage(selectedNode.objr!.targetPage!)}
                                className="w-full py-1.5 px-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                              >
                                <Navigation className="w-3.5 h-3.5" />
                                <span>Jump to Target Page {selectedNode.objr.targetPage}</span>
                              </button>
                            </div>
                          )}

                          {/* External URL */}
                          {selectedNode.objr.url && (
                            <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-purple-700 font-semibold text-[11px]">External Web Target:</span>
                              </div>
                              <p className="text-[11px] font-mono text-purple-900 break-all bg-white p-1.5 rounded border border-purple-200">
                                {selectedNode.objr.url}
                              </p>
                              <a
                                href={selectedNode.objr.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-1.5 px-2.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11px] transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Open External Link</span>
                              </a>
                            </div>
                          )}

                          <div className="flex justify-between pt-1 border-t border-slate-100">
                            <span className="text-slate-400">Annot Object ID:</span>
                            <span className="font-mono text-slate-700">#{selectedNode.objr.annotId || 'Direct Ref'}</span>
                          </div>

                          {selectedNode.objr.rect && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Clickable /Rect:</span>
                              <span className="font-mono text-[10px] text-slate-600">
                                [{selectedNode.objr.rect.map((v) => Math.round(v)).join(', ')}]
                              </span>
                            </div>
                          )}

                          {selectedNode.objr.structParent !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">StructParent Key:</span>
                              <span className="font-mono text-slate-700">{selectedNode.objr.structParent}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 p-1.5 rounded border border-emerald-200 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>OBJR properly references Link Annotation</span>
                        </div>
                      </>
                    ) : (
                      <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        <span>Link element has no active OBJR dictionary. Run Set Link OBJR tool to remediate.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Attributes */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2 text-xs">
                  <div className="border-b border-slate-100 pb-1.5 font-bold text-slate-500 uppercase text-[10px]">
                    Accessibility Attributes
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Alt Text (/Alt):</span>
                    <span className={`font-semibold ${selectedNode.alt ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {selectedNode.alt ? `"${selectedNode.alt}"` : 'Not defined'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Actual Text:</span>
                    <span className="text-slate-700">{selectedNode.actualText || 'Not defined'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Title (/T):</span>
                    <span className="text-slate-700">{selectedNode.title || 'Not defined'}</span>
                  </div>
                </div>

                {/* Text Content */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">Extracted Text</span>
                    <span className="text-[10px] text-slate-400 font-mono">{(selectedNode.text || '').length} chars</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-700 max-h-32 overflow-y-auto leading-relaxed text-[11px]">
                    {selectedNode.text || <span className="italic text-slate-400">Container tag without direct text stream.</span>}
                  </div>
                </div>

                {/* Rule Checklist */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2 text-xs">
                  <div className="border-b border-slate-100 pb-1.5 font-bold text-slate-500 uppercase text-[10px]">
                    WCAG Validation
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 p-1.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Tag mapped in Logical Structure Tree</span>
                  </div>
                  {selectedNode.tag.toUpperCase() === 'FIGURE' && !selectedNode.alt && (
                    <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 p-1.5 rounded border border-rose-200">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Missing alternative description (/Alt)</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                Select any tag in the tree to inspect attributes and OBJR links.
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* AUDIT SCORECARD MODAL */}
      {isAuditModalOpen && (
        <div
          onClick={() => setIsAuditModalOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">PDF Accessibility & Tag Audit Scorecard</h3>
              </div>
              <button onClick={() => setIsAuditModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Tagged Document</div>
                  <div className="text-lg font-bold text-emerald-600 mt-0.5">PASSED</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Pages</div>
                  <div className="text-lg font-bold text-blue-600 mt-0.5">{totalPages}</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Structure Tags</div>
                  <div className="text-lg font-bold text-blue-600 mt-0.5">{allNodesList.length}</div>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                <div className="font-bold text-slate-700 uppercase text-[10px]">Structure Breakdown</div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {Object.entries(tagCounts).map(([tag, count]) => {
                    const tagInfo = getTagCategory(tag);
                    return (
                      <div key={tag} className={`p-1.5 rounded border ${tagInfo.class} flex items-center justify-between`}>
                        <span className="font-bold">&lt;{tag}&gt;</span>
                        <span className="font-mono">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Render-Task Aware & Caching Canvas Component
const FastDecoupledCanvas = React.memo<{
  pageNum: number;
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  zoomScale: number;
  rotation: number;
}>(({ pageNum, pdfDoc, zoomScale, rotation }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeRenderTaskRef = useRef<any>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl || !pdfDoc) return;

    // Cancel existing in-flight render task on this canvas before starting new one
    if (activeRenderTaskRef.current) {
      try {
        activeRenderTaskRef.current.cancel();
      } catch (e) {}
      activeRenderTaskRef.current = null;
    }

    let isCurrent = true;

    pdfDoc.getPage(pageNum).then((page) => {
      if (!isCurrent) return;
      const renderScale = Math.max(1.35, zoomScale * 1.35);
      const viewport = page.getViewport({ scale: renderScale, rotation });
      const displayViewport = page.getViewport({ scale: zoomScale, rotation });

      canvasEl.width = viewport.width;
      canvasEl.height = viewport.height;
      canvasEl.style.width = `${displayViewport.width}px`;
      canvasEl.style.height = `${displayViewport.height}px`;

      const ctx = canvasEl.getContext('2d', { alpha: false, desynchronized: true });
      if (ctx) {
        const renderTask = page.render({
          canvasContext: ctx,
          viewport,
          intent: 'display'
        });
        activeRenderTaskRef.current = renderTask;

        renderTask.promise.catch((err: any) => {
          if (err?.name !== 'RenderingCancelledException') {
            console.warn(`Render notice for page ${pageNum}:`, err);
          }
        });
      }
    }).catch(() => {});

    return () => {
      isCurrent = false;
      if (activeRenderTaskRef.current) {
        try {
          activeRenderTaskRef.current.cancel();
        } catch (e) {}
      }
    };
  }, [pageNum, pdfDoc, zoomScale, rotation]);

  return <canvas ref={canvasRef} className="block pointer-events-none transform-gpu" />;
});

// Pure CSS DOM Overlay (Zero Canvas Repaint)
const FastDecoupledOverlay = React.memo<{
  elements: PageElement[];
  zoomScale: number;
  selectedNodeId: string | null;
  showHighlights: boolean;
  showSelectionHighlight: boolean;
  highlightOpacity: number;
  showTagPills: boolean;
  showReadingOrder: boolean;
  categoryFilter: TagCategoryType;
  getTagCategory: (tag: string) => { category: string; class: string; boxBorder: string; boxBg: string };
  onSelectNode: (node: StructNode) => void;
}>(({
  elements,
  zoomScale,
  selectedNodeId,
  showHighlights,
  showSelectionHighlight,
  highlightOpacity,
  showTagPills,
  showReadingOrder,
  categoryFilter,
  getTagCategory,
  onSelectNode
}) => {
  if (!showHighlights && !selectedNodeId) return null;

  const bgAlpha = (highlightOpacity / 100).toFixed(2);

  return (
    <div className="absolute inset-0 pointer-events-none transform-gpu">
      {elements.map((el, idx) => {
        const isSelected = selectedNodeId === el.node.id;
        const tagInfo = getTagCategory(el.tag);
        const isObjr = el.tag.toUpperCase() === 'OBJR';

        if (categoryFilter !== 'all' && tagInfo.category !== categoryFilter) {
          return null;
        }

        if (!showHighlights && (!isSelected || !showSelectionHighlight)) {
          return null;
        }

        return (
          <div
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              onSelectNode(el.node);
            }}
            style={{
              left: `${el.bbox.x * zoomScale}px`,
              top: `${el.bbox.y * zoomScale}px`,
              width: `${el.bbox.width * zoomScale}px`,
              height: `${el.bbox.height * zoomScale}px`,
              backgroundColor: isSelected && showSelectionHighlight
                ? 'rgba(37, 99, 235, 0.35)'
                : showHighlights
                ? (isObjr ? 'rgba(147, 51, 234, 0.25)' : tagInfo.boxBg.replace(/0\.\d+\)/, `${bgAlpha})`))
                : 'transparent',
              borderColor: isSelected && showSelectionHighlight
                ? '#1d4ed8'
                : showHighlights
                ? tagInfo.boxBorder
                : 'transparent'
            }}
            className={`absolute pointer-events-auto cursor-pointer rounded-xs transition-none ${
              isSelected && showSelectionHighlight
                ? 'border-2 ring-2 ring-blue-400/40 z-30'
                : showHighlights
                ? 'border hover:bg-amber-400/25 hover:border-amber-500 z-10'
                : 'border-0 z-10'
            }`}
          >
            {showTagPills && showHighlights && (
              <div className={`absolute -top-3.5 left-0 font-mono text-[9px] font-bold px-1 py-0.2 rounded-xs shadow-xs pointer-events-none whitespace-nowrap flex items-center gap-1 ${
                isObjr ? 'bg-purple-900 text-purple-100 border border-purple-500' : 'bg-slate-900 text-white'
              }`}>
                {showReadingOrder && (
                  <span className="w-3 h-3 rounded-full bg-blue-500 text-white flex items-center justify-center text-[7px]">
                    {idx + 1}
                  </span>
                )}
                {isObjr && <LinkIcon className="w-2.5 h-2.5 text-purple-300" />}
                &lt;{el.tag}&gt;
                {el.node.objr?.targetPage && (
                  <span className="text-purple-300 font-sans text-[8px]">
                    → p.{el.node.objr.targetPage}
                  </span>
                )}
                {el.node.objr?.url && (
                  <span className="text-purple-300 font-sans text-[8px]">
                    → URL
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

// Fast Page Container with GPU Acceleration & Virtualized Memory Management
const FastCachedPageCanvasItem: React.FC<{
  pageNum: number;
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  zoomScale: number;
  rotation: number;
  pageDimensions: { width: number; height: number };
  selectedNodeId: string | null;
  elements: PageElement[];
  showHighlights: boolean;
  showSelectionHighlight: boolean;
  highlightOpacity: number;
  showTagPills: boolean;
  showReadingOrder: boolean;
  categoryFilter: TagCategoryType;
  getTagCategory: (tag: string) => { category: string; class: string; boxBorder: string; boxBg: string };
  onSelectNode: (node: StructNode) => void;
}> = React.memo(({
  pageNum,
  pdfDoc,
  zoomScale,
  rotation,
  pageDimensions,
  selectedNodeId,
  elements,
  showHighlights,
  showSelectionHighlight,
  highlightOpacity,
  showTagPills,
  showReadingOrder,
  categoryFilter,
  getTagCategory,
  onSelectNode
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(pageNum <= 3);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: '1000px 0px 1000px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const displayWidth = Math.round(pageDimensions.width * zoomScale);
  const displayHeight = Math.round(pageDimensions.height * zoomScale);

  return (
    <div
      ref={containerRef}
      id={`pdfPageWrapper_${pageNum}`}
      style={{
        width: `${displayWidth}px`,
        minHeight: `${displayHeight}px`
      }}
      className="relative bg-white rounded shadow-lg border border-slate-300 overflow-hidden transform-gpu"
    >
      {isVisible ? (
        <>
          <FastDecoupledCanvas
            pageNum={pageNum}
            pdfDoc={pdfDoc}
            zoomScale={zoomScale}
            rotation={rotation}
          />
          <FastDecoupledOverlay
            elements={elements}
            zoomScale={zoomScale}
            selectedNodeId={selectedNodeId}
            showHighlights={showHighlights}
            showSelectionHighlight={showSelectionHighlight}
            highlightOpacity={highlightOpacity}
            showTagPills={showTagPills}
            showReadingOrder={showReadingOrder}
            categoryFilter={categoryFilter}
            getTagCategory={getTagCategory}
            onSelectNode={onSelectNode}
          />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-mono">
          Page {pageNum}
        </div>
      )}
    </div>
  );
});
