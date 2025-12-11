import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function useAdminAuth() {
  const nav = useNavigate();
  useEffect(() => {
    const t = localStorage.getItem("admin_token");
    if (!t) nav("/admin/login");
  }, []);
}
