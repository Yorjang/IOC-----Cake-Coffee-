import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from './src/modules/users/entities/user.entity';
import { MailService } from './src/modules/mail/mail.service';

const TEST_EMAIL = 'forgotpwdtest@example.com';
const TEST_PASSWORD = 'password123';
const TEST_NEW_PASSWORD = 'newpassword456';
const TEST_FULL_NAME = 'Forgot Password Test User';
const BASE_URL = 'http://localhost:3002'; // Use a distinct port to avoid conflicts

async function runTests() {
    console.log('--- Starting Integration Tests for Forgot Password API ---');
    
    // Boot NestJS application on port 3002
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    await app.listen(3002);
    console.log('NestJS server listening on port 3002');

    // Intercept emails to capture the reset token
    let interceptedToken = '';
    const mailService = app.get(MailService);
    
    mailService.sendVerificationEmail = async (to: string, token: string) => {
        console.log(`[Mock MailService] sendVerificationEmail to ${to}`);
        return Promise.resolve();
    };

    mailService.sendResetPasswordEmail = async (to: string, token: string) => {
        console.log(`[Mock MailService] Intercepted sendResetPasswordEmail to ${to}`);
        interceptedToken = token;
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
        console.log('Registering test user...');
        const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: TEST_FULL_NAME,
                email: TEST_EMAIL,
                password: TEST_PASSWORD,
            }),
        });
        assert(registerResponse.status === 201, 'Registration should succeed');

        // 3. Manually verify/activate the user in DB
        console.log('Activating test user in database...');
        const testUser = await userRepository.findOne({ where: { email: TEST_EMAIL } });
        assert(testUser !== null, 'Test user should exist in the database');
        if (testUser) {
            testUser.isActive = true;
            testUser.emailVerifiedAt = new Date();
            await userRepository.save(testUser);
        }

        // 4. Request Forgot Password
        console.log('Requesting forgot password link...');
        const forgotResponse = await fetch(`${BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_EMAIL }),
        });
        const forgotData = await forgotResponse.json();
        assert(forgotResponse.status === 201, 'Forgot password request should return 201');
        assert(forgotData.message !== undefined, 'Forgot password returns a message');
        assert(interceptedToken !== '', 'A reset token should have been intercepted');
        console.log(`Intercepted Reset Token: ${interceptedToken}`);

        // 5. Attempt Reset Password with the intercepted token
        console.log('Resetting password with correct token...');
        const resetResponse = await fetch(`${BASE_URL}/auth/reset-password?token=${interceptedToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: TEST_NEW_PASSWORD }),
        });
        const resetData = await resetResponse.json();
        assert(resetResponse.status === 201, `Reset password should return 201 (got ${resetResponse.status})`);
        assert(resetData.message !== undefined, 'Reset password returns success message');

        // 6. Verify Login with old password fails
        console.log('Verifying login with OLD password fails...');
        const oldLoginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_EMAIL,
                password: TEST_PASSWORD,
            }),
        });
        assert(oldLoginRes.status === 400, 'Login with old password should fail');

        // 7. Verify Login with new password succeeds
        console.log('Verifying login with NEW password succeeds...');
        const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_EMAIL,
                password: TEST_NEW_PASSWORD,
            }),
        });
        const newLoginData = await newLoginRes.json();
        assert(newLoginRes.status === 201, 'Login with new password should succeed');
        assert(typeof newLoginData.accessToken === 'string', 'Login returns access token');

        // 8. Verify the token is SINGLE-USE (cannot reset again using the same token)
        console.log('Verifying token cannot be reused...');
        const reuseResetResponse = await fetch(`${BASE_URL}/auth/reset-password?token=${interceptedToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: 'yetanotherpassword' }),
        });
        const reuseResetData = await reuseResetResponse.json();
        assert(reuseResetResponse.status === 400, `Reusing token should return 400 Bad Request (got ${reuseResetResponse.status})`);
        assert(reuseResetData.message.includes('expired') || reuseResetData.message.includes('used') || reuseResetData.message.includes('Invalid'), 'Reusing token error message is correct');

        console.log('\n⭐ ALL FORGOT-PASSWORD INTEGRATION TESTS PASSED SUCCESSFULLY! ⭐');
    } catch (error) {
        console.error('\n❌ Tests failed with error:', error);
        passed = false;
    } finally {
        // Clean up test user
        try {
            await userRepository.delete({ email: TEST_EMAIL });
            console.log('Cleaned up test user.');
        } catch (_) {}
        await app.close();
        console.log('NestJS server shut down.');
        process.exit(passed ? 0 : 1);
    }
}

runTests();
