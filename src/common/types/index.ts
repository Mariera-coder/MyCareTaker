import { Role } from '@prisma/client';

export { Role } from '@prisma/client';

export interface JwtPayload {
    sub: string;
    email: string;
    role: Role;
}

export class AuthenticatedUser {
    id!: string;
    email!: string;
    role!: Role;
}

export interface TokenPair {
    access_token: string;
    refresh_token: string;
}

export interface AuthResponse {
    session: {
        user: {
            id: string;
            email: string;
            first_name: string;
            last_name: string;
            role: Role;
            phone: string | null;
        };
        role: Role;
        nextRoute: string;
        estates: Array<{
            id: string;
            name: string;
            address: string;
            city: string;
        }>;
        tenantContext: {
            tenancyId: string;
            monthlyRent: number;
            securityDepositAmount?: number;
            house: {
                id: string;
                name: string;
            };
            estate: {
                id: string;
                name: string;
                address: string;
                city: string;
            };
            caretaker: {
                name: string;
                phoneNumber: string | null;
            } | null;
        } | null;
    };
}
