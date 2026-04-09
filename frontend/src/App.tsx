import { useAppSelector } from "@/app/hooks";
import { useGetSessionQuery } from "@/features/auth/authApi";
import { AppRouter } from "@/router";

export default function App() {
  const sessionChecked = useAppSelector((state) => state.auth.sessionChecked);

  useGetSessionQuery();

  if (!sessionChecked) {
    return null;
  }

  return <AppRouter />;
}
