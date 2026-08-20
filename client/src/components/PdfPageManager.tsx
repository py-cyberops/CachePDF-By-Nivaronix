/**
 * OnePDF Design Note: The page manager treats each PDF page as a tactile work surface. It uses
 * rendered thumbnails, deliberate cyan selection states, and accessible drag ordering—not a
 * generic table—so high-stakes document changes remain easy to inspect.
 */
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, LoaderCircle, RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  loadBrowserPdf,
  renderPdfPageToCanvas,
  type BrowserPdfDocument,
} from "@/lib/pdfBrowser";

type PdfPageManagerProps = {
  file: File;
  pageOrder: number[];
  onPageOrderChange: (order: number[]) => void;
  selectedPages: number[];
  onSelectedPagesChange: (pages: number[]) => void;
  pageRotations: Record<number, number>;
  onRotatePage: (pageNumber: number) => void;
  reorderEnabled: boolean;
  rotationEnabled: boolean;
  selectionLabel: string;
};

export default function PdfPageManager({
  file,
  pageOrder,
  onPageOrderChange,
  selectedPages,
  onSelectedPagesChange,
  pageRotations,
  onRotatePage,
  reorderEnabled,
  rotationEnabled,
  selectionLabel,
}: PdfPageManagerProps) {
  const [pdf, setPdf] = useState<BrowserPdfDocument | null>(null);
  const [loadError, setLoadError] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    let isCurrent = true;
    setPdf(null);
    setLoadError("");
    void loadBrowserPdf(file)
      .then((nextPdf) => { if (isCurrent) setPdf(nextPdf); })
      .catch(() => { if (isCurrent) setLoadError("Page previews could not be rendered for this PDF."); });
    return () => { isCurrent = false; };
  }, [file]);

  function togglePage(pageNumber: number) {
    onSelectedPagesChange(
      selectedPages.includes(pageNumber)
        ? selectedPages.filter((page) => page !== pageNumber)
        : [...selectedPages, pageNumber].sort((a, b) => a - b),
    );
  }

  function toggleAll() {
    onSelectedPagesChange(selectedPages.length === pageOrder.length ? [] : [...pageOrder].sort((a, b) => a - b));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!reorderEnabled || !over || active.id === over.id) return;
    const oldIndex = pageOrder.indexOf(Number(active.id));
    const newIndex = pageOrder.indexOf(Number(over.id));
    if (oldIndex >= 0 && newIndex >= 0) onPageOrderChange(arrayMove(pageOrder, oldIndex, newIndex));
  }

  return (
    <div className="page-manager mt-7 border-t border-white/[0.09] pt-7">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a7b2c1]">02 // Inspect pages</p>
          <p className="mt-2 text-sm leading-6 text-[#8d99aa]">
            {reorderEnabled ? "Drag pages into their new order. Use the keyboard drag control when preferred." : selectionLabel}
          </p>
        </div>
        <button type="button" className="button-secondary h-9 px-3 text-xs" onClick={toggleAll}>
          {selectedPages.length === pageOrder.length ? "Clear selection" : "Select all"}
        </button>
      </div>

      {loadError ? (
        <p className="mt-5 rounded-[10px] border border-[#f47575]/25 bg-[#f47575]/[0.06] p-4 text-sm text-[#dc9aa4]">{loadError}</p>
      ) : !pdf ? (
        <div className="mt-5 flex min-h-44 items-center justify-center rounded-[12px] border border-white/[0.1] bg-[#0a0e14] text-sm text-[#8d99aa]"><LoaderCircle className="mr-2 h-4 w-4 animate-spin text-[#05c8f6]" />Rendering page previews locally</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={pageOrder} strategy={rectSortingStrategy}>
            <div className="page-thumbnail-grid mt-5">
              {pageOrder.map((pageNumber, orderIndex) => (
                <SortablePageThumbnail
                  key={pageNumber}
                  pageNumber={pageNumber}
                  orderIndex={orderIndex}
                  pdf={pdf}
                  selected={selectedPages.includes(pageNumber)}
                  rotation={pageRotations[pageNumber] ?? 0}
                  onSelect={() => togglePage(pageNumber)}
                  onRotate={() => onRotatePage(pageNumber)}
                  reorderEnabled={reorderEnabled}
                  rotationEnabled={rotationEnabled}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortablePageThumbnail({
  pageNumber,
  orderIndex,
  pdf,
  selected,
  rotation,
  onSelect,
  onRotate,
  reorderEnabled,
  rotationEnabled,
}: {
  pageNumber: number;
  orderIndex: number;
  pdf: BrowserPdfDocument;
  selected: boolean;
  rotation: number;
  onSelect: () => void;
  onRotate: () => void;
  reorderEnabled: boolean;
  rotationEnabled: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewError, setPreviewError] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: pageNumber, disabled: !reorderEnabled });

  useEffect(() => {
    let active = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setPreviewError(false);
    void renderPdfPageToCanvas(pdf, pageNumber, canvas, 176).catch(() => { if (active) setPreviewError(true); });
    return () => { active = false; };
  }, [pdf, pageNumber]);

  return (
    <article
      ref={setNodeRef}
      className={`page-thumbnail ${selected ? "page-thumbnail-selected" : ""} ${isDragging ? "page-thumbnail-dragging" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <div className="relative overflow-hidden rounded-[9px] border border-white/[0.09] bg-[#eef2f5]">
        <canvas ref={canvasRef} className="block h-auto w-full origin-center bg-white" style={{ transform: `rotate(${rotation}deg)` }} aria-label={`Preview of page ${pageNumber}`} />
        {previewError && <div className="absolute inset-0 flex items-center justify-center bg-[#111821] p-3 text-center font-mono text-[9px] uppercase tracking-[0.1em] text-[#8d99aa]">Preview unavailable</div>}
        <button type="button" className={`thumbnail-select ${selected ? "thumbnail-select-active" : ""}`} onClick={onSelect} aria-label={`${selected ? "Deselect" : "Select"} page ${pageNumber}`}>
          {selected ? <Check className="h-3.5 w-3.5" strokeWidth={2.6} /> : <span />}
        </button>
        {reorderEnabled && <button type="button" className="thumbnail-drag" aria-label={`Drag page ${pageNumber} to change order`} {...attributes} {...listeners}><GripVertical className="h-4 w-4" /></button>}
        {rotationEnabled && <button type="button" className="thumbnail-rotate" onClick={onRotate} aria-label={`Rotate page ${pageNumber} by 90 degrees`}><RotateCw className="h-3.5 w-3.5" /></button>}
      </div>
      <div className="mt-2 flex items-center justify-between px-0.5"><span className="font-mono text-[9px] uppercase tracking-[0.11em] text-[#91a0b2]">Page {pageNumber}</span>{reorderEnabled && <span className="font-mono text-[9px] text-[#05c8f6]">#{orderIndex + 1}</span>}</div>
    </article>
  );
}
