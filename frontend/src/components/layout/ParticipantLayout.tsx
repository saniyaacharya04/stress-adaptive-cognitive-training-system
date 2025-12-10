import { Outlet } from "react-router-dom";

export function ParticipantLayout() {
  return (
    <div className="min-h-screen w-full calm-gradient">
      <Outlet />
    </div>
  );
}
