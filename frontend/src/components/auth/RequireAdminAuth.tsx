import { Navigate } from "react-router-dom";

export default function RequireAdminAuth({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem("admin_token");
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}
