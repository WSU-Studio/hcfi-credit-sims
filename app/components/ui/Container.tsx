import type { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
  noDefaultPadding?: boolean;
};

export function Container({ children, className, noDefaultPadding = false }: ContainerProps) {
  const base = "mx-auto w-full max-w-6xl";
  if (noDefaultPadding) {
    return <div className={className ? `${base} ${className}` : base}>{children}</div>;
  }
  return <div className={className ? `${base} ${className}` : `${base} px-4 md:px-6 lg:px-8`}>{children}</div>;
}

