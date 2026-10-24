import Link from "next/link";

/** Abas para trocar de unidade mantendo os outros filtros da página. */
export function UnitTabs({
  units,
  currentId,
  href,
}: {
  units: { id: string; name: string }[];
  currentId: string | undefined;
  href: (unitId: string) => string;
}) {
  if (units.length < 2) return null;
  return (
    <nav aria-label="Unidade" className="flex gap-1 self-start rounded-xl bg-linha p-1">
      {units.map((u) => (
        <Link
          key={u.id}
          href={href(u.id)}
          aria-current={u.id === currentId ? "page" : undefined}
          className={"flex h-10 items-center rounded-lg px-4 font-medium " + (u.id === currentId ? "bg-verde text-creme" : "hover:bg-white")}
        >
          {u.name}
        </Link>
      ))}
    </nav>
  );
}
