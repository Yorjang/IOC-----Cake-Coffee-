import { UserRole } from '../../modules/users/user.entity';

export enum Permission {
  ALL = 'all',
  
  // Users
  MANAGE_USERS = 'manage_users',
  VIEW_USERS = 'view_users',

  // Branches
  MANAGE_BRANCHES = 'manage_branches',
  VIEW_BRANCHES = 'view_branches',
  
  // Products
  CREATE_PRODUCT = 'create_product',
  UPDATE_PRODUCT = 'update_product',
  DELETE_PRODUCT = 'delete_product',
  
  // Inventory
  VIEW_INVENTORY = 'view_inventory',
  MANAGE_INVENTORY = 'manage_inventory',
  
  // Orders
  CREATE_ORDER = 'create_order',
  VIEW_ORDER = 'view_order',
  UPDATE_ORDER = 'update_order',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [Permission.ALL],
  [UserRole.STORE_MANAGER]: [
    Permission.VIEW_USERS,
    Permission.VIEW_BRANCHES,
    Permission.MANAGE_BRANCHES,
    Permission.UPDATE_PRODUCT,
    Permission.DELETE_PRODUCT,
    Permission.VIEW_INVENTORY,
    Permission.MANAGE_INVENTORY,
    Permission.VIEW_ORDER,
    Permission.UPDATE_ORDER,
  ],
  [UserRole.STAFF]: [
    Permission.VIEW_BRANCHES,
    Permission.VIEW_INVENTORY,
    Permission.VIEW_ORDER,
    Permission.UPDATE_ORDER,
  ],
  [UserRole.CASHIER]: [
    Permission.VIEW_BRANCHES,
    Permission.CREATE_ORDER,
    Permission.VIEW_ORDER,
    Permission.UPDATE_ORDER,
  ],
  [UserRole.CUSTOMER]: [
    Permission.CREATE_ORDER,
    Permission.VIEW_ORDER,
  ],
  [UserRole.GUEST]: [],
};
