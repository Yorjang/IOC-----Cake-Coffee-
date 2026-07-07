"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = exports.Permission = void 0;
const user_entity_1 = require("../../modules/users/entities/user.entity");
var Permission;
(function (Permission) {
    Permission["ALL"] = "all";
    Permission["MANAGE_USERS"] = "manage_users";
    Permission["VIEW_USERS"] = "view_users";
    Permission["CREATE_PRODUCT"] = "create_product";
    Permission["UPDATE_PRODUCT"] = "update_product";
    Permission["DELETE_PRODUCT"] = "delete_product";
    Permission["VIEW_INVENTORY"] = "view_inventory";
    Permission["MANAGE_INVENTORY"] = "manage_inventory";
    Permission["CREATE_ORDER"] = "create_order";
    Permission["VIEW_ORDER"] = "view_order";
    Permission["UPDATE_ORDER"] = "update_order";
})(Permission || (exports.Permission = Permission = {}));
exports.ROLE_PERMISSIONS = {
    [user_entity_1.UserRole.ADMIN]: [Permission.ALL],
    [user_entity_1.UserRole.STORE_MANAGER]: [
        Permission.VIEW_USERS,
        Permission.CREATE_PRODUCT,
        Permission.UPDATE_PRODUCT,
        Permission.DELETE_PRODUCT,
        Permission.VIEW_INVENTORY,
        Permission.MANAGE_INVENTORY,
        Permission.VIEW_ORDER,
        Permission.UPDATE_ORDER,
    ],
    [user_entity_1.UserRole.STAFF]: [
        Permission.VIEW_INVENTORY,
        Permission.VIEW_ORDER,
    ],
    [user_entity_1.UserRole.CASHIER]: [
        Permission.CREATE_ORDER,
        Permission.VIEW_ORDER,
        Permission.UPDATE_ORDER,
    ],
    [user_entity_1.UserRole.CUSTOMER]: [
        Permission.CREATE_ORDER,
        Permission.VIEW_ORDER,
    ],
    [user_entity_1.UserRole.GUEST]: [],
};
//# sourceMappingURL=permissions.js.map