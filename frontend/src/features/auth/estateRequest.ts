export interface RequestedEstate {
  name: string;
  unitCount?: number;
}

const ESTATE_REQUEST_PREFIX = "__ESTATE_REQUEST__:";

export function parseEstateRequest(rawValue?: string | null) {
  if (!rawValue) {
    return {
      requestedEstates: [] as RequestedEstate[],
      tenantEstateOfInterest: "",
    };
  }

  if (!rawValue.startsWith(ESTATE_REQUEST_PREFIX)) {
    return {
      requestedEstates: rawValue.trim() ? [{ name: rawValue.trim() }] : [],
      tenantEstateOfInterest: rawValue.trim(),
    };
  }

  try {
    const parsed = JSON.parse(rawValue.slice(ESTATE_REQUEST_PREFIX.length)) as {
      requestedEstates?: RequestedEstate[];
      tenantEstateOfInterest?: string;
    };

    return {
      requestedEstates: Array.isArray(parsed.requestedEstates)
        ? parsed.requestedEstates.filter((estate) => estate?.name?.trim())
        : [],
      tenantEstateOfInterest: parsed.tenantEstateOfInterest ?? "",
    };
  } catch {
    return {
      requestedEstates: [] as RequestedEstate[],
      tenantEstateOfInterest: "",
    };
  }
}
