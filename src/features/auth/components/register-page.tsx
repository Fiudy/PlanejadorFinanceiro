import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/app/auth-context";
import { AuthLayout } from "./auth-layout";
import { Field, Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";

const schema = z.object({
  name: z.string().min(2, "Informe seu nome."),
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    try {
      await signUp(data.name, data.email, data.password);
      navigate("/painel", { replace: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Não foi possível criar a conta.");
    }
  };

  return (
    <AuthLayout title="Crie sua conta" subtitle="Leva menos de um minuto para começar.">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Nome" htmlFor="name">
          <Input id="name" placeholder="Seu nome" error={errors.name?.message} {...register("name")} />
        </Field>
        <Field label="E-mail" htmlFor="email">
          <Input id="email" type="email" placeholder="voce@email.com" error={errors.email?.message} {...register("email")} />
        </Field>
        <Field label="Senha" htmlFor="password">
          <Input id="password" type="password" placeholder="••••••••" error={errors.password?.message} {...register("password")} />
        </Field>
        {submitError && <p className="text-sm text-coral-500">{submitError}</p>}
        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2 w-full justify-center">
          {isSubmitting ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-500">
        Já tem conta?{" "}
        <Link to="/login" className="font-medium text-accent-500 hover:underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
