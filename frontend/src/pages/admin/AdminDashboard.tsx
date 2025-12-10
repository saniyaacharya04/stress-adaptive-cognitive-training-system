import { MetricCard } from "@/components/shared/MetricCard";
import { RealtimeChart } from "@/components/shared/RealtimeChart";
import { StressGauge } from "@/components/shared/StressGauge";
import { Users, Activity, Brain, TrendingUp, Clock, Target } from "lucide-react";

// Mock data
const stressTimelineData = Array.from({ length: 20 }, (_, i) => ({
  time: `${i * 3}m`,
  value: 30 + Math.random() * 40,
}));

const performanceData = Array.from({ length: 20 }, (_, i) => ({
  time: `${i * 3}m`,
  value: 70 + Math.random() * 25,
}));

export default function AdminDashboard() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time overview of experiment progress and participant metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Participants"
          value="24"
          subtitle="8 enrolled this week"
          icon={Users}
          variant="primary"
          trend="up"
          trendValue="+12%"
        />
        <MetricCard
          title="Active Sessions"
          value="6"
          subtitle="Currently in progress"
          icon={Activity}
          variant="success"
        />
        <MetricCard
          title="Avg Accuracy"
          value="84.2%"
          subtitle="Across all tasks"
          icon={Target}
          variant="accent"
          trend="up"
          trendValue="+3.1%"
        />
        <MetricCard
          title="Avg Session Time"
          value="18:45"
          subtitle="Minutes per session"
          icon={Clock}
          variant="default"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stress Overview */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Real-time Stress Levels
          </h3>
          <div className="flex items-center justify-around py-4">
            <div className="text-center">
              <StressGauge level={32} size="sm" showLabel={false} />
              <p className="text-xs text-muted-foreground mt-2">Low</p>
              <p className="text-lg font-bold text-stress-low">12</p>
            </div>
            <div className="text-center">
              <StressGauge level={55} size="sm" showLabel={false} />
              <p className="text-xs text-muted-foreground mt-2">Medium</p>
              <p className="text-lg font-bold text-stress-medium">8</p>
            </div>
            <div className="text-center">
              <StressGauge level={78} size="sm" showLabel={false} />
              <p className="text-xs text-muted-foreground mt-2">High</p>
              <p className="text-lg font-bold text-stress-high">4</p>
            </div>
          </div>
        </div>

        {/* Stress Timeline */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold">Average Stress Timeline</h3>
          <RealtimeChart 
            data={stressTimelineData} 
            color="stress-medium"
            height={160}
            unit="%"
          />
        </div>

        {/* Performance Timeline */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold">Average Performance</h3>
          <RealtimeChart 
            data={performanceData} 
            color="accent"
            height={160}
            unit="%"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {[
            { id: "P-2024-0042", action: "Completed session", time: "2 min ago", status: "success" },
            { id: "P-2024-0038", action: "Started N-Back task", time: "5 min ago", status: "active" },
            { id: "P-2024-0041", action: "Taking break", time: "8 min ago", status: "break" },
            { id: "P-2024-0039", action: "High stress detected", time: "12 min ago", status: "alert" },
            { id: "P-2024-0040", action: "Enrolled", time: "25 min ago", status: "new" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  item.status === "success" ? "bg-stress-low" :
                  item.status === "active" ? "bg-primary animate-pulse" :
                  item.status === "break" ? "bg-accent" :
                  item.status === "alert" ? "bg-stress-high" :
                  "bg-muted-foreground"
                }`} />
                <span className="font-mono text-sm">{item.id}</span>
                <span className="text-muted-foreground">{item.action}</span>
              </div>
              <span className="text-sm text-muted-foreground">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
