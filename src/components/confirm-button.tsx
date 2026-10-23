"use client";

import { Button } from "./ui";

/** Botão de envio que pede confirmação antes de uma ação difícil de desfazer. */
export function ConfirmButton({ message, children, variant = "ghost" }: { message: string; children: React.ReactNode; variant?: "primary" | "secondary" | "ghost" }) {
  return (
    <Button
      type="submit"
      variant={variant}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
