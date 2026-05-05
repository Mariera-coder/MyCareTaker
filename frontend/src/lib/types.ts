export type Role = "ADMIN" | "OWNER" | "CARETAKER" | "TENANT";
export type PendingRegistrationRole = "TENANT" | "CARETAKER" | "OWNER";
export type RentRecordStatus = "PENDING" | "PARTIAL" | "PAID" | "CARRIED_FORWARD";
export type ComplaintStatus = "OPEN" | "CARETAKER_REVIEW" | "OWNER_APPROVED" | "RESOLVED";

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  phone?: string | null;
}

export interface EstateSummary {
  id: string;
  name: string;
  address: string;
  city: string;
}

export interface TenantContext {
  tenancyId: string;
  monthlyRent: number;
  house: {
    id: string;
    name: string;
  };
  estate: EstateSummary;
  caretaker: {
    name: string;
    phoneNumber: string | null;
  } | null;
}

export interface AuthSession {
  user: AuthUser;
  role: Role;
  nextRoute: string;
  estates: EstateSummary[];
  tenantContext: TenantContext | null;
}

export interface AuthSessionResponse {
  session: AuthSession;
}

export interface Estate {
  id: string;
  name: string;
  address: string;
  city: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    email: string | null;
    first_name: string;
    last_name: string;
  } | null;
  caretaker_estates?: Array<{
    id: string;
    user_id: string;
    user: {
      id: string;
      email: string | null;
      first_name: string;
      last_name: string;
      phone?: string | null;
    };
  }>;
  houses?: Array<{
    id: string;
    name: string;
    rentAmount: string | number;
    isOccupied: boolean;
    tenancies?: Array<{
      id: string;
      endDate: string | null;
      tenant: {
        id: string;
        email?: string | null;
        first_name: string;
        last_name: string;
        phone?: string | null;
      };
    }>;
  }>;
}

export interface AvailableHouse {
  id: string;
  name: string;
  estateId: string;
  rentAmount: string | number;
  isOccupied?: boolean;
  tenancies?: Array<{
    id: string;
    securityDepositAmount: string | number;
    tenant: {
      id: string;
      first_name: string;
      last_name: string;
      phone?: string | null;
      email?: string | null;
      is_active?: boolean;
    };
  }>;
  estate: {
    id: string;
    name: string;
  };
}

export interface PendingRegistration {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  role: PendingRegistrationRole;
  estateOfInterest: string | null;
  message: string | null;
  status: "AWAITING_ADMIN" | "APPROVED" | "DENIED";
  createdAt: string;
}

export interface TenantDashboard {
  tenancy: {
    id: string;
    monthlyRent: number;
    securityDepositAmount: number;
    creditBalance: number;
    moveInDate: string;
    house: { id: string; name: string };
    estate: EstateSummary;
  };
  summary: {
    monthlyRentDue: number;
    amountPaidThisMonth: number;
    outstandingBalance: number;
    securityDepositAmount: number;
    includesSecurityDeposit: boolean;
    baseRent: number;
    carriedForward: number;
    securityDepositCharged: number;
    depositSettled: boolean;
    creditBalance: number;
  };
  previousMonthStatus: {
    status: RentRecordStatus;
    deficit: number;
  } | null;
  rentRecords: Array<{
    id: string;
    monthYear: string;
    amountDue: number;
    amountPaid: number;
    deficit: number;
    carriedForwardAmount: number;
    baseRent: number;
    securityDepositCharged: number;
    displayBalance: number;
    displayStatus: RentRecordStatus;
    status: RentRecordStatus;
    pendingConfirmation: boolean;
  }>;
  planner: Array<{
    weekNumber: number;
    targetAmount: number;
    confirmedPaid: number;
    remaining: number;
    progress: number;
  }>;
  paymentInstructions: {
    caretakerName: string;
    caretakerPhoneNumber: string | null;
  } | null;
}

export interface EstateDashboard {
  stats: {
    totalRentExpected: number;
    totalCollected: number;
    totalDeficit: number;
    occupiedUnits: number;
    vacantUnits: number;
    awaitingConfirmation: number;
    currentMonthDeductibleExpenses: number;
    totalApprovedDeductibleExpenses: number;
  };
  rows: Array<{
    houseId: string;
    tenantId: string | null;
    houseName: string;
    tenantName: string;
    tenantPhone: string | null;
    tenantEmail: string | null;
    monthlyRent: number;
    carriedForward: number;
    securityDepositCharged: number;
    depositSettled: boolean;
    expectedThisMonth: number;
    paid: number;
    deficit: number;
    securityDepositAmount: number;
    prevMonthStatus: string;
  }>;
}

export interface PendingPayment {
  id: string;
  houseName: string;
  tenantName: string;
  amountClaimed: number;
  paymentType: "FULL" | "INSTALLMENT" | "PARTIAL";
  dateSubmitted: string;
  weekNumber: number | null;
  note: string | null;
}

export interface TenantReceipt {
  id: string;
  amount: number;
  paymentDate: string;
  confirmedAt: string | null;
  paymentType: "FULL" | "INSTALLMENT" | "PARTIAL";
  cycleLabel: string;
  note: string | null;
}

export interface EstatePaymentConfirmation {
  tenants: Array<{
    tenancyId: string;
    tenantId: string;
    tenantName: string;
    tenantPhone: string | null;
    tenantEmail: string | null;
    houseId: string;
    houseName: string;
    isActive: boolean;
    tenantIsActive: boolean;
    tenancyEndDate: string | null;
    creditBalance: number;
    receipts: TenantReceipt[];
  }>;
  pendingPayments: Array<{
    id: string;
    tenancyId: string;
    tenantId: string;
    tenantName: string;
    tenantPhone: string | null;
    tenantEmail: string | null;
    houseName: string;
    amountClaimed: number;
    paymentType: "FULL" | "INSTALLMENT" | "PARTIAL";
    dateSubmitted: string;
    cycleLabel: string;
    note: string | null;
  }>;
}

export interface Complaint {
  id: string;
  description: string;
  status: ComplaintStatus;
  isDeductibleExpense: boolean;
  estimatedCost: string | null;
  approvedCost: string | null;
  caretakerNotes: string | null;
  ownerNotes: string | null;
  createdAt: string;
  updatedAt: string;
  house: {
    id: string;
    name: string;
  };
  estate: EstateSummary;
  tenancy: {
    id: string;
    tenant: {
      id: string;
      first_name: string;
      last_name: string;
      phone: string | null;
    };
  };
  filedByTenant: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
  };
}

export interface MonthlyReport {
  estate_id: string;
  estate_name: string;
  owner_user_id: string;
  month: number;
  year: number;
  total_rent_collected: number;
  complaint_deductions_total: number;
  caretaker_salary_deduction: number;
  total_deductions: number;
  net_owner_payout: number;
  unassigned_deductions: number;
  salary_payments: Array<{
    id: string;
    amount: number;
    note: string | null;
    paid_at: string;
    salary_month_year: string;
    caretaker_name: string | null;
    paid_by_name: string | null;
  }>;
  monthly_collections: Array<{
    month: number;
    month_label: string;
    total_rent_collected: number;
    complaint_deductions_total: number;
    caretaker_salary_deduction: number;
    total_deductions: number;
    net_owner_payout: number;
  }>;
  units: Array<{
    unit_id: string;
    unit_number: string;
    tenant_name: string | null;
    tenant_is_active: boolean | null;
    tenancy_is_active: boolean | null;
    tenancy_end_date: string | null;
    monthly_rent: number;
    rent_collected: number;
    complaint_deductions: number;
    net_amount: number;
  }>;
}

export interface Unit {
  id: string;
  unit_number: string;
  estate_id: string;
  monthly_rent: string | number;
  status: "VACANT" | "OCCUPIED" | "MAINTENANCE";
  description: string | null;
}

export type ExpenseStatus =
  | "PENDING_CARETAKER"
  | "PENDING_OWNER"
  | "APPROVED"
  | "REJECTED";
