import { Navigate } from "react-router-dom";
import { getToken, getUserRole } from "../utils/auth";

export default function ProtectedRoute({
  children,
  role,
}: {
  children: JSX.Element;
  role?: string;
}) {
  const token = getToken();
  const userRole = getUserRole();

  if (!token) return <Navigate to="/login" />;

  if (role && userRole !== role) {
    return <Navigate to="/login" />;
  }

  return children;
}
