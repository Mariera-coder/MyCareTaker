import { Link, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { registrationRequestSchema } from "@/lib/zodSchemas";
import { useSubmitRegistrationMutation } from "@/features/auth/authApi";
import type { RequestedEstate } from "@/features/auth/estateRequest";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PublicFooter } from "@/components/layout/PublicFooter";

type FormValues = z.infer<typeof registrationRequestSchema>;

export function RegisterRequestPage() {
  const [searchParams] = useSearchParams();
  const requestedRole = searchParams.get("role");
  const initialRole =
    requestedRole === "OWNER" || requestedRole === "CARETAKER" || requestedRole === "TENANT" ? requestedRole : "TENANT";
  const [submitRegistration, { isLoading, isSuccess }] = useSubmitRegistrationMutation();
  const [estateCount, setEstateCount] = useState(1);
  const [requestedEstates, setRequestedEstates] = useState<RequestedEstate[]>([{ name: "", unitCount: 0 }]);
  const [estateError, setEstateError] = useState("");
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(registrationRequestSchema),
    defaultValues: {
      role: initialRole,
    },
  });

  const role = watch("role");
  const needsEstatePlanner = role === "OWNER" || role === "CARETAKER";

  const estateRows = useMemo(
    () =>
      Array.from({ length: estateCount }, (_, index) => requestedEstates[index] ?? { name: "", unitCount: 0 }),
    [estateCount, requestedEstates],
  );

  const onSubmit = async (values: FormValues) => {
    const { confirmPassword, ...payload } = values;
    void confirmPassword;

    if (needsEstatePlanner) {
      const normalizedEstates = estateRows.map((estate) => ({
        name: estate.name.trim(),
        unitCount: role === "CARETAKER" ? Number(estate.unitCount ?? 0) : undefined,
      }));

      if (normalizedEstates.some((estate) => !estate.name)) {
        setEstateError("Enter the name for every estate before submitting.");
        return;
      }

      setEstateError("");
      await submitRegistration({
        ...payload,
        estateOfInterest: undefined,
        requestedEstates: normalizedEstates,
      }).unwrap();
      return;
    }

    setEstateError("");
    await submitRegistration(payload).unwrap();
  };

  return (
    <div className="flex min-h-screen flex-col bg-[linear-gradient(180deg,#fffdf8_0%,#f8f4ec_100%)] text-foreground">
      <div className="relative flex-1 overflow-hidden p-3 md:p-4">
        <div
          aria-hidden="true"
          className="hidden md:block pointer-events-none absolute left-1/2 top-10 h-40 w-full max-w-6xl -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(217,119,6,0.14)_0%,rgba(255,255,255,0)_70%)] blur-3xl"
        />
        <div className="relative mx-auto flex min-h-0 md:min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center justify-center py-3 md:py-0">
          <Card className="w-full max-w-2xl border-[#eadfcd] bg-white shadow-[0_24px_80px_rgba(120,86,34,0.10)]">
            <CardHeader className="space-y-2 md:space-y-3 p-4 md:p-6 text-center">
              <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">Join INKAHOME</p>
              <CardTitle className="text-2xl md:text-3xl tracking-tight text-slate-900">Registration Request</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Submit the Gmail address and password you want to use after the administrator approves your request.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              {isSuccess ? (
                <div className="space-y-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <p>Your registration request has been submitted. The administrator will review and contact you.</p>
                  <Button asChild variant="outline">
                    <Link to="/">Back to entry page</Link>
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
                    <Select value={role} onValueChange={(value) => setValue("role", value as FormValues["role"])}>
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
                  {needsEstatePlanner ? (
                    <div className="space-y-4 rounded-2xl border border-[#eadfcd] bg-[#fffaf1] p-4">
                      <div className="space-y-2">
                        <Label htmlFor="estateCount">
                          {role === "CARETAKER" ? "How many estates are you overseeing?" : "How many estates are you registering?"}
                        </Label>
                        <Input
                          id="estateCount"
                          type="number"
                          min={1}
                          value={estateCount}
                          className="h-11 rounded-xl border-[#dccfb9] bg-white focus-visible:ring-amber-600"
                          onChange={(event) => {
                            const nextCount = Math.max(1, Number(event.target.value || 1));
                            setEstateCount(nextCount);
                            setRequestedEstates((current) =>
                              Array.from({ length: nextCount }, (_, index) => current[index] ?? { name: "", unitCount: 0 }),
                            );
                          }}
                        />
                      </div>
                      {estateRows.map((estate, index) => (
                        <div key={`estate-${index}`} className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`estate-name-${index}`}>Estate {index + 1} Name</Label>
                            <Input
                              id={`estate-name-${index}`}
                              value={estate.name}
                              className="h-11 rounded-xl border-[#dccfb9] bg-white focus-visible:ring-amber-600"
                              onChange={(event) =>
                                setRequestedEstates((current) =>
                                  current.map((entry, entryIndex) =>
                                    entryIndex === index ? { ...entry, name: event.target.value } : entry,
                                  ),
                                )
                              }
                            />
                          </div>
                          {role === "CARETAKER" ? (
                            <div className="space-y-2">
                              <Label htmlFor={`estate-unit-count-${index}`}>How many vacant houses are there?</Label>
                              <Input
                                id={`estate-unit-count-${index}`}
                                type="number"
                                min={0}
                                value={estate.unitCount ?? 0}
                                className="h-11 rounded-xl border-[#dccfb9] bg-white focus-visible:ring-amber-600"
                                onChange={(event) =>
                                  setRequestedEstates((current) =>
                                    current.map((entry, entryIndex) =>
                                      entryIndex === index
                                        ? { ...entry, unitCount: Math.max(0, Number(event.target.value || 0)) }
                                        : entry,
                                    ),
                                  )
                                }
                              />
                            </div>
                          ) : null}
                        </div>
                      ))}
                      {estateError ? <p className="text-xs text-red-600">{estateError}</p> : null}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="estateOfInterest">Estate of Interest</Label>
                      <Input
                        id="estateOfInterest"
                        className="h-11 rounded-xl border-[#dccfb9] bg-[#fffdf9] focus-visible:ring-amber-600"
                        {...register("estateOfInterest")}
                      />
                    </div>
                  )}
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
      <PublicFooter />
    </div>
  );
}
