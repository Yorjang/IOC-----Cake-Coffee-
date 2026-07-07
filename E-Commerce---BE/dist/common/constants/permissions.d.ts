import { UserRole } from '../../modules/users/entities/user.entity';
export declare enum Permission {
    ALL = "all",
    MANAGE_USERS = "manage_users",
    VIEW_USERS = "view_users",
    CREATE_PRODUCT = "create_product",
    UPDATE_PRODUCT = "update_product",
    DELETE_PRODUCT = "delete_product",
    VIEW_INVENTORY = "view_inventory",
    MANAGE_INVENTORY = "manage_inventory",
    CREATE_ORDER = "create_order",
    VIEW_ORDER = "view_order",
    UPDATE_ORDER = "update_order"
}
export declare const ROLE_PERMISSIONS: Record<UserRole, Permission[]>;
