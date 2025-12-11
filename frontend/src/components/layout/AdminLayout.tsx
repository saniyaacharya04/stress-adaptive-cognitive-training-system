import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function AdminLayout() {
  const nav = useNavigate();

  const logout = () => {
    localStorage.removeItem("admin_token");
    nav("/admin/login");
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-900 text-white p-6 space-y-4">
        <h2 className="text-xl font-bold">Admin Panel</h2>

        <nav className="space-y-2">
          <a href="/admin" className="block">Dashboard</a>
          <a href="/admin/participants" className="block">Participants</a>
          <a href="/admin/logs" className="block">Logs</a>
          <a href="/admin/monitoring" className="block">Monitoring</a>
        </nav>

        <Button variant="destructive" onClick={logout} className="mt-6 w-full">
          Logout
        </Button>
      </aside>

      <main className="flex-1 p-6 bg-muted">
        <Outlet />
      </main>
    </div>
  );
}
