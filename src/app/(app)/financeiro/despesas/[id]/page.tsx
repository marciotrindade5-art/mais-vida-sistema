import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { todayKey } from "@/lib/time";
import { Card, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/confirm-button";
import { deleteExpense } from "../../actions";
import { ExpenseForm } from "../expense-form";

export default async function EditarDespesaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(...CAN_EDIT.despesas);
  const { id } = await params;
  const expense = await db.expense.findUnique({ where: { id } });
  if (!expense) notFound();
  return (
    <>
      <PageHeader
        title={expense.description}
        subtitle="Editar despesa"
        actions={
          <form action={deleteExpense}>
            <input type="hidden" name="id" value={expense.id} />
            <ConfirmButton message="Excluir esta despesa?">Excluir</ConfirmButton>
          </form>
        }
      />
      <Card className="max-w-3xl"><ExpenseForm expense={expense} today={todayKey()} /></Card>
    </>
  );
}
