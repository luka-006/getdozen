import type { ReactNode } from "react";

export function LegalDoc({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="atmosphere">
      <article className="mx-auto w-full max-w-[720px] px-4 py-12">
        <h1 className="font-display text-[32px] font-semibold">{title}</h1>
        <div className="legal-prose mt-8 space-y-6 text-[15px] leading-relaxed text-ink/85">
          {children}
        </div>
      </article>
    </div>
  );
}

export function LegalH({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-[20px] font-semibold text-ink">{children}</h2>
  );
}
