import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { todayKey } from "@/lib/time";
import { Card, PageHeader } from "@/components/ui";
import { ExpenseForm } from "../expense-form";

export default async function NovaDespesaPage() {
  await requireRole(...CAN_EDIT.despesas);
  return (
    <>
      <PageHeader title="Nova despesa" subtitle="Financeiro" />
      <Card className="max-w-3xl"><ExpenseForm today={todayKey()} /></Card>
    </>
  );
}
