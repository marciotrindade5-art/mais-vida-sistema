"use client";

import { useLinkStatus } from "next/link";

/** Dentro de um Link: troca o conteúdo por um indicador enquanto a próxima tela carrega. */
export function LinkPending({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return pending ? (
    <span role="status" aria-label="Carregando" className="size-4 animate-spin rounded-full border-2 border-verde border-t-transparent" />
  ) : (
    <>{children}</>
  );
}
