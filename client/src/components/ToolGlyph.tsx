/**
 * CachePDF Design Note: Icons remain thin, technical, and high-contrast to reinforce the
 * Technical Trust Ledger system without introducing generic dashboard ornament.
 */
import type { LucideIcon } from "lucide-react";
import {
  ArrowDownToLine,
  ArrowUpDown,
  BadgeCheck,
  Combine,
  FileDown,
  FileImage,
  FileKey2,
  FileLock2,
  FileOutput,
  FilePenLine,
  FileSearch,
  FileStack,
  FileText,
  Files,
  GitCompareArrows,
  Hash,
  ImageDown,
  ImagePlus,
  Layers2,
  Maximize2,
  ScanSearch,
  Scissors,
  ShieldCheck,
  Shrink,
  Sparkles,
  Stamp,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";

const glyphs: Record<string, LucideIcon> = {
  merge: Combine,
  split: Scissors,
  extract: FileDown,
  reorder: ArrowUpDown,
  delete: Trash2,
  rotate: Undo2,
  compress: Shrink,
  flatten: Layers2,
  clean: Sparkles,
  images: ImagePlus,
  pdfimages: FileImage,
  text: FileText,
  scan: ScanSearch,
  metadata: ShieldCheck,
  redact: FilePenLine,
  password: FileKey2,
  permissions: FileLock2,
  numbers: Hash,
  watermark: Stamp,
  fill: FileOutput,
  sign: BadgeCheck,
  compare: GitCompareArrows,
  ocr: FileSearch,
  extractimages: ImageDown,
  extracttext: Type,
};

export function ToolGlyph({ name, className = "" }: { name: string; className?: string }) {
  const Icon = glyphs[name] ?? Files;
  return <Icon className={className} strokeWidth={1.75} aria-hidden="true" />;
}
