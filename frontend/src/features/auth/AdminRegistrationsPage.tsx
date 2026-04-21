import { useMemo, useState } from "react";
import {
  useApprovePendingRegistrationMutation,
  useDenyPendingRegistrationMutation,
  useGetPendingRegistrationsQuery,
} from "@/features/auth/authApi";
import {
  useGetAvailableHousesQuery,
  useGetHousesByEstateQuery,
  useManualRegisterTenantMutation,
  useUpdateHouseRentMutation,
  useUpdateHouseSecurityDepositMutation,
  useVacateTenantMutation,
} from "@/features/houses/housesApi";
import { useGetEstatesQuery } from "@/features/estates/estatesApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AdminRegistrationsPage() {
  const { data: registrations } = useGetPendingRegistrationsQuery();
  const { data: availableHouses } = useGetAvailableHousesQuery();
  const { data: estates } = useGetEstatesQuery();
  const [selectedEstateId, setSelectedEstateId] = useState("");
  const { data: estateHouses } = useGetHousesByEstateQuery(selectedEstateId, { skip: !selectedEstateId });
  const [approveRegistration] = useApprovePendingRegistrationMutation();
  const [denyRegistration] = useDenyPendingRegistrationMutation();
  const [manualRegisterTenant] = useManualRegisterTenantMutation();
  const [updateHouseRent] = useUpdateHouseRentMutation();
  const [updateHouseSecurityDeposit] = useUpdateHouseSecurityDepositMutation();
  const [vacateTenant] = useVacateTenantMutation();

  const [houseSelection, setHouseSelection] = useState<Record<string, string>>({});
  const [denyReason, setDenyReason] = useState<Record<string, string>>({});
  const [rentDrafts, setRentDrafts] = useState<Record<string, string>>({});
  const [depositDrafts, setDepositDrafts] = useState<Record<string, string>>({});
  const [manualTenant, setManualTenant] = useState({
    fullName: "",
    phone: "",
    email: "",
    houseId: "",
  });

  const availableOptions = useMemo(
    () =>
      (availableHouses ?? []).map((house) => ({
        label: `${house.estate.name} · ${house.name}`,
        value: house.id,
      })),
    [availableHouses],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Administrator Panel</h1>
        <p className="text-sm text-slate-600">Pending registrations, tenant assignment, rent control, and vacate tools.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Registrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {registrations?.map((registration) => (
            <div key={registration.id} className="rounded-lg border p-4">
              <p className="font-semibold">{registration.fullName} · {registration.role}</p>
              <p className="text-sm text-slate-600">{registration.email}</p>
              <p className="text-sm text-slate-600">{registration.phoneNumber}</p>
              <p className="text-sm text-slate-600">{registration.message || "No message"}</p>
              {registration.role === "TENANT" ? (
                <div className="mt-3">
                  <Select
                    value={houseSelection[registration.id]}
                    onValueChange={(value) => setHouseSelection((current) => ({ ...current, [registration.id]: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an unoccupied house" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="mt-3 flex gap-3">
                <Button
                  onClick={() =>
                    approveRegistration({
                      id: registration.id,
                      houseId: houseSelection[registration.id],
                    })
                  }
                  disabled={registration.role === "TENANT" && !houseSelection[registration.id]}
                >
                  Approve
                </Button>
                <Input
                  placeholder="Deny reason"
                  value={denyReason[registration.id] ?? ""}
                  onChange={(event) =>
                    setDenyReason((current) => ({ ...current, [registration.id]: event.target.value }))
                  }
                />
                <Button
                  variant="destructive"
                  disabled={!denyReason[registration.id]}
                  onClick={() =>
                    denyRegistration({
                      id: registration.id,
                      reason: denyReason[registration.id],
                    })
                  }
                >
                  Deny
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual Tenant Registration</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Full Name"
            value={manualTenant.fullName}
            onChange={(event) => setManualTenant((current) => ({ ...current, fullName: event.target.value }))}
          />
          <Input
            placeholder="Phone"
            value={manualTenant.phone}
            onChange={(event) => setManualTenant((current) => ({ ...current, phone: event.target.value }))}
          />
          <Input
            placeholder="Email (optional)"
            value={manualTenant.email}
            onChange={(event) => setManualTenant((current) => ({ ...current, email: event.target.value }))}
          />
          <Select
            value={manualTenant.houseId}
            onValueChange={(value) => setManualTenant((current) => ({ ...current, houseId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select unoccupied house" />
            </SelectTrigger>
            <SelectContent>
              {availableOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="md:col-span-2"
            onClick={() =>
              manualRegisterTenant({
                ...manualTenant,
                email: manualTenant.email || undefined,
              })
            }
            disabled={!manualTenant.fullName || !manualTenant.phone || !manualTenant.houseId}
          >
            Register Tenant
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
        <CardTitle>Rent Amount Control and Vacate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedEstateId} onValueChange={setSelectedEstateId}>
            <SelectTrigger>
              <SelectValue placeholder="Select estate" />
            </SelectTrigger>
            <SelectContent>
              {estates?.map((estate) => (
                <SelectItem key={estate.id} value={estate.id}>
                  {estate.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {estateHouses?.map((house) => (
            <div key={house.id} className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1.7fr_1fr_auto_1fr_auto_auto]">
              <div>
                <p className="font-semibold">{house.name}</p>
                <p className="text-sm text-slate-600">{house.estate.name}</p>
                <p className="text-sm text-slate-600">
                  {house.tenancies?.[0]
                    ? `Tenant: ${house.tenancies[0].tenant.first_name} ${house.tenancies[0].tenant.last_name}`
                    : "Vacant house"}
                </p>
              </div>
              <Input
                type="number"
                step="0.01"
                defaultValue={String(house.rentAmount)}
                onChange={(event) =>
                  setRentDrafts((current) => ({ ...current, [house.id]: event.target.value }))
                }
              />
              <Button onClick={() => updateHouseRent({ houseId: house.id, rentAmount: Number(rentDrafts[house.id] || house.rentAmount) })}>
                Save Rent
              </Button>
              <Input
                type="number"
                step="0.01"
                defaultValue={String(house.tenancies?.[0]?.securityDepositAmount ?? 0)}
                disabled={!house.tenancies?.[0]}
                onChange={(event) =>
                  setDepositDrafts((current) => ({ ...current, [house.id]: event.target.value }))
                }
              />
              <Button
                disabled={!house.tenancies?.[0]}
                onClick={() =>
                  updateHouseSecurityDeposit({
                    houseId: house.id,
                    securityDepositAmount: Number(
                      depositDrafts[house.id] ?? house.tenancies?.[0]?.securityDepositAmount ?? 0,
                    ),
                  })
                }
              >
                Save Deposit
              </Button>
              <Button variant="destructive" onClick={() => vacateTenant({ houseId: house.id })}>
                Vacate
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
