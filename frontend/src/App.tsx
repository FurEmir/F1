import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import RequireRole from "@/components/layout/RequireRole";
import AppShell from "@/components/layout/AppShell";
import Login from "@/pages/Login";
import Privacy from "@/pages/Privacy";
import Dashboard from "@/pages/Dashboard";
import Missions from "@/pages/Missions";
import TeacherPanel from "@/pages/TeacherPanel";
import Simulations from "@/pages/Simulations";
import {
  AchievementsPage,
  EvidenceBoardPage,
  MentorPage,
  ProfilePage,
  TechTreePage,
} from "@/pages/StudentPages";

// One <Route> per page; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <>
      <Routes>
        <Route path="/giris" element={<Login />} />
        <Route path="/gizlilik" element={<Privacy />} />

        <Route
          path="/"
          element={
            <RequireRole roles={["student"]}>
              {(u) => (
                <AppShell user={u}>
                  <Dashboard user={u} />
                </AppShell>
              )}
            </RequireRole>
          }
        />
        <Route
          path="/gorevler"
          element={
            <RequireRole roles={["student"]}>
              {(u) => (
                <AppShell user={u}>
                  <Missions />
                </AppShell>
              )}
            </RequireRole>
          }
        />
        <Route
          path="/gorevler/:missionId"
          element={
            <RequireRole roles={["student"]}>
              {(u) => (
                <AppShell user={u}>
                  <Missions />
                </AppShell>
              )}
            </RequireRole>
          }
        />
        <Route
          path="/kanit-panosu"
          element={
            <RequireRole roles={["student"]}>
              {(u) => (
                <AppShell user={u}>
                  <EvidenceBoardPage />
                </AppShell>
              )}
            </RequireRole>
          }
        />
        <Route
          path="/teknoloji-agaci"
          element={
            <RequireRole roles={["student"]}>
              {(u) => (
                <AppShell user={u}>
                  <TechTreePage />
                </AppShell>
              )}
            </RequireRole>
          }
        />
        <Route
          path="/simulasyonlar"
          element={
            <RequireRole roles={["student"]}>
              {(u) => (
                <AppShell user={u}>
                  <Simulations />
                </AppShell>
              )}
            </RequireRole>
          }
        />
        <Route
          path="/mentor"
          element={
            <RequireRole roles={["student"]}>
              {(u) => (
                <AppShell user={u}>
                  <MentorPage />
                </AppShell>
              )}
            </RequireRole>
          }
        />
        <Route
          path="/basarilar"
          element={
            <RequireRole roles={["student"]}>
              {(u) => (
                <AppShell user={u}>
                  <AchievementsPage user={u} />
                </AppShell>
              )}
            </RequireRole>
          }
        />
        <Route
          path="/profil"
          element={
            <RequireRole roles={["student"]}>
              {(u) => (
                <AppShell user={u}>
                  <ProfilePage user={u} />
                </AppShell>
              )}
            </RequireRole>
          }
        />

        <Route
          path="/pano"
          element={
            <RequireRole roles={["teacher", "admin"]}>
              {(u) => (
                <AppShell user={u}>
                  <TeacherPanel user={u} />
                </AppShell>
              )}
            </RequireRole>
          }
        />

        <Route path="*" element={<Navigate to="/giris" replace />} />
      </Routes>
      <Toaster richColors />
    </>
  );
}
