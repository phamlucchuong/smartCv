import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/employer/notifications")({
  beforeLoad: () => {
    throw redirect({ to: "/employer" });
  },
});
