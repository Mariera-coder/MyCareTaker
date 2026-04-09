import { useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useGetEstatesQuery } from "@/features/estates/estatesApi";
import { useGetUnitsByEstateQuery } from "@/features/units/unitsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RoleGuard } from "@/components/shared/RoleGuard";

export function UnitsListPage() {
  const [params, setParams] = useSearchParams();
  const estateId = params.get("estateId") ?? "";
  const { data: estates } = useGetEstatesQuery();
  const { data: units, isFetching } = useGetUnitsByEstateQuery(estateId, { skip: !estateId });

  const selectedEstate = useMemo(() => estates?.find((item) => item.id === estateId), [estates, estateId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Units</h2>
        <RoleGuard allow={["ADMIN", "OWNER", "CARETAKER"]}>
          <Button asChild>
            <Link to="/units/create">Create Unit</Link>
          </Button>
        </RoleGuard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Estate</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={estateId} onValueChange={(value) => setParams({ estateId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Choose estate" />
            </SelectTrigger>
            <SelectContent>
              {estates?.map((estate) => (
                <SelectItem key={estate.id} value={estate.id}>
                  {estate.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedEstate ? <p className="mt-2 text-sm text-muted-foreground">{selectedEstate.city}</p> : null}
        </CardContent>
      </Card>

      {isFetching ? <p>Loading units...</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {units?.map((unit) => (
          <Card key={unit.id}>
            <CardHeader>
              <CardTitle>Unit {unit.unit_number}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>Rent: {Number(unit.monthly_rent).toLocaleString()}</p>
              <Badge variant={unit.status === "OCCUPIED" ? "success" : "secondary"}>{unit.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
