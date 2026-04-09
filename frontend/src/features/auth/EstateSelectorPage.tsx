import { useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { selectEstate } from "@/features/auth/authSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function EstateSelectorPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, availableEstates } = useAppSelector((state) => state.auth);

  const title = useMemo(() => {
    if (user?.role === "CARETAKER") {
      return "Which estate do you want to access?";
    }
    if (user?.role === "OWNER") {
      return "Which estate would you like to access?";
    }
    return "Select estate";
  }, [user?.role]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!["CARETAKER", "OWNER"].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Only estates assigned to your account are shown here.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {availableEstates.map((estate) => (
            <button
              key={estate.id}
              className="rounded-xl border bg-white p-6 text-left transition hover:border-sky-500 hover:bg-sky-50"
              onClick={() => {
                dispatch(selectEstate(estate.id));
                navigate("/dashboard");
              }}
              type="button"
            >
              <p className="text-lg font-semibold">{estate.name}</p>
              <p className="mt-2 text-sm text-slate-600">{estate.address}</p>
              <p className="text-sm text-slate-600">{estate.city}</p>
            </button>
          ))}
          {availableEstates.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
              No estates are currently assigned to this account.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
