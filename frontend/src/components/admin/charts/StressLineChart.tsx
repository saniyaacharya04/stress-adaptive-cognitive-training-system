import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export default function StressLineChart({ data }: { data: any[] }) {
  return (
    <div className="h-80 w-full bg-white rounded-xl shadow-md p-4">
      <h2 className="font-semibold mb-2">Stress Level Over Time</h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" hide />
          <YAxis domain={[0, 1]} />
          <Tooltip />
          <Line type="monotone" dataKey="smoothed_high" stroke="#ff4d4f" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
