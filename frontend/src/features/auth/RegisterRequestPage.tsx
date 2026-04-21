import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { registrationRequestSchema } from "@/lib/zodSchemas";
import { useSubmitRegistrationMutation } from "@/features/auth/authApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FormValues = z.infer<typeof registrationRequestSchema>;

export function RegisterRequestPage() {
  const [submitRegistration, { isLoading, isSuccess }] = useSubmitRegistrationMutation();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(registrationRequestSchema),
    defaultValues: {
      role: "TENANT",
    },
  });

  const onSubmit = async (values: FormValues) => {
    const { confirmPassword, ...payload } = values;
    void confirmPassword;
    await submitRegistration(payload).unwrap();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fffdf8_0%,#f8f4ec_100%)] p-4 text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-10 h-40 w-full max-w-6xl -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(217,119,6,0.14)_0%,rgba(255,255,255,0)_70%)] blur-3xl"
      />
      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center justify-center">
        <Card className="w-full max-w-2xl border-[#eadfcd] bg-white shadow-[0_24px_80px_rgba(120,86,34,0.10)]">
          <CardHeader className="space-y-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">Join MyCareTaker</p>
            <CardTitle className="text-3xl tracking-tight text-slate-900">Registration Request</CardTitle>
            <CardDescription>
              Submit the Gmail address and password you want to use after the administrator approves your request.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="space-y-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <p>Your registration request has been submitted. The administrator will review and contact you.</p>
                <Button asChild variant="outline">
                  <Link to="/who-are-you">Back to entry page</Link>
                </Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    className="h-11 rounded-xl border-[#dccfb9] bg-[#fffdf9] focus-visible:ring-amber-600"
                    {...register("fullName")}
                  />
                  {errors.fullName ? <p className="text-xs text-red-600">{errors.fullName.message}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    className="h-11 rounded-xl border-[#dccfb9] bg-[#fffdf9] focus-visible:ring-amber-600"
                    {...register("phoneNumber")}
                  />
                  {errors.phoneNumber ? <p className="text-xs text-red-600">{errors.phoneNumber.message}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Gmail Address</Label>
                  <Input
                    id="email"
                    type="email"
                    className="h-11 rounded-xl border-[#dccfb9] bg-[#fffdf9] focus-visible:ring-amber-600"
                    placeholder="yourname@gmail.com"
                    {...register("email")}
                  />
                  {errors.email ? <p className="text-xs text-red-600">{errors.email.message}</p> : null}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
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
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      className="h-11 rounded-xl border-[#dccfb9] bg-[#fffdf9] focus-visible:ring-amber-600"
                      {...register("confirmPassword")}
                    />
                    {errors.confirmPassword ? <p className="text-xs text-red-600">{errors.confirmPassword.message}</p> : null}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select defaultValue="TENANT" onValueChange={(value) => setValue("role", value as FormValues["role"])}>
                    <SelectTrigger className="h-11 rounded-xl border-[#dccfb9] bg-[#fffdf9] focus:ring-amber-600">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TENANT">Tenant</SelectItem>
                      <SelectItem value="CARETAKER">Caretaker</SelectItem>
                      <SelectItem value="OWNER">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estateOfInterest">Estate of Interest</Label>
                  <Input
                    id="estateOfInterest"
                    className="h-11 rounded-xl border-[#dccfb9] bg-[#fffdf9] focus-visible:ring-amber-600"
                    {...register("estateOfInterest")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    className="rounded-xl border-[#dccfb9] bg-[#fffdf9] focus-visible:ring-amber-600"
                    {...register("message")}
                  />
                </div>
                <Button
                  className="h-11 w-full rounded-xl bg-amber-700 text-white hover:bg-amber-800"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Submitting..." : "Submit Registration Request"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
