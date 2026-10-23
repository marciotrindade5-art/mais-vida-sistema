import { NextResponse, type NextRequest } from "next/server";

/** Atalho do seletor de paciente: /financeiro/receber/ir?paciente=ID */
export function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("paciente");
  return NextResponse.redirect(new URL(id ? `/financeiro/receber/${encodeURIComponent(id)}` : "/financeiro/receber", req.url));
}
