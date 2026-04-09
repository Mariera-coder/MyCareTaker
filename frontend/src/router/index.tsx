import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { WhoAreYouPage } from "@/features/auth/WhoAreYouPage";
import { RegisterRequestPage } from "@/features/auth/RegisterRequestPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { EstateSelectorPage } from "@/features/auth/EstateSelectorPage";
import { AdminRegistrationsPage } from "@/features/auth/AdminRegistrationsPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { ComplaintsListPage } from "@/features/complaints/ComplaintsListPage";
import { SubmitComplaintPage } from "@/features/complaints/SubmitComplaintPage";
import { CaretakerReviewPage } from "@/features/complaints/CaretakerReviewPage";
import { OwnerApprovalPage } from "@/features/complaints/OwnerApprovalPage";

function ShellLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function NotFoundPage() {
  return <div className="p-6">Page not found.</div>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/who-are-you" replace />} />
      <Route path="/who-are-you" element={<WhoAreYouPage />} />
      <Route path="/register" element={<RegisterRequestPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/select-estate" element={<EstateSelectorPage />} />
        <Route element={<ShellLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/complaints" element={<ComplaintsListPage />} />
          <Route path="/complaints/submit" element={<SubmitComplaintPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allow={["CARETAKER"]} />}>
        <Route element={<ShellLayout />}>
          <Route path="/complaints/caretaker-review" element={<CaretakerReviewPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allow={["OWNER"]} />}>
        <Route element={<ShellLayout />}>
          <Route path="/complaints/owner-approval" element={<OwnerApprovalPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allow={["ADMIN"]} />}>
        <Route element={<ShellLayout />}>
          <Route path="/admin/registrations" element={<AdminRegistrationsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
