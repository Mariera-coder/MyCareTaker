import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { selectEstate } from "@/features/auth/authSlice";
import { useLogoutMutation } from "@/features/auth/authApi";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function TopBar() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, availableEstates, selectedEstateId } = useAppSelector((state) => state.auth);
  const [logout, { isLoading }] = useLogoutMutation();

  const onLogout = async () => {
    await logout().unwrap();
    navigate("/who-are-you");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card/90 px-6 backdrop-blur">
      <div>
        <p className="text-sm text-muted-foreground">Signed in as</p>
        <p className="font-semibold">{user?.email}</p>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {user && ["CARETAKER", "OWNER"].includes(user.role) ? (
          <Select
            value={selectedEstateId ?? ""}
            onValueChange={(value) => {
              dispatch(selectEstate(value));
              navigate("/dashboard");
            }}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select estate" />
            </SelectTrigger>
            <SelectContent>
              {availableEstates.map((estate) => (
                <SelectItem key={estate.id} value={estate.id}>
                  {estate.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <Button variant="outline" onClick={onLogout} disabled={isLoading}>
          Logout
        </Button>
      </div>
    </header>
  );
}
