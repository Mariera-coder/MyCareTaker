# INKAHOME Backend API Summary (Frontend Reference)

This document reflects the implemented backend as of March 5, 2026.

Base URL: `http://localhost:3000/api`  
Auth header for protected endpoints: `Authorization: Bearer <access_token>`

## 1. Authentication

### Token usage
- Access token: use for all protected API calls in `Authorization` header.
- Refresh token: send in `Authorization: Bearer <refresh_token>` only to refresh endpoint.

### Endpoints

#### `POST /api/auth/register` (Public)
Request body:
```json
{
  "email": "user@example.com",
  "password": "min8chars",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "optional",
  "role": "ADMIN|OWNER|CARETAKER|TENANT"
}
```
Response:
```json
{
  "access_token": "jwt",
  "refresh_token": "jwt"
}
```

#### `POST /api/auth/login` (Public)
Request body:
```json
{
  "email": "user@example.com",
  "password": "min8chars"
}
```
Response:
```json
{
  "access_token": "jwt",
  "refresh_token": "jwt"
}
```

#### `POST /api/auth/refresh` (Protected via refresh token)
Request body: none  
Header: `Authorization: Bearer <refresh_token>`

Response:
```json
{
  "access_token": "jwt",
  "refresh_token": "jwt"
}
```

#### `POST /api/auth/logout` (Protected via access token)
Request body: none

Response:
```json
{
  "message": "Logged out successfully"
}
```

## 2. Users

All user endpoints are protected and admin-only.

#### `GET /api/users`
Roles: `ADMIN`

Response shape:
```json
[
  {
    "id": "uuid",
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "phone": "string|null",
    "role": "ADMIN|OWNER|CARETAKER|TENANT",
    "is_active": true,
    "created_at": "ISO date"
  }
]
```

#### `GET /api/users/:id`
Roles: `ADMIN`

Response shape:
```json
{
  "id": "uuid",
  "email": "string",
  "first_name": "string",
  "last_name": "string",
  "phone": "string|null",
  "role": "ADMIN|OWNER|CARETAKER|TENANT",
  "is_active": true,
  "created_at": "ISO date",
  "updated_at": "ISO date"
}
```

#### `PATCH /api/users/:id/deactivate`
Roles: `ADMIN`

Response:
```json
{
  "message": "User deactivated"
}
```

## 3. Estates

All estate endpoints are protected.

#### `POST /api/estates`
Roles: `ADMIN`, `OWNER`

Request body:
```json
{
  "name": "string",
  "address": "string",
  "city": "string"
}
```

Response shape:
```json
{
  "id": "uuid",
  "name": "string",
  "address": "string",
  "city": "string",
  "owner_id": "owner_profile_uuid",
  "created_at": "ISO date",
  "updated_at": "ISO date",
  "units": []
}
```

#### `GET /api/estates`
Roles: `ADMIN`, `OWNER`, `CARETAKER`  
Note: tenant is blocked by service logic.

Response shape: array of estates, with role-specific includes:
- Admin: `units`, `owner.user (email, first_name, last_name)`
- Owner: `units`
- Caretaker: assigned estates + `units`

#### `GET /api/estates/:id`
Roles: `ADMIN`, `OWNER`, `CARETAKER` (with access checks)

Response shape:
```json
{
  "id": "uuid",
  "name": "string",
  "address": "string",
  "city": "string",
  "owner": {
    "user_id": "uuid",
    "user": {
      "email": "string",
      "first_name": "string",
      "last_name": "string"
    }
  },
  "units": [],
  "caretaker_estates": [
    {
      "user_id": "uuid",
      "user": {
        "email": "string",
        "first_name": "string",
        "last_name": "string"
      }
    }
  ]
}
```

## 4. Units

All unit endpoints are protected.

#### `POST /api/units`
Roles: `ADMIN`, `OWNER`, `CARETAKER`

Request body:
```json
{
  "unit_number": "string",
  "estate_id": "uuid",
  "monthly_rent": 12000,
  "description": "optional string"
}
```

Response shape:
```json
{
  "id": "uuid",
  "unit_number": "string",
  "estate_id": "uuid",
  "monthly_rent": "decimal string",
  "status": "VACANT|OCCUPIED|MAINTENANCE",
  "description": "string|null",
  "created_at": "ISO date",
  "updated_at": "ISO date"
}
```

#### `GET /api/units/estate/:estateId`
Roles: any authenticated role

Response: array of units in estate with `tenant_profile.user` summary.

#### `GET /api/units/:id`
Roles: any authenticated role

Response: unit with `estate` and `tenant_profile.user` summary.

## 5. Complaints

All complaint endpoints are protected.

### Workflow implemented
1. Tenant/caretaker submits complaint -> `expense_status = PENDING_CARETAKER`
2. Caretaker review:
- approve + `estimated_cost` -> `PENDING_OWNER`
- reject -> `REJECTED`
3. Owner review on pending owner complaints:
- approve + `final_cost` -> `APPROVED` (`approved_by`, `approved_at` set)
- reject -> `REJECTED`

`final_cost` is owner-controlled final amount used for deductions.

### Endpoints

#### `POST /api/complaints`
Roles: `TENANT`, `CARETAKER`

Request body:
```json
{
  "estate_id": "uuid",
  "subject": "string",
  "description": "string",
  "is_deductible": true,
  "tenant_id": "optional uuid"
}
```
Notes:
- Tenant submissions auto-bind to logged-in tenant profile.
- Caretaker can submit with or without `tenant_id`.

Response: created complaint object.

#### `PATCH /api/complaints/:id/caretaker-review`
Roles: `CARETAKER`

Request body:
```json
{
  "decision": "APPROVED|REJECTED",
  "estimated_cost": 1000.5
}
```
Rule: `estimated_cost` required when decision is `APPROVED`.

Response: updated complaint object.

#### `PATCH /api/complaints/:id/owner-review`
Roles: `OWNER`

Request body:
```json
{
  "decision": "APPROVED|REJECTED",
  "final_cost": 900.0
}
```
Rule: `final_cost` required when decision is `APPROVED`.

Response: updated complaint with `approver` summary.

#### `GET /api/complaints/estate/:estateId`
Roles: `ADMIN`, `OWNER`, `CARETAKER`, `TENANT` (with estate-level access checks)

Response: list of non-voided complaints for estate, includes `tenant.user`, `tenant.unit`, and `approver`.

#### `GET /api/complaints/tenant/:tenantId`
Roles:
- `TENANT` (self only)
- `ADMIN`
- `OWNER` (only complaints from estates they own)
- `CARETAKER` (only complaints from assigned estates)

Response: list of non-voided tenant complaints with tenant + approver context.

### Complaint status values

Domain status (`status` field):
- `OPEN`
- `IN_PROGRESS`
- `RESOLVED`
- `CLOSED`

Expense workflow status (`expense_status` field):
- `PENDING_CARETAKER`: newly submitted, awaiting caretaker review
- `PENDING_OWNER`: approved by caretaker, awaiting owner final decision
- `APPROVED`: owner approved and set final cost
- `REJECTED`: rejected at caretaker or owner stage

Source values (`source`):
- `TENANT`
- `CARETAKER`

## 6. Reports

All report endpoints are protected.

#### `GET /api/reports/estate/:estateId/monthly?month=3&year=2026`
Roles: `ADMIN`, `OWNER`, `CARETAKER` (with estate-level access checks)

Query params:
- `month`: integer 1-12
- `year`: integer 2000-2100

Response shape:
```json
{
  "estate_id": "uuid",
  "estate_name": "string",
  "owner_user_id": "uuid",
  "month": 3,
  "year": 2026,
  "total_rent_collected": 150000,
  "total_deductions": 12000,
  "net_owner_payout": 138000,
  "unassigned_deductions": 500,
  "units": [
    {
      "unit_id": "uuid",
      "unit_number": "A1",
      "monthly_rent": 25000,
      "rent_collected": 25000,
      "complaint_deductions": 2000,
      "net_amount": 23000
    }
  ]
}
```

`total_deductions` is computed from approved, deductible complaint `final_cost` in that month window.

## 7. Role Permissions Matrix

| Endpoint | ADMIN | OWNER | CARETAKER | TENANT |
|---|---|---|---|---|
| POST `/api/auth/register` | Yes | Yes | Yes | Yes |
| POST `/api/auth/login` | Yes | Yes | Yes | Yes |
| POST `/api/auth/refresh` | Yes | Yes | Yes | Yes |
| POST `/api/auth/logout` | Yes | Yes | Yes | Yes |
| GET `/api/users` | Yes | No | No | No |
| GET `/api/users/:id` | Yes | No | No | No |
| PATCH `/api/users/:id/deactivate` | Yes | No | No | No |
| POST `/api/estates` | Yes | Yes | No | No |
| GET `/api/estates` | Yes | Yes (own) | Yes (assigned) | No |
| GET `/api/estates/:id` | Yes | Yes (own) | Yes (assigned) | No |
| POST `/api/units` | Yes | Yes | Yes | No |
| GET `/api/units/estate/:estateId` | Yes | Yes | Yes | Yes |
| GET `/api/units/:id` | Yes | Yes | Yes | Yes |
| POST `/api/complaints` | No | No | Yes | Yes |
| PATCH `/api/complaints/:id/caretaker-review` | No | No | Yes (assigned) | No |
| PATCH `/api/complaints/:id/owner-review` | No | Yes (own estate) | No | No |
| GET `/api/complaints/estate/:estateId` | Yes | Yes (own) | Yes (assigned) | Yes (own estate) |
| GET `/api/complaints/tenant/:tenantId` | Yes | Yes (own-estate complaints) | Yes (assigned-estate complaints) | Yes (self only) |
| GET `/api/reports/estate/:estateId/monthly` | Yes | Yes (own) | Yes (assigned) | No |

## 8. Data Models Summary (Frontend-Relevant Fields)

### User
- `id`, `email`, `first_name`, `last_name`, `phone`, `role`, `is_active`, `created_at`, `updated_at`

### Estate
- `id`, `name`, `address`, `city`, `owner_id`, `created_at`, `updated_at`
- relations used by API: `units`, `owner.user`, `caretaker_estates.user`

### Unit
- `id`, `unit_number`, `estate_id`, `monthly_rent`, `status`, `description`, `created_at`, `updated_at`
- relation used by API: `tenant_profile.user`

### TenantProfile
- `id`, `user_id`, `unit_id`, `lease_start`, `lease_end`
- relation used by API: `user`, `unit`

### Complaint
- `id`, `tenant_id` (nullable), `estate_id`, `subject`, `description`
- `status` (`OPEN|IN_PROGRESS|RESOLVED|CLOSED`)
- `source` (`TENANT|CARETAKER`)
- `estimated_cost`, `final_cost`
- `expense_status` (`PENDING_CARETAKER|PENDING_OWNER|APPROVED|REJECTED`)
- `is_deductible`, `approved_by`, `approved_at`
- `is_voided`, `voided_at`, `created_at`, `updated_at`

### Payment (report-related)
- `id`, `amount`, `unit_id`, `tenant_id`, `period_month`, `period_year`, `is_voided`

## 9. Frontend Development Recommendations

### Suggested pages/screens
1. Auth: Register, Login
2. Dashboard by role: ADMIN, OWNER, CARETAKER, TENANT
3. User management (admin): list users, user detail, deactivate action
4. Estates: list, detail, create estate (admin/owner)
5. Units: create unit, list by estate, unit detail
6. Complaints:
- complaint list by estate
- complaint list by tenant
- submit complaint form (tenant/caretaker)
- caretaker review queue (`PENDING_CARETAKER`)
- owner approval queue (`PENDING_OWNER`)
7. Reports:
- monthly estate financial report page (filters: estate, month, year)
- display aggregate and per-unit sections

### Suggested state management needs
1. Auth state:
- store `access_token` and `refresh_token`
- decode/store role and user identity
- auto-attach access token to protected requests
- refresh-on-401 strategy (retry once)
2. Authorization-aware UI:
- route guards by role
- conditionally render actions/buttons per role and per estate ownership/assignment context
3. Domain stores:
- estates + selected estate
- units by estate
- complaints with expense workflow filtering
- monthly report by selected period
4. Request/serialization handling:
- treat decimal values as numbers in UI but be ready for string payloads from backend serialization
- handle validation errors from global Nest validation pipe
