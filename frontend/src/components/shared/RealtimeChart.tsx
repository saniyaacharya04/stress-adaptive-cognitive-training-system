import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { cn } from "@/lib/utils";

interface DataPoint {
  time: string;
  value: number;
}

interface RealtimeChartProps {
  data: DataPoint[];
  color?: "primary" | "accent" | "stress-low" | "stress-medium" | "stress-high";
  title?: string;
  unit?: string;
  height?: number;
  showArea?: boolean;
  className?: string;
}

export function RealtimeChart({
  data,
  color = "primary",
  title,
  unit = "",
  height = 120,
  showArea = true,
  className,
}: RealtimeChartProps) {
  const colorMap = {
    primary: "hsl(243, 100%, 69%)",
    accent: "hsl(184, 100%, 41%)",
    "stress-low": "hsl(142, 76%, 36%)",
    "stress-medium": "hsl(45, 93%, 47%)",
    "stress-high": "hsl(0, 84%, 60%)",
  };

  const strokeColor = colorMap[color];

  return (
    <div className={cn("space-y-2", className)}>
      {title && (
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      )}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {showArea ? (
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10, fill: "hsl(220, 15%, 50%)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: "hsl(220, 15%, 50%)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(220, 20%, 90%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value}${unit}`, title || "Value"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={strokeColor}
                strokeWidth={2}
                fill={`url(#gradient-${color})`}
              />
            </AreaChart>
          ) : (
            <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10, fill: "hsl(220, 15%, 50%)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: "hsl(220, 15%, 50%)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(220, 20%, 90%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value}${unit}`, title || "Value"]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={strokeColor}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
