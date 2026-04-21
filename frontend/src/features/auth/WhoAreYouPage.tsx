import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function WhoAreYouPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fffdf8_0%,#f8f4ec_100%)] p-4 text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-10 h-40 w-full max-w-6xl -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(217,119,6,0.14)_0%,rgba(255,255,255,0)_70%)] blur-3xl"
      />
      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center justify-center">
        <Card className="w-full max-w-4xl border-[#eadfcd] bg-white shadow-[0_24px_80px_rgba(120,86,34,0.10)]">
          <CardHeader className="space-y-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">Welcome</p>
            <CardTitle className="text-4xl tracking-tight text-slate-900">MyCareTaker</CardTitle>
            <CardDescription className="mx-auto max-w-2xl text-base leading-7 text-slate-600">
              A calm, simple place to manage your home, estate, and daily care tasks.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-[#efe3d2] bg-[#fffaf2] p-7">
              <h2 className="text-xl font-semibold text-slate-900">I already have an account</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Sign in with the credentials issued by your administrator.
              </p>
              <Button asChild className="mt-6 h-11 w-full rounded-xl bg-amber-700 text-white hover:bg-amber-800">
                <Link to="/login">Log In</Link>
              </Button>
            </div>

            <div className="rounded-2xl border border-[#efe3d2] bg-white p-7">
              <h2 className="text-xl font-semibold text-slate-900">I am new</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Submit a registration request for admin review.
              </p>
              <Button
                asChild
                variant="outline"
                className="mt-6 h-11 w-full rounded-xl border-[#d7c6aa] bg-white text-slate-800 hover:bg-[#fbf5ea]"
              >
                <Link to="/register">Register</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
