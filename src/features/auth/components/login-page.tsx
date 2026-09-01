import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { AuthLayout } from "./auth-layout";
import { Field, Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";

const schema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { signIn, signInWithGoogle, sendPasswordReset } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    setFeedback(null);
    try {
      await signIn(data.email, data.password);
      navigate("/painel", { replace: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Não foi possível entrar.");
    }
  };

  const handleGoogle = async () => {
    setSubmitError(null);
    setFeedback(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      navigate("/painel", { replace: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Não foi possível entrar com Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleReset = async () => {
    const email = getValues("email")?.trim();
    setSubmitError(null);
    setFeedback(null);
    if (!email) {
      setSubmitError("Informe seu e-mail para receber o link de redefinição.");
      return;
    }
    try {
      await sendPasswordReset(email);
      setFeedback("Enviamos o link de redefinição. Confira também a caixa de spam.");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Não foi possível enviar o link.");
    }
  };

  return (
    <AuthLayout title="Bem-vindo de volta" subtitle="Sua vida financeira, organizada em um só lugar.">
      <Button type="button" variant="secondary" size="lg" disabled={googleLoading} onClick={handleGoogle} className="w-full justify-center gap-3">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-bold text-[#4285f4] shadow-sm">G</span>
        {googleLoading ? "Conectando..." : "Continuar com Google"}
      </Button>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-400 before:h-px before:flex-1 before:bg-border-light after:h-px after:flex-1 after:bg-border-light dark:before:bg-border-dark dark:after:bg-border-dark">ou entre com e-mail</div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="E-mail" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" placeholder="voce@email.com" error={errors.email?.message} {...register("email")} />
        </Field>
        <Field label="Senha" htmlFor="password">
          <div className="relative">
            <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" className="pr-11" error={errors.password?.message} {...register("password")} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-lg text-muted-500 transition hover:bg-accent-500/10 hover:text-accent-500" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>
        <button type="button" onClick={handleReset} className="-mt-2 self-end text-xs font-semibold text-accent-500 hover:underline">Esqueci minha senha</button>
        {submitError && <p className="rounded-xl bg-coral-500/10 px-3 py-2 text-sm text-coral-500">{submitError}</p>}
        {feedback && <p className="rounded-xl bg-accent-500/10 px-3 py-2 text-sm text-accent-600 dark:text-accent-300">{feedback}</p>}
        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2 w-full justify-center">{isSubmitting ? "Entrando..." : "Entrar"}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-500">Ainda não tem conta?{" "}<Link to="/registro" className="font-medium text-accent-500 hover:underline">Criar conta</Link></p>
    </AuthLayout>
  );
}
