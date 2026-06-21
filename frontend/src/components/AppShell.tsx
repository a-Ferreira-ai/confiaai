import { Outlet } from "react-router-dom";
import BottomTabBar from "./BottomTabBar";

export default function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-light">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col pb-20 pr-4">
        <Outlet />
      </div>
      <BottomTabBar />
    </div>
  );
}
