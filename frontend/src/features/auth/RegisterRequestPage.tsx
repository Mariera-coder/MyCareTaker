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
import { ThemeToggle } from "@/components/shared/ThemeToggle";

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
    <div className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl justify-end pb-4">
        <ThemeToggle />
      </div>
      <div className="flex items-center justify-center">
      <Card className="w-full max-w-2xl border-border bg-card">
        <CardHeader>
          <CardTitle>Registration Request</CardTitle>
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
                <Input id="fullName" {...register("fullName")} />
                {errors.fullName ? <p className="text-xs text-red-600">{errors.fullName.message}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" {...register("phoneNumber")} />
                {errors.phoneNumber ? <p className="text-xs text-red-600">{errors.phoneNumber.message}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Gmail Address</Label>
                <Input id="email" type="email" placeholder="yourname@gmail.com" {...register("email")} />
                {errors.email ? <p className="text-xs text-red-600">{errors.email.message}</p> : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" {...register("password")} />
                  {errors.password ? <p className="text-xs text-red-600">{errors.password.message}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
                  {errors.confirmPassword ? <p className="text-xs text-red-600">{errors.confirmPassword.message}</p> : null}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select defaultValue="TENANT" onValueChange={(value) => setValue("role", value as FormValues["role"])}>
                  <SelectTrigger>
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
                <Input id="estateOfInterest" {...register("estateOfInterest")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" {...register("message")} />
              </div>
              <Button className="w-full" type="submit" disabled={isLoading}>
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
