import { Button } from "./ui";

export function SubmitButton({
  children,
  pending,
  pendingText = "Salvando...",
}: {
  children: React.ReactNode;
  pending: boolean;
  pendingText?: string;
}) {
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingText : children}
    </Button>
  );
}
