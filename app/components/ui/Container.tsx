import type { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
};

export function Container({ children, className }: ContainerProps) {
  const base = "mx-auto w-full max-w-6xl px-4 md:px-6 lg:px-8";
  return <div className={className ? `${base} ${className}` : base}>{children}</div>;
}

