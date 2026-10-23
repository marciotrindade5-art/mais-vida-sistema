import Image from "next/image";
import { LoginForm } from "./login-form";

export const metadata = { title: "Entrar · Clínica Mais Vida" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-wrap">
      <div className="flex flex-[1_1_360px] items-center justify-center bg-verde p-10">
        <Image src="/marca/logo-sobre-verde.svg" alt="Clínica Mais Vida" width={320} height={99} priority />
      </div>
      <div className="flex flex-[1_1_420px] items-center justify-center p-6 sm:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="font-titulo text-3xl text-verde">Bem-vindo</h1>
            <p className="text-suave">Entre com seu e-mail e senha da clínica.</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
