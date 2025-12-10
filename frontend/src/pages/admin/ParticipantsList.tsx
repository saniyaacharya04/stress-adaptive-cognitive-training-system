import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, UserPlus, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const mockParticipants = [
  { id: "P-2024-0042", created: "2024-12-01", group: "Adaptive", sessions: 5, lastSession: "2024-12-09", status: "active" },
  { id: "P-2024-0041", created: "2024-12-01", group: "Control", sessions: 4, lastSession: "2024-12-08", status: "active" },
  { id: "P-2024-0040", created: "2024-11-28", group: "Adaptive", sessions: 8, lastSession: "2024-12-09", status: "active" },
  { id: "P-2024-0039", created: "2024-11-25", group: "Control", sessions: 6, lastSession: "2024-12-07", status: "completed" },
  { id: "P-2024-0038", created: "2024-11-22", group: "Adaptive", sessions: 10, lastSession: "2024-12-09", status: "active" },
  { id: "P-2024-0037", created: "2024-11-20", group: "Control", sessions: 7, lastSession: "2024-12-05", status: "completed" },
  { id: "P-2024-0036", created: "2024-11-18", group: "Adaptive", sessions: 3, lastSession: "2024-12-01", status: "inactive" },
  { id: "P-2024-0035", created: "2024-11-15", group: "Control", sessions: 9, lastSession: "2024-12-04", status: "completed" },
];

export default function ParticipantsList() {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredParticipants = mockParticipants.filter(p => {
    const matchesSearch = p.id.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = groupFilter === "all" || p.group.toLowerCase() === groupFilter;
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesGroup && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-stress-low/10 text-stress-low border-stress-low/20",
      completed: "bg-primary/10 text-primary border-primary/20",
      inactive: "bg-muted text-muted-foreground border-border",
    };
    return styles[status as keyof typeof styles] || styles.inactive;
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Participants</h1>
          <p className="text-muted-foreground">
            Manage and view all study participants
          </p>
        </div>
        <Button variant="gradient" className="gap-2">
          <UserPlus className="w-4 h-4" />
          Add Participant
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            <SelectItem value="adaptive">Adaptive</SelectItem>
            <SelectItem value="control">Control</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Participant ID</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Sessions</TableHead>
              <TableHead>Last Session</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParticipants.map((participant) => (
              <TableRow key={participant.id} className="hover:bg-muted/50">
                <TableCell className="font-mono font-medium">{participant.id}</TableCell>
                <TableCell>{participant.created}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    participant.group === "Adaptive" 
                      ? "bg-accent/10 text-accent" 
                      : "bg-secondary text-secondary-foreground"
                  }`}>
                    {participant.group}
                  </span>
                </TableCell>
                <TableCell>{participant.sessions}</TableCell>
                <TableCell>{participant.lastSession}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(participant.status)}`}>
                    {participant.status}
                  </span>
                </TableCell>
                <TableCell>
                  <Link to={`/admin/participants/${participant.id}`}>
                    <Button variant="ghost" size="sm">
                      View
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {filteredParticipants.length} of {mockParticipants.length} participants</span>
        <div className="flex items-center gap-4">
          <span>Active: {mockParticipants.filter(p => p.status === "active").length}</span>
          <span>Completed: {mockParticipants.filter(p => p.status === "completed").length}</span>
        </div>
      </div>
    </div>
  );
}
