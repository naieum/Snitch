import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/rulesets")({
  component: RulesetsLayout,
});

function RulesetsLayout() {
  return <Outlet />;
}
