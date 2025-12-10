import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportButtonsProps {
  onExportCSV?: () => void;
  onExportPDF?: () => void;
  onExportJSON?: () => void;
  className?: string;
  size?: "sm" | "default";
}

export function ExportButtons({
  onExportCSV,
  onExportPDF,
  onExportJSON,
  className,
  size = "default",
}: ExportButtonsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {onExportCSV && (
        <Button
          variant="outline"
          size={size}
          onClick={onExportCSV}
          className="gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          CSV
        </Button>
      )}
      {onExportPDF && (
        <Button
          variant="outline"
          size={size}
          onClick={onExportPDF}
          className="gap-2"
        >
          <FileText className="w-4 h-4" />
          PDF
        </Button>
      )}
      {onExportJSON && (
        <Button
          variant="outline"
          size={size}
          onClick={onExportJSON}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          JSON
        </Button>
      )}
    </div>
  );
}
