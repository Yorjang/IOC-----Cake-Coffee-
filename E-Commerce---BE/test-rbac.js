"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./src/modules/users/entities/user.entity");
const mail_service_1 = require("./src/modules/mail/mail.service");
const ADMIN_EMAIL = 'testadmin@example.com';
const CUSTOMER_EMAIL = 'testcustomer@example.com';
const TEST_PASSWORD = 'password123';
const BASE_URL = 'http://localhost:3001';
async function runTests() {
    console.log('--- Starting Integration Tests for RBAC and Role Assignment ---');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    await app.listen(3001);
    console.log('NestJS server listening on port 3001');
    const mailService = app.get(mail_service_1.MailService);
    mailService.sendVerificationEmail = async (to, token) => {
        console.log(`[Mock MailService] Intercepted sendVerificationEmail to ${to}`);
        return Promise.resolve();
    };
    const dataSource = app.get(typeorm_1.DataSource);
    const userRepository = dataSource.getRepository(user_entity_1.User);
    let passed = true;
    function assert(condition, message) {
        if (!condition) {
            console.error(`❌ ASSERTION FAILED: ${message}`);
            passed = false;
            throw new Error(`Assertion failed: ${message}`);
        }
        else {
            console.log(`✅ ${message}`);
        }
    }
    try {
        await userRepository.delete({ email: ADMIN_EMAIL });
        await userRepository.delete({ email: CUSTOMER_EMAIL });
        console.log('Cleaned up existing test users.');
        console.log('Registering Customer User...');
        const registerCustomerRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: 'Test Customer',
                email: CUSTOMER_EMAIL,
                password: TEST_PASSWORD,
            }),
        });
        assert(registerCustomerRes.status === 201, `Customer registration should succeed (got ${registerCustomerRes.status})`);
        console.log('Registering Admin User...');
        const registerAdminRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: 'Test Admin',
                email: ADMIN_EMAIL,
                password: TEST_PASSWORD,
            }),
        });
        assert(registerAdminRes.status === 201, `Admin registration should succeed (got ${registerAdminRes.status})`);
        console.log('Activating and setting roles in database...');
        const customerUser = await userRepository.findOne({ where: { email: CUSTOMER_EMAIL } });
        assert(customerUser !== null, 'Customer user should exist in DB');
        if (customerUser) {
            customerUser.isActive = true;
            customerUser.emailVerifiedAt = new Date();
            await userRepository.save(customerUser);
        }
        const adminUser = await userRepository.findOne({ where: { email: ADMIN_EMAIL } });
        assert(adminUser !== null, 'Admin user should exist in DB');
        if (adminUser) {
            adminUser.isActive = true;
            adminUser.emailVerifiedAt = new Date();
            adminUser.role = user_entity_1.UserRole.ADMIN;
            await userRepository.save(adminUser);
        }
        console.log('Logging in as Customer...');
        const customerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: CUSTOMER_EMAIL,
                password: TEST_PASSWORD,
            }),
        });
        const customerLoginData = await customerLoginRes.json();
        assert(customerLoginRes.status === 201, 'Customer login succeeded');
        const customerToken = customerLoginData.accessToken;
        console.log('Logging in as Admin...');
        const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: ADMIN_EMAIL,
                password: TEST_PASSWORD,
            }),
        });
        const adminLoginData = await adminLoginRes.json();
        assert(adminLoginRes.status === 201, 'Admin login succeeded');
        const adminToken = adminLoginData.accessToken;
        console.log('Testing GET /users/me for Customer...');
        const customerMeRes = await fetch(`${BASE_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${customerToken}` },
        });
        const customerMeData = await customerMeRes.json();
        assert(customerMeRes.status === 200, 'Customer me succeeded');
        assert(customerMeData.email === CUSTOMER_EMAIL, 'Returned correct email');
        console.log('Testing GET /users/me for Admin...');
        const adminMeRes = await fetch(`${BASE_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${adminToken}` },
        });
        const adminMeData = await adminMeRes.json();
        assert(adminMeRes.status === 200, 'Admin me succeeded');
        assert(adminMeData.email === ADMIN_EMAIL, 'Returned correct email');
        console.log('Testing GET /users with Customer token (should fail)...');
        const customerUsersRes = await fetch(`${BASE_URL}/users`, {
            headers: { 'Authorization': `Bearer ${customerToken}` },
        });
        assert(customerUsersRes.status === 403, `Customer should get 403 Forbidden for list (got ${customerUsersRes.status})`);
        console.log('Testing GET /users with Admin token (should succeed)...');
        const adminUsersRes = await fetch(`${BASE_URL}/users`, {
            headers: { 'Authorization': `Bearer ${adminToken}` },
        });
        const adminUsersData = await adminUsersRes.json();
        assert(adminUsersRes.status === 200, `Admin should get 200 OK (got ${adminUsersRes.status})`);
        assert(Array.isArray(adminUsersData), 'Returned users is an array');
        console.log('Testing PATCH /users/:id/role with Customer token (should fail)...');
        const updateRoleByCustomerRes = await fetch(`${BASE_URL}/users/${customerUser.id}/role`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${customerToken}`,
            },
            body: JSON.stringify({ role: user_entity_1.UserRole.STAFF }),
        });
        assert(updateRoleByCustomerRes.status === 403, `Customer role update should fail with 403 (got ${updateRoleByCustomerRes.status})`);
        console.log('Testing PATCH /users/:id/role with Admin token and invalid role value...');
        const updateRoleInvalidValRes = await fetch(`${BASE_URL}/users/${customerUser.id}/role`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
            },
            body: JSON.stringify({ role: 'super-user' }),
        });
        assert(updateRoleInvalidValRes.status === 400, `Should fail with 400 for invalid role value (got ${updateRoleInvalidValRes.status})`);
        console.log('Testing PATCH /users/:id/role with Admin token (should succeed)...');
        const updateRoleByAdminRes = await fetch(`${BASE_URL}/users/${customerUser.id}/role`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
            },
            body: JSON.stringify({ role: user_entity_1.UserRole.STAFF }),
        });
        const updateRoleByAdminData = await updateRoleByAdminRes.json();
        assert(updateRoleByAdminRes.status === 200, `Admin role update should succeed (got ${updateRoleByAdminRes.status})`);
        assert(updateRoleByAdminData.role === user_entity_1.UserRole.STAFF, `Returned user has staff role (got ${updateRoleByAdminData.role})`);
        const updatedUserInDb = await userRepository.findOne({ where: { id: customerUser.id } });
        assert(updatedUserInDb !== null && updatedUserInDb.role === user_entity_1.UserRole.STAFF, 'Role change persisted in DB');
        console.log('\n⭐ ALL RBAC AND ROLE ASSIGNMENT TESTS PASSED SUCCESSFULLY! ⭐');
    }
    catch (error) {
        console.error('\n❌ Tests failed with error:', error);
        passed = false;
    }
    finally {
        try {
            await userRepository.delete({ email: ADMIN_EMAIL });
            await userRepository.delete({ email: CUSTOMER_EMAIL });
        }
        catch (_) { }
        await app.close();
        console.log('NestJS server shut down.');
        process.exit(passed ? 0 : 1);
    }
}
runTests();
//# sourceMappingURL=test-rbac.js.map