import { Link } from "react-router-dom";
import { useGetEstatesQuery } from "@/features/estates/estatesApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/components/shared/RoleGuard";

export function EstatesListPage() {
  const { data, isLoading } = useGetEstatesQuery();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Estates</h2>
        <RoleGuard allow={["ADMIN"]}>
          <Button asChild>
            <Link to="/estates/create">Create Estate</Link>
          </Button>
        </RoleGuard>
      </div>
      {isLoading ? <p>Loading estates...</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {data?.map((estate) => (
          <Card key={estate.id}>
            <CardHeader>
              <CardTitle>{estate.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">{estate.address}</p>
              <p className="text-sm text-muted-foreground">{estate.city}</p>
              <Button variant="outline" asChild>
                <Link to={`/estates/${estate.id}`}>View Details</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
