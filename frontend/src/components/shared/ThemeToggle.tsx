import { Button } from "@/components/ui/button";
import { useTheme } from "@/app/theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button variant="outline" type="button" onClick={toggleTheme}>
      {theme === "light" ? "Dark mode" : "Light mode"}
    </Button>
  );
}
