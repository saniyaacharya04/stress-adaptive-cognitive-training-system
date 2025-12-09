import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RealtimeChart } from "@/components/shared/RealtimeChart";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { Search, Filter, FileJson } from "lucide-react";

const mockLogs = [
  { timestamp: "2024-12-09T14:32:15", participant: "P-2024-0042", task: "N-Back", event: "trial_complete", stress: 35, accuracy: true, rt: 423 },
  { timestamp: "2024-12-09T14:32:12", participant: "P-2024-0042", task: "N-Back", event: "stimulus_shown", stress: 34, accuracy: null, rt: null },
  { timestamp: "2024-12-09T14:31:58", participant: "P-2024-0041", task: "Stroop", event: "trial_complete", stress: 58, accuracy: false, rt: 892 },
  { timestamp: "2024-12-09T14:31:45", participant: "P-2024-0040", task: "N-Back", event: "difficulty_adjusted", stress: 72, accuracy: null, rt: null },
  { timestamp: "2024-12-09T14:31:30", participant: "P-2024-0038", task: "Break", event: "break_started", stress: 28, accuracy: null, rt: null },
  { timestamp: "2024-12-09T14:31:15", participant: "P-2024-0042", task: "N-Back", event: "trial_complete", stress: 36, accuracy: true, rt: 398 },
  { timestamp: "2024-12-09T14:31:00", participant: "P-2024-0040", task: "N-Back", event: "high_stress_alert", stress: 78, accuracy: null, rt: null },
  { timestamp: "2024-12-09T14:30:45", participant: "P-2024-0041", task: "Stroop", event: "trial_complete", stress: 55, accuracy: true, rt: 654 },
];

const hrvData = Array.from({ length: 20 }, (_, i) => ({
  time: `${i}s`,
  value: 60 + Math.sin(i / 2) * 15 + Math.random() * 10,
}));

export default function LogBrowser() {
  const [search, setSearch] = useState("");
  const [taskFilter, setTaskFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");

  const filteredLogs = mockLogs.filter(log => {
    const matchesSearch = log.participant.toLowerCase().includes(search.toLowerCase());
    const matchesTask = taskFilter === "all" || log.task === taskFilter;
    const matchesEvent = eventFilter === "all" || log.event === eventFilter;
    return matchesSearch && matchesTask && matchesEvent;
  });

  const getEventColor = (event: string) => {
    if (event.includes("complete")) return "text-stress-low";
    if (event.includes("alert") || event.includes("high")) return "text-stress-high";
    if (event.includes("adjusted")) return "text-stress-medium";
    return "text-muted-foreground";
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Log Browser</h1>
          <p className="text-muted-foreground">
            Browse and analyze experiment event logs
          </p>
        </div>
        <ExportButtons 
          onExportCSV={() => {}}
          onExportJSON={() => {}}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by participant ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={taskFilter} onValueChange={setTaskFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Task" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="N-Back">N-Back</SelectItem>
            <SelectItem value="Stroop">Stroop</SelectItem>
            <SelectItem value="Reaction">Reaction</SelectItem>
            <SelectItem value="Break">Break</SelectItem>
          </SelectContent>
        </Select>

        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="trial_complete">Trial Complete</SelectItem>
            <SelectItem value="stimulus_shown">Stimulus Shown</SelectItem>
            <SelectItem value="difficulty_adjusted">Difficulty Adjusted</SelectItem>
            <SelectItem value="high_stress_alert">High Stress Alert</SelectItem>
            <SelectItem value="break_started">Break Started</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Log List */}
        <div className="lg:col-span-2 glass-card p-4 space-y-2 max-h-[600px] overflow-auto">
          <div className="flex items-center gap-2 p-2 text-xs font-medium text-muted-foreground border-b border-border">
            <FileJson className="w-4 h-4" />
            Event Logs ({filteredLogs.length})
          </div>
          {filteredLogs.map((log, i) => (
            <div 
              key={i}
              className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors font-mono text-xs space-y-1"
            >
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{log.timestamp}</span>
                <span className="font-medium">{log.participant}</span>
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {log.task}
                </span>
                <span className={getEventColor(log.event)}>
                  {log.event}
                </span>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>stress: {log.stress}</span>
                {log.accuracy !== null && (
                  <span>accuracy: {log.accuracy ? "✓" : "✗"}</span>
                )}
                {log.rt && <span>rt: {log.rt}ms</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Side Charts */}
        <div className="space-y-4">
          <div className="glass-card p-4">
            <h3 className="font-semibold mb-4">HRV Trend</h3>
            <RealtimeChart 
              data={hrvData} 
              color="accent"
              height={140}
              unit=" bpm"
            />
          </div>
          <div className="glass-card p-4 space-y-3">
            <h3 className="font-semibold">Event Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Events:</span>
                <span className="font-mono">{mockLogs.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trials Completed:</span>
                <span className="font-mono">{mockLogs.filter(l => l.event === "trial_complete").length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">High Stress Alerts:</span>
                <span className="font-mono text-stress-high">{mockLogs.filter(l => l.event.includes("alert")).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Difficulty Adjustments:</span>
                <span className="font-mono">{mockLogs.filter(l => l.event.includes("adjusted")).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
