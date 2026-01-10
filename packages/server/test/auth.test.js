"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const request = require("supertest");
const app_module_1 = require("../src/app.module");
describe('AuthController (e2e)', () => {
    let app;
    let agent;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
        agent = request.agent(app.getHttpServer());
    });
    afterAll(async () => {
        await app.close();
    });
    const uniqueId = Date.now();
    const email = `test.user.${uniqueId}@example.com`;
    const password = 'Password123!';
    const orgName = `Test Org ${uniqueId}`;
    let organizationId;
    it('should sign up a new user', async () => {
        const response = await agent
            .post('/api/v6/auth/sign-up/email')
            .send({
            email,
            password,
            name: 'Test User',
        })
            .expect(200);
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.email).toBe(email);
        expect(response.body.user).toHaveProperty('role');
    });
    it('should sign in', async () => {
        await agent
            .post('/api/v6/auth/sign-in/email')
            .send({
            email,
            password
        })
            .expect(200);
    });
    it('should create an organization', async () => {
        const response = await agent
            .post('/api/v6/auth/organization/create')
            .send({
            name: orgName,
            slug: `test-org-${uniqueId}`
        })
            .expect(200);
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe(orgName);
        organizationId = response.body.id;
    });
    it('should create a team (verifying team and teamMember tables)', async () => {
        expect(organizationId).toBeDefined();
        const response = await agent
            .post('/api/v6/auth/organization/create-team')
            .send({
            name: 'Dev Team',
            organizationId: organizationId,
            slug: `dev-team-${uniqueId}`
        })
            .expect(200);
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe('Dev Team');
    });
});
//# sourceMappingURL=auth.test.js.map