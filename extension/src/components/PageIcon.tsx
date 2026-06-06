import { FileText, FolderClosed, FolderOpen } from "lucide-react";
import type { PageKind } from "@/storage/types";

interface PageIconProps {
  /** Whether the item is a page or directory. */
  kind: PageKind;
  /** Icon size in pixels. */
  size?: number;
  /** When true, directory icons render in an open state. */
  expanded?: boolean;
  className?: string;
}

/** Minimal Lucide icon for sidebar rows, search results, and page headers. */
export function PageIcon({
  kind,
  size = 14,
  expanded = false,
  className = ""
}: PageIconProps) {
  const iconClass = ["shrink-0 text-[var(--ko-text-muted)]", className]
    .filter((value) => value.length > 0)
    .join(" ");

  if (kind === "directory") {
    const DirectoryIcon = expanded ? FolderOpen : FolderClosed;
    return <DirectoryIcon size={size} className={iconClass} strokeWidth={1.75} />;
  }

  return <FileText size={size} className={iconClass} strokeWidth={1.75} />;
}
