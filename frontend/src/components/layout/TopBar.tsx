import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { selectEstate } from "@/features/auth/authSlice";
import { useLogoutMutation } from "@/features/auth/authApi";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Menu } from "lucide-react";

interface TopBarProps {
  onToggleMobileMenu?: () => void;
}

export function TopBar({ onToggleMobileMenu }: TopBarProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, availableEstates, selectedEstateId } = useAppSelector((state) => state.auth);
  const [logout, { isLoading }] = useLogoutMutation();

  const onLogout = async () => {
    await logout().unwrap();
    navigate("/who-are-you");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card/90 px-3 sm:px-6 backdrop-blur">
      <div className="flex items-center gap-2">
        {onToggleMobileMenu ? (
          <Button
            type="button"
            variant="outline"
            className="md:hidden h-9 w-9 text-slate-700"
            onClick={onToggleMobileMenu}
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        ) : null}
        <div className="min-w-0">
          <p className="hidden sm:block text-xs text-muted-foreground">Signed in as</p>
          <p className="truncate max-w-[100px] sm:max-w-xs md:max-w-none text-xs sm:text-sm font-semibold">{user?.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {user && ["CARETAKER", "OWNER"].includes(user.role) ? (
          <Select
            value={selectedEstateId ?? ""}
            onValueChange={(value) => {
              dispatch(selectEstate(value));
              navigate("/dashboard");
            }}
          >
            <SelectTrigger className="w-28 sm:w-48 md:w-64 h-9 sm:h-10 text-xs sm:text-sm">
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
        <Button variant="outline" size="sm" className="h-9 sm:h-10 text-xs sm:text-sm" onClick={onLogout} disabled={isLoading}>
          Logout
        </Button>
      </div>
    </header>
  );
}
