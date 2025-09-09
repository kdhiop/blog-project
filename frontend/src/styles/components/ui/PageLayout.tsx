import type { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function PageLayout({ children, className = '' }: PageLayoutProps) {
  return (
    <div className={`page-container ${className}`}>
      <div className="page-wrapper">
        {children}
      </div>
    </div>
  );
}