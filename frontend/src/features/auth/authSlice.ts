import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthSession, AuthUser, EstateSummary, TenantContext } from "@/lib/types";

interface AuthState {
  user: AuthUser | null;
  role: AuthUser["role"] | null;
  availableEstates: EstateSummary[];
  selectedEstateId: string | null;
  tenantContext: TenantContext | null;
  nextRoute: string | null;
  sessionChecked: boolean;
}

const ESTATE_STORAGE_KEY = "mycaretaker_selected_estate";

const loadSelectedEstateId = (): string | null => {
  try {
    return localStorage.getItem(ESTATE_STORAGE_KEY);
  } catch {
    return null;
  }
};

const persistSelectedEstateId = (selectedEstateId: string | null) => {
  try {
    if (selectedEstateId) {
      localStorage.setItem(ESTATE_STORAGE_KEY, selectedEstateId);
    } else {
      localStorage.removeItem(ESTATE_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors and keep auth state in memory.
  }
};

const initialState: AuthState = {
  user: null,
  role: null,
  availableEstates: [],
  selectedEstateId: loadSelectedEstateId(),
  tenantContext: null,
  nextRoute: null,
  sessionChecked: false,
};

function applySession(state: AuthState, session: AuthSession) {
  state.user = session.user;
  state.role = session.role;
  state.availableEstates = session.estates;
  state.tenantContext = session.tenantContext;
  state.sessionChecked = true;

  if (
    state.selectedEstateId &&
    !session.estates.some((estate) => estate.id === state.selectedEstateId)
  ) {
    state.selectedEstateId = null;
    persistSelectedEstateId(null);
  }

  if (
    !state.selectedEstateId &&
    session.estates.length === 1 &&
    ["CARETAKER", "OWNER"].includes(session.role)
  ) {
    state.selectedEstateId = session.estates[0].id;
    persistSelectedEstateId(session.estates[0].id);
  }

  state.nextRoute =
    ["CARETAKER", "OWNER"].includes(session.role) && state.selectedEstateId
      ? '/dashboard'
      : session.nextRoute;
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<AuthSession>) => {
      applySession(state, action.payload);
    },
    selectEstate: (state, action: PayloadAction<string>) => {
      state.selectedEstateId = action.payload;
      persistSelectedEstateId(action.payload);
    },
    clearAuth: (state) => {
      state.user = null;
      state.role = null;
      state.availableEstates = [];
      state.selectedEstateId = null;
      state.tenantContext = null;
      state.nextRoute = null;
      state.sessionChecked = true;
      persistSelectedEstateId(null);
    },
  },
});

export const { setSession, selectEstate, clearAuth } = authSlice.actions;
export default authSlice.reducer;
