"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./src/modules/users/entities/user.entity");
const mail_service_1 = require("./src/modules/mail/mail.service");
const TEST_EMAIL = 'registertest@example.com';
const TEST_PHONE = '+84999999999';
const TEST_PASSWORD = 'password123';
const TEST_FULL_NAME = 'Test Register User';
const BASE_URL = 'http://localhost:3002';
async function runTests() {
    console.log('--- Starting Integration Tests for User Registration API ---');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    await app.listen(3002);
    console.log('NestJS server listening on port 3002');
    let capturedToken = '';
    const mailService = app.get(mail_service_1.MailService);
    mailService.sendVerificationEmail = async (to, token) => {
        console.log(`[Mock MailService] Intercepted sendVerificationEmail to ${to}`);
        capturedToken = token;
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
        await userRepository.delete({ email: TEST_EMAIL });
        await userRepository.delete({ phone: TEST_PHONE });
        console.log('Cleaned up existing test users if any.');
        console.log('\nStep 1: Testing User Registration with Email...');
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
        assert(registerData.requiresVerification === true, 'Registration with email should require verification');
        assert(registerData.email === TEST_EMAIL, 'Registration email matches input');
        assert(capturedToken.length > 0, 'Verification token was successfully sent/captured');
        console.log('\nStep 2: Testing Duplicate Email Registration...');
        const duplicateRegisterResponse = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: TEST_FULL_NAME,
                email: TEST_EMAIL,
                password: TEST_PASSWORD,
            }),
        });
        const duplicateRegisterData = await duplicateRegisterResponse.json();
        assert(duplicateRegisterResponse.status === 400, `Duplicate email registration should fail with status 400 (got ${duplicateRegisterResponse.status})`);
        assert(duplicateRegisterData.message === 'Email already exists', `Error message should be "Email already exists" (got "${duplicateRegisterData.message}")`);
        console.log('\nStep 3: Testing Email Verification with Invalid Token...');
        const invalidVerifyRes = await fetch(`${BASE_URL}/auth/verify-email?token=invalid_token_string`);
        const invalidVerifyData = await invalidVerifyRes.json();
        assert(invalidVerifyRes.status === 400, `Verification with invalid token should fail with status 400 (got ${invalidVerifyRes.status})`);
        assert(invalidVerifyData.message === 'Invalid verification token.', `Error message should indicate invalid token (got "${invalidVerifyData.message}")`);
        console.log('\nStep 4: Testing Email Verification with Valid Captured Token...');
        const verifyRes = await fetch(`${BASE_URL}/auth/verify-email?token=${capturedToken}`);
        const verifyData = await verifyRes.json();
        assert(verifyRes.status === 200, `Verification with valid token should succeed with status 200 (got ${verifyRes.status})`);
        assert(typeof verifyData.accessToken === 'string', 'Verification should return an access token');
        assert(verifyData.user && verifyData.user.email === TEST_EMAIL, 'Verification returns correct user info');
        assert(verifyData.user.isActive === true, 'Verified user is active');
        console.log('\nStep 5: Testing Email Verification when already verified...');
        const reVerifyRes = await fetch(`${BASE_URL}/auth/verify-email?token=${capturedToken}`);
        const reVerifyData = await reVerifyRes.json();
        assert(reVerifyRes.status === 200, `Re-verification should succeed with status 200 (got ${reVerifyRes.status})`);
        assert(reVerifyData.message === 'Email already verified.', `Message should say "Email already verified." (got "${reVerifyData.message}")`);
        assert(typeof reVerifyData.accessToken === 'string', 'Re-verification should still return an access token');
        console.log('\nStep 6: Testing User Registration with Phone-Only...');
        const phoneRegisterResponse = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: TEST_FULL_NAME,
                phone: TEST_PHONE,
                password: TEST_PASSWORD,
            }),
        });
        const phoneRegisterData = await phoneRegisterResponse.json();
        assert(phoneRegisterResponse.status === 201, `Phone registration should succeed with status 201 (got ${phoneRegisterResponse.status})`);
        assert(phoneRegisterData.accessToken && typeof phoneRegisterData.accessToken === 'string', 'Phone-only registration should return access token immediately');
        assert(phoneRegisterData.user && phoneRegisterData.user.phone === TEST_PHONE, 'Phone-only registration returns user object with correct phone');
        assert(phoneRegisterData.user.isActive === true, 'Phone-registered user is active immediately');
        console.log('\nStep 7: Testing Duplicate Phone Number Registration...');
        const duplicatePhoneRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: TEST_FULL_NAME,
                phone: TEST_PHONE,
                password: TEST_PASSWORD,
            }),
        });
        const duplicatePhoneData = await duplicatePhoneRes.json();
        assert(duplicatePhoneRes.status === 400, `Duplicate phone registration should fail with status 400 (got ${duplicatePhoneRes.status})`);
        assert(duplicatePhoneData.message === 'Phone number already exists', `Error message should be "Phone number already exists" (got "${duplicatePhoneData.message}")`);
        await userRepository.delete({ email: TEST_EMAIL });
        await userRepository.delete({ phone: TEST_PHONE });
        console.log('\nCleaned up test users from database.');
        console.log('\n⭐ ALL REGISTRATION TESTS PASSED SUCCESSFULLY! ⭐');
    }
    catch (error) {
        console.error('\n❌ Tests failed with error:', error);
        passed = false;
    }
    finally {
        try {
            await userRepository.delete({ email: TEST_EMAIL });
            await userRepository.delete({ phone: TEST_PHONE });
        }
        catch (_) { }
        await app.close();
        console.log('NestJS server shut down.');
        process.exit(passed ? 0 : 1);
    }
}
runTests();
//# sourceMappingURL=test-registration.js.map