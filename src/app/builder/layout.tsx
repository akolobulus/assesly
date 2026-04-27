
import type React from 'react';

export default function BuilderPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout simply passes through its children, ensuring that
  // the builder page does not inherit from the main dashboard layout.
  return <>{children}</>;
}
