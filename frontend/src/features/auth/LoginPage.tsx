import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { loginSchema } from "@/lib/zodSchemas";
import type { z } from "zod";
import { useLoginMutation } from "@/features/auth/authApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type LoginFormData = z.infer<typeof loginSchema>;

function getLoginErrorMessage(error: unknown) {
  const baseMessage = "Login failed. Check your credentials.";
  if (!error || typeof error !== "object" || !("status" in error)) {
    return baseMessage;
  }

  const apiError = error as FetchBaseQueryError & { data?: { message?: string } | string };
  if (apiError.status === "FETCH_ERROR") {
    return "Unable to reach the server. Please confirm the frontend and backend are both running.";
  }

  if (typeof apiError.data === "string") {
    return apiError.data;
  }

  if (apiError.data && typeof apiError.data === "object" && "message" in apiError.data) {
    const { message } = apiError.data;
    if (Array.isArray(message)) {
      return message[0] ?? baseMessage;
    }
    if (typeof message === "string") {
      return message;
    }
  }

  return baseMessage;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [login, { isLoading, error }] = useLoginMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormData) => {
    const response = await login(values).unwrap();
    const savedEstateId =
      typeof window !== "undefined" ? window.localStorage.getItem("mycaretaker_selected_estate") : null;
    const hasSavedEstate =
      !!savedEstateId && response.session.estates.some((estate) => estate.id === savedEstateId);
    const hasSingleEstate =
      ["CARETAKER", "OWNER"].includes(response.session.role) && response.session.estates.length === 1;

    navigate(hasSavedEstate || hasSingleEstate ? "/dashboard" : response.session.nextRoute);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fffdf8_0%,#f8f4ec_100%)] p-4 text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-10 h-40 w-full max-w-5xl -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(217,119,6,0.14)_0%,rgba(255,255,255,0)_70%)] blur-3xl"
      />
      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-5xl items-center justify-center">
        <Card className="w-full max-w-md border-[#eadfcd] bg-white shadow-[0_24px_80px_rgba(120,86,34,0.10)]">
          <CardHeader className="space-y-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">Welcome Back</p>
            <CardTitle className="text-3xl tracking-tight text-slate-900">Sign in to continue</CardTitle>
            <CardDescription className="text-base leading-7 text-slate-600">
              Use the credentials issued by your administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  className="h-11 rounded-xl border-[#dccfb9] bg-[#fffdf9] focus-visible:ring-amber-600"
                  {...register("email")}
                />
                {errors.email ? <p className="text-xs text-red-600">{errors.email.message}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  className="h-11 rounded-xl border-[#dccfb9] bg-[#fffdf9] focus-visible:ring-amber-600"
                  {...register("password")}
                />
                {errors.password ? <p className="text-xs text-red-600">{errors.password.message}</p> : null}
              </div>

              {error ? <p className="text-sm text-red-600">{getLoginErrorMessage(error)}</p> : null}
              <Button
                className="h-11 w-full rounded-xl bg-amber-700 text-white hover:bg-amber-800"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <p className="mt-5 text-center text-sm text-slate-600">
              New here?{" "}
              <Link className="font-medium text-amber-800 underline underline-offset-4" to="/register">
                Submit a registration request
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
