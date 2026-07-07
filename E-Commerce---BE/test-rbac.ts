import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User, UserRole } from './src/modules/users/entities/user.entity';
import { MailService } from './src/modules/mail/mail.service';

const ADMIN_EMAIL = 'testadmin@example.com';
const MANAGER_EMAIL = 'testmanager@example.com';
const CUSTOMER_EMAIL = 'testcustomer@example.com';
const TEST_PASSWORD = 'password123';
const BASE_URL = 'http://localhost:3001';

async function runTests() {
    console.log('--- Starting Integration Tests for PBAC (Permission-based Access Control) ---');
    
    // Boot NestJS application on port 3001
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    await app.listen(3001);
    console.log('NestJS server listening on port 3001');

    // Mock MailService to bypass SMTP requirements during test
    const mailService = app.get(MailService);
    mailService.sendVerificationEmail = async (to: string, token: string) => {
        console.log(`[Mock MailService] Intercepted sendVerificationEmail to ${to}`);
        return Promise.resolve();
    };

    const dataSource = app.get(DataSource);
    const userRepository = dataSource.getRepository(User);

    let passed = true;

    function assert(condition: any, message: string) {
        if (!condition) {
            console.error(`❌ ASSERTION FAILED: ${message}`);
            passed = false;
            throw new Error(`Assertion failed: ${message}`);
        } else {
            console.log(`✅ ${message}`);
        }
    }

    try {
        // 1. Initial cleanup of previous test runs
        await userRepository.delete({ email: ADMIN_EMAIL });
        await userRepository.delete({ email: MANAGER_EMAIL });
        await userRepository.delete({ email: CUSTOMER_EMAIL });
        console.log('Cleaned up existing test users.');

        // 2. Register Customer User
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

        // 3. Register Manager User
        console.log('Registering Manager User...');
        const registerManagerRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: 'Test Manager',
                email: MANAGER_EMAIL,
                password: TEST_PASSWORD,
            }),
        });
        assert(registerManagerRes.status === 201, `Manager registration should succeed (got ${registerManagerRes.status})`);

        // 4. Register Admin User
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

        // 5. Activate all users and set roles in DB
        console.log('Activating and setting roles in database...');
        const customerUser = await userRepository.findOne({ where: { email: CUSTOMER_EMAIL } });
        assert(customerUser !== null, 'Customer user should exist in DB');
        if (customerUser) {
            customerUser.isActive = true;
            customerUser.emailVerifiedAt = new Date();
            await userRepository.save(customerUser);
        }

        const managerUser = await userRepository.findOne({ where: { email: MANAGER_EMAIL } });
        assert(managerUser !== null, 'Manager user should exist in DB');
        if (managerUser) {
            managerUser.isActive = true;
            managerUser.emailVerifiedAt = new Date();
            managerUser.role = UserRole.STORE_MANAGER;
            await userRepository.save(managerUser);
        }

        const adminUser = await userRepository.findOne({ where: { email: ADMIN_EMAIL } });
        assert(adminUser !== null, 'Admin user should exist in DB');
        if (adminUser) {
            adminUser.isActive = true;
            adminUser.emailVerifiedAt = new Date();
            adminUser.role = UserRole.ADMIN;
            await userRepository.save(adminUser);
        }

        // 6. Log in as Customer
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

        // 7. Log in as Manager
        console.log('Logging in as Manager...');
        const managerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: MANAGER_EMAIL,
                password: TEST_PASSWORD,
            }),
        });
        const managerLoginData = await managerLoginRes.json();
        assert(managerLoginRes.status === 201, 'Manager login succeeded');
        const managerToken = managerLoginData.accessToken;

        // 8. Log in as Admin
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

        // 9. Verify /users/me works
        console.log('Testing GET /users/me for Customer...');
        const customerMeRes = await fetch(`${BASE_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${customerToken}` },
        });
        const customerMeData = await customerMeRes.json();
        assert(customerMeRes.status === 200, 'Customer me succeeded');
        assert(customerMeData.email === CUSTOMER_EMAIL, 'Returned correct email');

        // 10. Verify GET /users (Requires Permission.VIEW_USERS)
        console.log('Testing GET /users with Customer token (should fail)...');
        const customerUsersRes = await fetch(`${BASE_URL}/users`, {
            headers: { 'Authorization': `Bearer ${customerToken}` },
        });
        assert(customerUsersRes.status === 403, `Customer should get 403 Forbidden for list (got ${customerUsersRes.status})`);

        console.log('Testing GET /users with Manager token (should succeed since MANAGER has VIEW_USERS)...');
        const managerUsersRes = await fetch(`${BASE_URL}/users`, {
            headers: { 'Authorization': `Bearer ${managerToken}` },
        });
        const managerUsersData = await managerUsersRes.json();
        assert(managerUsersRes.status === 200, `Manager should get 200 OK (got ${managerUsersRes.status})`);
        assert(Array.isArray(managerUsersData), 'Returned users is an array');

        console.log('Testing GET /users with Admin token (should succeed since ADMIN has wildcard ALL)...');
        const adminUsersRes = await fetch(`${BASE_URL}/users`, {
            headers: { 'Authorization': `Bearer ${adminToken}` },
        });
        const adminUsersData = await adminUsersRes.json();
        assert(adminUsersRes.status === 200, `Admin should get 200 OK (got ${adminUsersRes.status})`);
        assert(Array.isArray(adminUsersData), 'Returned users is an array');

        // 11. Verify PATCH /users/:id/role (Requires Permission.MANAGE_USERS)
        console.log('Testing PATCH /users/:id/role with Customer token (should fail)...');
        const updateRoleByCustomerRes = await fetch(`${BASE_URL}/users/${customerUser!.id}/role`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${customerToken}`,
            },
            body: JSON.stringify({ role: UserRole.STAFF }),
        });
        assert(updateRoleByCustomerRes.status === 403, `Customer role update should fail with 403 (got ${updateRoleByCustomerRes.status})`);

        console.log('Testing PATCH /users/:id/role with Manager token (should fail because MANAGER does NOT have MANAGE_USERS)...');
        const updateRoleByManagerRes = await fetch(`${BASE_URL}/users/${customerUser!.id}/role`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${managerToken}`,
            },
            body: JSON.stringify({ role: UserRole.STAFF }),
        });
        assert(updateRoleByManagerRes.status === 403, `Manager role update should fail with 403 (got ${updateRoleByManagerRes.status})`);

        console.log('Testing PATCH /users/:id/role with Admin token (should succeed)...');
        const updateRoleByAdminRes = await fetch(`${BASE_URL}/users/${customerUser!.id}/role`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
            },
            body: JSON.stringify({ role: UserRole.STAFF }),
        });
        const updateRoleByAdminData = await updateRoleByAdminRes.json();
        assert(updateRoleByAdminRes.status === 200, `Admin role update should succeed (got ${updateRoleByAdminRes.status})`);
        assert(updateRoleByAdminData.role === UserRole.STAFF, `Returned user has staff role (got ${updateRoleByAdminData.role})`);

        // Check DB state to confirm role change is persisted
        const updatedUserInDb = await userRepository.findOne({ where: { id: customerUser!.id } });
        assert(updatedUserInDb !== null && updatedUserInDb.role === UserRole.STAFF, 'Role change persisted in DB');

        console.log('\n⭐ ALL PBAC AND PERMISSION ASSIGNMENT TESTS PASSED SUCCESSFULLY! ⭐');
    } catch (error) {
        console.error('\n❌ Tests failed with error:', error);
        passed = false;
    } finally {
        // Clean up test users
        try {
            await userRepository.delete({ email: ADMIN_EMAIL });
            await userRepository.delete({ email: MANAGER_EMAIL });
            await userRepository.delete({ email: CUSTOMER_EMAIL });
        } catch (_) {}
        await app.close();
        console.log('NestJS server shut down.');
        process.exit(passed ? 0 : 1);
    }
}

runTests();
