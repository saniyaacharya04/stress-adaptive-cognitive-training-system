import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { queryLogs, exportParticipantCSV } from "@/api/admin";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ParticipantDetail() {
  const { id } = useParams();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  /* -------------------- LOAD LOGS -------------------- */
  useEffect(() => {
    async function fetchLogs() {
      if (!id) return;

      setLoading(true);
      try {
        const res = await queryLogs({ participant_id: id });
        if (res.ok) setLogs(res.data);
        else toast.error(res.error || "Failed to load logs");
      } catch {
        toast.error("Network error loading logs");
      }
      setLoading(false);
    }
    fetchLogs();
  }, [id]);

  /* -------------------- EXPORT CSV -------------------- */
  const handleExport = async () => {
    if (!id) return;

    setExporting(true);
    const res = await exportParticipantCSV(id);

    if (!res.ok) {
      toast.error(res.error || "CSV export failed");
      setExporting(false);
      return;
    }

    // Create downloadable link
    const blob = res.blob!;
    const url = window.URL.createObjectURL(blob);

    const filename = `participant_${id}_logs.csv`;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    toast.success(`Exported as ${filename}`);
    setExporting(false);
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Participant {id}</h1>

      {/* EXPORT BUTTON */}
      <Button onClick={handleExport} disabled={exporting}>
        {exporting ? "Exporting..." : "Export CSV"}
      </Button>

      <div className="border p-4 rounded-lg mt-4 bg-white shadow-sm">
        <h2 className="font-semibold mb-2">Logs</h2>

        {loading ? (
          <p>Loading logs...</p>
        ) : logs.length === 0 ? (
          <p>No logs found.</p>
        ) : (
          <pre className="text-xs overflow-x-scroll max-h-96">
            {JSON.stringify(logs, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
