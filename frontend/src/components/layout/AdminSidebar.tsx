import { NavLink } from "@/components/NavLink";
import { 
  LayoutDashboard, 
  Users, 
  Monitor, 
  FileText, 
  Settings, 
  Play,
  LogOut,
  Brain
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Participants", url: "/admin/participants", icon: Users },
  { title: "Monitoring", url: "/admin/monitoring", icon: Monitor },
  { title: "Log Browser", url: "/admin/logs", icon: FileText },
  { title: "Experiment Control", url: "/admin/control", icon: Play },
];

export function AdminSidebar() {
  return (
    <aside className="w-64 min-h-screen bg-sidebar text-sidebar-foreground flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl primary-gradient">
            <Brain className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg">SACTS</h1>
            <p className="text-xs text-sidebar-foreground/60">Researcher Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/admin"}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
              "hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground"
            )}
            activeClassName="bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
          >
            <item.icon className="w-5 h-5" />
            {item.title}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <NavLink
          to="/admin/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
        >
          <Settings className="w-5 h-5" />
          Settings
        </NavLink>
        <NavLink
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
        >
          <LogOut className="w-5 h-5" />
          Exit to Home
        </NavLink>
      </div>
    </aside>
  );
}
