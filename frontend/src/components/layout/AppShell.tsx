import TopNav from "@/components/layout/TopNav";
import AppFooter from "@/components/layout/AppFooter";
import AmbientBackground from "@/components/layout/AmbientBackground";
import SafetyOnboardingModal from "@/components/game/SafetyOnboardingModal";
import type { UserProfile } from "@/types";

// Shell renders unconditionally — a failed fetch degrades regions, never the whole page.
export default function AppShell({ user, children }: { user: UserProfile; children: React.ReactNode }) {
  const needsOnboarding = user.role === "student" && !user.onboarded;
  return (
    <div className="relative flex min-h-svh flex-col">
      <AmbientBackground />
      <TopNav user={user} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <AppFooter />
      {needsOnboarding && <SafetyOnboardingModal />}
    </div>
  );
}
