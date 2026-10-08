import { useMemo, useState } from "react";
import {
  useApprovePendingRegistrationMutation,
  useDenyPendingRegistrationMutation,
  useGetPendingRegistrationsQuery,
} from "@/features/auth/authApi";
import { parseEstateRequest } from "@/features/auth/estateRequest";
import { useGetEstatesQuery, useReplaceCaretakerMutation } from "@/features/estates/estatesApi";
import {
  useGetAvailableHousesQuery,
  useGetHousesByEstateQuery,
  useManualRegisterTenantMutation,
  useUpdateHouseRentMutation,
  useUpdateHouseSecurityDepositMutation,
  useVacateTenantMutation,
} from "@/features/houses/housesApi";
import {
  useActivateUserMutation,
  useDeactivateUserMutation,
  useGetUsersQuery,
} from "@/features/users/usersApi";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AdminRegistrationsPage() {
  const { data: registrations } = useGetPendingRegistrationsQuery();
  const { data: availableHouses } = useGetAvailableHousesQuery();
  const { data: estates } = useGetEstatesQuery();
  const { data: users } = useGetUsersQuery();
  const [selectedEstateId, setSelectedEstateId] = useState("");
  const { data: estateHouses } = useGetHousesByEstateQuery(selectedEstateId, { skip: !selectedEstateId });
  const [approveRegistration] = useApprovePendingRegistrationMutation();
  const [denyRegistration] = useDenyPendingRegistrationMutation();
  const [manualRegisterTenant] = useManualRegisterTenantMutation();
  const [updateHouseRent] = useUpdateHouseRentMutation();
  const [updateHouseSecurityDeposit] = useUpdateHouseSecurityDepositMutation();
  const [vacateTenant] = useVacateTenantMutation();
  const [activateUser, { isLoading: activatingUser }] = useActivateUserMutation();
  const [deactivateUser, { isLoading: deactivatingUser }] = useDeactivateUserMutation();
  const [replaceCaretaker, { isLoading: replacingCaretaker }] = useReplaceCaretakerMutation();

  const [houseSelection, setHouseSelection] = useState<Record<string, string>>({});
  const [denyReason, setDenyReason] = useState<Record<string, string>>({});
  const [rentDrafts, setRentDrafts] = useState<Record<string, string>>({});
  const [depositDrafts, setDepositDrafts] = useState<Record<string, string>>({});
  const [userFilter, setUserFilter] = useState<"ALL" | "TENANT" | "CARETAKER">("TENANT");
  const [userSearch, setUserSearch] = useState("");
  const [switchEstateId, setSwitchEstateId] = useState("");
  const [outgoingCaretakerId, setOutgoingCaretakerId] = useState("");
  const [incomingCaretakerId, setIncomingCaretakerId] = useState("");
  const [deactivateOutgoingCaretaker, setDeactivateOutgoingCaretaker] = useState("YES");
  const [manualTenant, setManualTenant] = useState({
    fullName: "",
    phone: "",
    email: "",
    houseId: "",
  });

  const availableOptions = useMemo(
    () =>
      (availableHouses ?? []).map((house) => ({
        label: `${house.estate.name} - ${house.name}`,
        value: house.id,
      })),
    [availableHouses],
  );

  const estateSummaries = useMemo(
    () =>
      (estates ?? []).map((estate) => {
        const approvedTenants =
          estate.houses?.flatMap((house) =>
            house.tenancies
              ?.filter((tenancy) => tenancy.endDate === null)
              .map((tenancy) => `${tenancy.tenant.first_name} ${tenancy.tenant.last_name}`.trim()) ?? [],
          ) ?? [];

        return {
          ...estate,
          approvedOwner: estate.owner ? `${estate.owner.first_name} ${estate.owner.last_name}`.trim() : "Awaiting owner approval",
          approvedCaretakers:
            estate.caretaker_estates?.map((assignment) => `${assignment.user.first_name} ${assignment.user.last_name}`.trim()) ?? [],
          approvedTenants,
          vacantHouses: estate.houses?.filter((house) => !house.isOccupied).map((house) => house.name) ?? [],
        };
      }),
    [estates],
  );

  const tenantUsers = useMemo(
    () => (users ?? []).filter((user) => user.role === "TENANT"),
    [users],
  );

  const caretakerUsers = useMemo(
    () => (users ?? []).filter((user) => user.role === "CARETAKER"),
    [users],
  );

  const managedUsers = useMemo(() => {
    const normalizedSearch = userSearch.trim().toLowerCase();

    return (users ?? []).filter((user) => {
      if (user.role !== "TENANT" && user.role !== "CARETAKER") {
        return false;
      }

      if (userFilter !== "ALL" && user.role !== userFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        `${user.first_name} ${user.last_name}`,
        user.email,
        user.phone ?? "",
        user.role,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [userFilter, userSearch, users]);

  const selectedSwitchEstate = useMemo(
    () => estateSummaries.find((estate) => estate.id === switchEstateId) ?? null,
    [estateSummaries, switchEstateId],
  );

  const switchableOutgoingCaretakers = selectedSwitchEstate?.caretaker_estates ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Administrator Panel</h1>
        <p className="text-sm text-slate-600">
          Pending registrations, estate visibility, tenant assignment, rent control, and vacate tools.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Approval Requests"
          value={registrations?.length ?? 0}
          subtitle="Waiting for admin action"
          backgroundColor="bg-[#1d4ed8]"
        />
        <StatCard
          title="Vacant Houses"
          value={availableHouses?.length ?? 0}
          subtitle="Ready for assignment"
          backgroundColor="bg-[#0f766e]"
        />
        <StatCard
          title="Registered Tenants"
          value={tenantUsers.length}
          subtitle="All tenant accounts"
          backgroundColor="bg-[#b45309]"
        />
        <StatCard
          title="Registered Caretakers"
          value={caretakerUsers.length}
          subtitle="Available for estates"
          backgroundColor="bg-[#475569]"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Registrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {registrations?.map((registration) => {
            const estateRequest = parseEstateRequest(registration.estateOfInterest);

            return (
              <div key={registration.id} className="rounded-lg border p-4">
                <p className="font-semibold">{registration.fullName} - {registration.role}</p>
                <p className="text-sm text-slate-600">{registration.email}</p>
                <p className="text-sm text-slate-600">{registration.phoneNumber}</p>
                {estateRequest.requestedEstates.length ? (
                  <p className="text-sm text-slate-600">
                    Estates requested:{" "}
                    {estateRequest.requestedEstates
                      .map((estate) => (estate.unitCount !== undefined ? `${estate.name} (${estate.unitCount} houses)` : estate.name))
                      .join(", ")}
                  </p>
                ) : null}
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
                <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:gap-3">
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
                  <div className="flex flex-1 gap-2">
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
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estate Approval Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {estateSummaries.length ? (
            estateSummaries.map((estate) => (
              <div key={estate.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{estate.name}</p>
                    <p className="text-sm text-slate-600">{estate.address}</p>
                    <p className="text-sm text-slate-600">{estate.city}</p>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {estate.houses?.length ?? 0} houses
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Approved Owner</p>
                    <p className="mt-2 text-sm text-slate-900">{estate.approvedOwner}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Approved Caretakers</p>
                    <p className="mt-2 text-sm text-slate-900">
                      {estate.approvedCaretakers.length ? estate.approvedCaretakers.join(", ") : "No caretaker assigned yet"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Approved Tenants</p>
                    <p className="mt-2 text-sm text-slate-900">
                      {estate.approvedTenants.length ? estate.approvedTenants.join(", ") : "No tenant assigned yet"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Vacant Houses</p>
                    <p className="mt-2 text-sm text-slate-900">
                      {estate.vacantHouses.length ? estate.vacantHouses.join(", ") : "No vacant houses"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-sm text-slate-600">
              No estates have been approved yet.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.8fr_1.2fr]">
        <Card className="min-h-[42rem]">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle>User Access Control</CardTitle>
              <div className="flex flex-col gap-3 md:flex-row">
                <Input
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Search name, email, phone"
                  className="w-full md:w-64"
                />
                <Select value={userFilter} onValueChange={(value) => setUserFilter(value as "ALL" | "TENANT" | "CARETAKER")}>
                  <SelectTrigger className="w-full md:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TENANT">Tenants</SelectItem>
                    <SelectItem value="CARETAKER">Caretakers</SelectItem>
                    <SelectItem value="ALL">All Managed Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Disable tenants after vacating them, and disable caretakers after switching or removing their estate assignment.
            </p>
          </CardHeader>
          <CardContent>
            <div className="max-h-[34rem] space-y-3 overflow-y-auto pr-1">
              {managedUsers.map((user) => (
                <div key={user.id} className="flex flex-col gap-3 rounded-xl border p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{user.first_name} {user.last_name}</p>
                      <Badge variant={user.role === "TENANT" ? "warning" : "orange"}>{user.role}</Badge>
                      <Badge variant={user.is_active ? "success" : "destructive"}>
                        {user.is_active ? "ACTIVE" : "DISABLED"}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{user.email}</p>
                    <p className="text-sm text-slate-600">{user.phone || "No phone provided"}</p>
                  </div>
                  <div className="flex gap-2">
                    {user.is_active ? (
                      <Button
                        variant="destructive"
                        disabled={deactivatingUser}
                        onClick={() => deactivateUser(user.id)}
                      >
                        Disable
                      </Button>
                    ) : (
                      <Button disabled={activatingUser} onClick={() => activateUser(user.id)}>
                        Enable
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {!managedUsers.length ? (
                <div className="rounded-xl border border-dashed p-4 text-sm text-slate-600">
                  No matching tenant or caretaker records found.
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Switch Caretaker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Move an estate from an old caretaker to a new caretaker. This keeps the estate history and lets the new caretaker continue from the same records.
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium">Estate</p>
              <Select
                value={switchEstateId}
                onValueChange={(value) => {
                  setSwitchEstateId(value);
                  setOutgoingCaretakerId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select estate" />
                </SelectTrigger>
                <SelectContent>
                  {estateSummaries.map((estate) => (
                    <SelectItem key={estate.id} value={estate.id}>
                      {estate.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Current Caretaker</p>
              <Select value={outgoingCaretakerId} onValueChange={setOutgoingCaretakerId} disabled={!selectedSwitchEstate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select current caretaker" />
                </SelectTrigger>
                <SelectContent>
                  {switchableOutgoingCaretakers.map((assignment) => (
                    <SelectItem key={assignment.user.id} value={assignment.user.id}>
                      {assignment.user.first_name} {assignment.user.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">New Caretaker</p>
              <Select value={incomingCaretakerId} onValueChange={setIncomingCaretakerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new caretaker" />
                </SelectTrigger>
                <SelectContent>
                  {caretakerUsers
                    .filter((caretaker) => caretaker.is_active && caretaker.id !== outgoingCaretakerId)
                    .map((caretaker) => (
                      <SelectItem key={caretaker.id} value={caretaker.id}>
                        {caretaker.first_name} {caretaker.last_name} ({caretaker.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Disable old caretaker after switch?</p>
              <Select value={deactivateOutgoingCaretaker} onValueChange={setDeactivateOutgoingCaretaker}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YES">Yes</SelectItem>
                  <SelectItem value="NO">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              disabled={!switchEstateId || !outgoingCaretakerId || !incomingCaretakerId || replacingCaretaker}
              onClick={async () => {
                await replaceCaretaker({
                  estateId: switchEstateId,
                  outgoing_user_id: outgoingCaretakerId,
                  incoming_user_id: incomingCaretakerId,
                  deactivateOutgoing: deactivateOutgoingCaretaker === "YES",
                }).unwrap();
                setOutgoingCaretakerId("");
                setIncomingCaretakerId("");
              }}
            >
              {replacingCaretaker ? "Switching..." : "Switch Caretaker"}
            </Button>
          </CardContent>
        </Card>
      </div>

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
            <div key={house.id} className="grid grid-cols-1 gap-3 rounded-lg border p-4 md:grid-cols-[1.7fr_1fr_auto_1fr_auto_auto]">
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
                onChange={(event) => setRentDrafts((current) => ({ ...current, [house.id]: event.target.value }))}
              />
              <Button onClick={() => updateHouseRent({ houseId: house.id, rentAmount: Number(rentDrafts[house.id] || house.rentAmount) })}>
                Save Rent
              </Button>
              <Input
                type="number"
                step="0.01"
                defaultValue={String(house.tenancies?.[0]?.securityDepositAmount ?? 0)}
                disabled={!house.tenancies?.[0]}
                onChange={(event) => setDepositDrafts((current) => ({ ...current, [house.id]: event.target.value }))}
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
