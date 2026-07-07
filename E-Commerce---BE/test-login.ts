import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from './src/modules/users/entities/user.entity';
import { MailService } from './src/modules/mail/mail.service';

const TEST_EMAIL = 'testlogin@example.com';
const TEST_PASSWORD = 'password123';
const TEST_FULL_NAME = 'Test Login User';
const BASE_URL = 'http://localhost:3001';

async function runTests() {
    console.log('--- Starting Integration Tests for Login API ---');
    
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
        await userRepository.delete({ email: TEST_EMAIL });
        console.log('Cleaned up existing test user if any.');

        // 2. Test registration
        console.log('Testing User Registration...');
        const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: TEST_FULL_NAME,
                email: TEST_EMAIL,
                password: TEST_PASSWORD,
            }),
        });

        const registerData = await registerResponse.json();
        assert(registerResponse.status === 201, `Registration should succeed with status 201 (got ${registerResponse.status})`);
        assert(registerData.requiresVerification === true, 'Registration should require verification');
        assert(registerData.email === TEST_EMAIL, 'Registration email matches');

        // 3. Try to login before verification (should fail)
        console.log('Testing Login before verification...');
        const preVerifyLoginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_EMAIL,
                password: TEST_PASSWORD,
            }),
        });
        const preVerifyLoginData = await preVerifyLoginRes.json();
        assert(preVerifyLoginRes.status === 400, `Login before verification should fail with status 400 (got ${preVerifyLoginRes.status})`);
        assert(preVerifyLoginData.message && preVerifyLoginData.message.includes('verify'), 'Error message mentions verification');

        // 4. Manually verify/activate the user in DB
        console.log('Manually verifying user in database...');
        const testUser = await userRepository.findOne({ where: { email: TEST_EMAIL } });
        assert(testUser !== null, 'Test user should exist in the database');
        if (testUser) {
            testUser.isActive = true;
            testUser.emailVerifiedAt = new Date();
            await userRepository.save(testUser);
            console.log('Test user is now activated.');
        }

        // 5. Test successful login
        console.log('Testing Successful Login...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_EMAIL,
                password: TEST_PASSWORD,
            }),
        });

        const loginData = await loginRes.json();
        assert(loginRes.status === 201, `Login should succeed with status 201 (got ${loginRes.status})`);
        assert(typeof loginData.accessToken === 'string', 'Login returns access token');
        assert(typeof loginData.refreshToken === 'string', 'Login returns refresh token');
        assert(loginData.user && loginData.user.email === TEST_EMAIL, 'Login returns correct user info');
        assert(!loginData.user.passwordHash, 'Sanitized user object does not leak password hash');

        const firstAccessToken = loginData.accessToken;
        const refreshToken = loginData.refreshToken;

        // 6. Test login with wrong password
        console.log('Testing Login with incorrect password...');
        const wrongPasswordRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_EMAIL,
                password: 'wrongpassword',
            }),
        });
        const wrongPasswordData = await wrongPasswordRes.json();
        assert(wrongPasswordRes.status === 400, `Incorrect password login should return status 400 (got ${wrongPasswordRes.status})`);
        assert(wrongPasswordData.message === 'Invalid credentials', `Wrong password error message is correct (got "${wrongPasswordData.message}")`);

        // 7. Test login with missing fields
        console.log('Testing Login with missing fields...');
        const missingFieldsRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                password: TEST_PASSWORD,
            }),
        });
        assert(missingFieldsRes.status === 400, `Missing email/phone login should fail with status 400 (got ${missingFieldsRes.status})`);

        // 8. Test Refresh Token
        console.log('Testing Token Refreshing...');
        // Wait 1.1s so that the iat (issued at) timestamp of the new JWT is different
        await new Promise((resolve) => setTimeout(resolve, 1100));

        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                refreshToken: refreshToken,
            }),
        });
        const refreshData = await refreshRes.json();
        assert(refreshRes.status === 201, `Token refresh should succeed with status 201 (got ${refreshRes.status})`);
        assert(typeof refreshData.accessToken === 'string', 'Refresh returns new access token');
        assert(typeof refreshData.refreshToken === 'string', 'Refresh returns new refresh token');
        assert(refreshData.accessToken !== firstAccessToken, 'New access token is different');

        // 9. Test Refresh Token with invalid token
        console.log('Testing Token Refreshing with invalid token...');
        const invalidRefreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                refreshToken: 'invalid.refresh.token',
            }),
        });
        assert(invalidRefreshRes.status === 400, `Invalid token refresh should fail with status 400 (got ${invalidRefreshRes.status})`);

        // 10. Clean up test user from DB
        // await userRepository.delete({ email: TEST_EMAIL });
        // console.log('Cleaned up test user from database.');

        console.log('\n⭐ ALL TESTS PASSED SUCCESSFULLY! ⭐');
    } catch (error) {
        console.error('\n❌ Tests failed with error:', error);
        passed = false;
    } finally {
        // Clean up test user in case of assertion failure
        // try {
        //     await userRepository.delete({ email: TEST_EMAIL });
        // } catch (_) {}
        await app.close();
        console.log('NestJS server shut down.');
        process.exit(passed ? 0 : 1);
    }
}

runTests();
