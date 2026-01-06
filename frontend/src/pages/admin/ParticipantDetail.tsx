import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  queryLogs,
  exportParticipantCSV,
  exportJSON,
  exportExcel,
} from "@/api/admin";

import { Button } from "@/components/ui/button";
import CsvPreviewModal from "@/components/admin/CsvPreviewModal";

export default function ParticipantDetail() {
  const { id } = useParams();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // CSV preview modal state
  const [csvModal, setCsvModal] = useState(false);
  const [csvText, setCsvText] = useState("");

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      const res = await queryLogs({ participant_id: id });

      if (res.ok) setLogs(res.data);
      else alert(res.error);

      setLoading(false);
    };

    load();
  }, [id]);

  /* ---------- Download CSV Blob ---------- */
  const handleDownloadCSV = async () => {
    if (!id) return;

    try {
      const blob = await exportParticipantCSV(id);
      const filename = `${id}_${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.csv`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV download failed:", err);
      alert("CSV download failed.");
    }
  };

  /* ---------- Preview CSV in modal ---------- */
  const handlePreviewCSV = async () => {
    try {
      const blob = await exportParticipantCSV(id!);
      const text = await blob.text();
      setCsvText(text);
      setCsvModal(true);
    } catch (err) {
      console.error("Preview error:", err);
      alert("Could not load CSV preview.");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">
        Participant Details – {id}
      </h1>

      {/* EXPORT BUTTONS */}
      <div className="flex gap-3">
        <Button onClick={handlePreviewCSV} variant="secondary">
          Preview CSV
        </Button>

        <Button onClick={handleDownloadCSV} variant="default">
          Download CSV
        </Button>

        <Button onClick={() => exportJSON(id!)} variant="outline">
          Export JSON
        </Button>

        <Button onClick={() => exportExcel(id!)} variant="outline">
          Export XLSX
        </Button>
      </div>

      {/* CSV Preview Modal */}
      <CsvPreviewModal
        open={csvModal}
        csv={csvText}
        onClose={() => setCsvModal(false)}
        onDownload={handleDownloadCSV}
      />

      {/* LOG TABLE */}
      <div className="border rounded-lg p-4 bg-white">
        {loading ? (
          <p>Loading logs...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">Time</th>
                <th className="p-2">Task</th>
                <th className="p-2">Event</th>
                <th className="p-2">Trial</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((row) => (
                <tr key={row.id} className="border-b">
                  <td className="p-2">{row.timestamp}</td>
                  <td className="p-2">{row.task}</td>
                  <td className="p-2">{row.event}</td>
                  <td className="p-2">{row.trial}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
