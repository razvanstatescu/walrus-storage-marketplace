import type React from "react";
import { AppShell } from "@/components/layouts/AppShell";
import { StudioLayout as StudioLayoutComponent } from "@/components/layouts/StudioLayout";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <StudioLayoutComponent>{children}</StudioLayoutComponent>
    </AppShell>
  );
}
