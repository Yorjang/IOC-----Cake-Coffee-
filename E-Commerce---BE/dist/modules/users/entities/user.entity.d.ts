export declare enum UserRole {
    GUEST = "guest",
    CUSTOMER = "customer",
    STAFF = "staff",
    CASHIER = "cashier",
    STORE_MANAGER = "store_manager",
    ADMIN = "admin"
}
export declare class User {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    passwordHash: string;
    role: UserRole;
    branchId: string;
    isActive: boolean;
    emailVerifiedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
