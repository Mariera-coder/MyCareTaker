import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export function WhoAreYouPage() {
  return (
    <div className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl justify-end pb-4">
        <ThemeToggle />
      </div>
      <div className="flex items-center justify-center">
      <Card className="w-full max-w-3xl border-border bg-card">
        <CardHeader className="space-y-3 text-center">
          <CardTitle className="text-3xl">MyCareTaker</CardTitle>
          <CardDescription>Choose how you want to enter the system.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">I already have an account</h2>
            <p className="mt-2 text-sm text-slate-600">
              Sign in with the credentials issued by your administrator.
            </p>
            <Button asChild className="mt-6 w-full">
              <Link to="/login">Log In</Link>
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">I am new</h2>
            <p className="mt-2 text-sm text-slate-600">
              Submit a registration request for admin review.
            </p>
            <Button asChild variant="outline" className="mt-6 w-full">
              <Link to="/register">Register</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
