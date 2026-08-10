import { createFileRoute, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { LoadingState } from "@/components/ui-states";
import { useProfile } from "@/lib/data";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const onOnboarding = pathname === "/onboarding";

  useEffect(() => {
    if (!isLoading && profile && !profile.onboarded && !onOnboarding) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [isLoading, profile, onOnboarding, navigate]);

  return (
    <AppShell>
      {isLoading ? <LoadingState label="Loading your workspace…" /> : <Outlet />}
    </AppShell>
  );
}
