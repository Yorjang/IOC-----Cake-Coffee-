"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./src/modules/users/entities/user.entity");
const TEST_PHONE = '+84988888888';
const TEST_PASSWORD = 'password123';
const TEST_FULL_NAME = 'Test Logout User';
const BASE_URL = 'http://localhost:3003';
async function runTests() {
    console.log('--- Starting Integration Tests for Log Out API ---');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    await app.listen(3003);
    console.log('NestJS server listening on port 3003');
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
        await userRepository.delete({ phone: TEST_PHONE });
        console.log('Cleaned up existing test user if any.');
        console.log('\nStep 1: Registering test user...');
        const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: TEST_FULL_NAME,
                phone: TEST_PHONE,
                password: TEST_PASSWORD,
            }),
        });
        const registerData = await registerResponse.json();
        assert(registerResponse.status === 201, `Registration should succeed with status 201 (got ${registerResponse.status})`);
        console.log('\nStep 2: Logging in...');
        const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: TEST_PHONE,
                password: TEST_PASSWORD,
            }),
        });
        const loginData = await loginResponse.json();
        assert(loginResponse.status === 201, `Login should succeed with status 201 (got ${loginResponse.status})`);
        assert(typeof loginData.refreshToken === 'string', 'Login should return a refresh token');
        const refreshToken = loginData.refreshToken;
        console.log('\nStep 3: Verifying that token refresh works before logout...');
        const preLogoutRefreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                refreshToken: refreshToken,
            }),
        });
        const preLogoutRefreshData = await preLogoutRefreshRes.json();
        assert(preLogoutRefreshRes.status === 201, `Refresh should succeed with status 201 (got ${preLogoutRefreshRes.status})`);
        assert(typeof preLogoutRefreshData.accessToken === 'string', 'Refresh should return a new access token');
        console.log('\nStep 4: Calling Logout endpoint...');
        const logoutResponse = await fetch(`${BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                refreshToken: refreshToken,
            }),
        });
        const logoutData = await logoutResponse.json();
        assert(logoutResponse.status === 201, `Logout should succeed with status 201 (got ${logoutResponse.status})`);
        assert(logoutData.message === 'Đăng xuất thành công.', `Logout message should be "Đăng xuất thành công." (got "${logoutData.message}")`);
        console.log('\nStep 5: Verifying token refresh fails after logout...');
        const postLogoutRefreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                refreshToken: refreshToken,
            }),
        });
        const postLogoutRefreshData = await postLogoutRefreshRes.json();
        assert(postLogoutRefreshRes.status === 400, `Refresh with blacklisted token should fail with status 400 (got ${postLogoutRefreshRes.status})`);
        assert(postLogoutRefreshData.message === 'Mã token đã bị vô hiệu hóa hoặc người dùng đã đăng xuất.', `Error message should be blacklist error (got "${postLogoutRefreshData.message}")`);
        await userRepository.delete({ phone: TEST_PHONE });
        console.log('\nCleaned up test user from database.');
        console.log('\n⭐ LOG OUT TESTS PASSED SUCCESSFULLY! ⭐');
    }
    catch (error) {
        console.error('\n❌ Tests failed with error:', error);
        passed = false;
    }
    finally {
        try {
            await userRepository.delete({ phone: TEST_PHONE });
        }
        catch (_) { }
        await app.close();
        console.log('NestJS server shut down.');
        process.exit(passed ? 0 : 1);
    }
}
runTests();
//# sourceMappingURL=test-logout.js.map