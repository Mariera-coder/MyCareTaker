import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/zodSchemas";
import type { z } from "zod";
import { useLoginMutation } from "@/features/auth/authApi";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type LoginFormData = z.infer<typeof loginSchema>;

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
    navigate(response.session.nextRoute);
  };

  return (
    <div className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl justify-end pb-4">
        <ThemeToggle />
      </div>
      <div className="flex items-center justify-center">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader>
          <CardTitle>Log In</CardTitle>
          <CardDescription>Use the credentials issued by your administrator.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email ? <p className="text-xs text-red-600">{errors.email.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password ? <p className="text-xs text-red-600">{errors.password.message}</p> : null}
            </div>

            {error ? <p className="text-sm text-red-600">Login failed. Check your credentials.</p> : null}
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            New here? <Link className="text-sky-700 underline" to="/register">Submit a registration request</Link>.
          </p>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
