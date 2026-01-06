import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CsvPreviewModalProps {
  open: boolean;
  csv: string;
  onClose: () => void;
  onDownload?: () => void;
}

export default function CsvPreviewModal({ open, csv, onClose, onDownload }: CsvPreviewModalProps) {
  const preview = csv ? csv.split("\n").slice(0, 20).join("\n") : "";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>CSV Preview</DialogTitle>
        </DialogHeader>

        <pre className="p-3 bg-muted rounded-lg text-xs max-h-96 overflow-auto whitespace-pre-wrap">
          {preview || "No data available"}
        </pre>

        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {onDownload && <Button onClick={onDownload}>Download CSV</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
