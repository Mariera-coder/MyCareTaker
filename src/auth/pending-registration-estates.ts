export interface RequestedEstateInput {
  name: string;
  unitCount?: number;
}

interface SerializedEstateRequest {
  requestedEstates: RequestedEstateInput[];
  tenantEstateOfInterest?: string;
}

const ESTATE_REQUEST_PREFIX = '__ESTATE_REQUEST__:';

export function serializeEstateRequest(
  data: SerializedEstateRequest,
): string | null {
  const requestedEstates = data.requestedEstates
    .map((estate) => ({
      name: estate.name.trim(),
      unitCount:
        typeof estate.unitCount === 'number' &&
        Number.isFinite(estate.unitCount)
          ? Math.max(0, Math.floor(estate.unitCount))
          : undefined,
    }))
    .filter((estate) => estate.name.length > 0);

  if (!requestedEstates.length && !data.tenantEstateOfInterest?.trim()) {
    return null;
  }

  return `${ESTATE_REQUEST_PREFIX}${JSON.stringify({
    requestedEstates,
    tenantEstateOfInterest: data.tenantEstateOfInterest?.trim() || undefined,
  })}`;
}

export function parseEstateRequest(
  value?: string | null,
): SerializedEstateRequest {
  if (!value) {
    return { requestedEstates: [] };
  }

  if (!value.startsWith(ESTATE_REQUEST_PREFIX)) {
    return {
      requestedEstates: value.trim() ? [{ name: value.trim() }] : [],
      tenantEstateOfInterest: value.trim() || undefined,
    };
  }

  try {
    const parsed = JSON.parse(
      value.slice(ESTATE_REQUEST_PREFIX.length),
    ) as SerializedEstateRequest;

    return {
      requestedEstates: Array.isArray(parsed.requestedEstates)
        ? parsed.requestedEstates
            .map((estate) => ({
              name: typeof estate?.name === 'string' ? estate.name.trim() : '',
              unitCount:
                typeof estate?.unitCount === 'number' &&
                Number.isFinite(estate.unitCount)
                  ? Math.max(0, Math.floor(estate.unitCount))
                  : undefined,
            }))
            .filter((estate) => estate.name.length > 0)
        : [],
      tenantEstateOfInterest:
        typeof parsed.tenantEstateOfInterest === 'string'
          ? parsed.tenantEstateOfInterest.trim()
          : undefined,
    };
  } catch {
    return { requestedEstates: [] };
  }
}
