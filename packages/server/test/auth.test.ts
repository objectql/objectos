import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let agent: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
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
  let organizationId: string;

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
      // In case sign up doesn't auto sign in (better-auth usually does), but testing sign-in is good.
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

  it('should get current session', async () => {
      const response = await agent
        .get('/api/v6/auth/get-session')
        .expect(200);

      expect(response.body).toHaveProperty('session');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(email);
  });

  it('should list organizations', async () => {
      const response = await agent
        .get('/api/v6/auth/organization/list')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      const org = response.body.find((o: any) => o.id === organizationId);
      expect(org).toBeDefined();
      expect(org.name).toBe(orgName);
  });

  it('should set active organization', async () => {
      const response = await agent
        .post('/api/v6/auth/organization/set-active')
        .send({
            organizationId
        })
        .expect(200);
      
      // Verify session has active org
      const sessionResponse = await agent.get('/api/v6/auth/get-session');
      expect(sessionResponse.body.session.activeOrganizationId).toBe(organizationId);
  });

  it('should update organization', async () => {
      const newName = `${orgName} Updated`;
      const response = await agent
        .post('/api/v6/auth/organization/update')
        .send({
            organizationId,
            data: {
                name: newName
            }
        })
        .expect(200);
      
      expect(response.body.name).toBe(newName);
  });

  it('should create invitation', async () => {
      const inviteEmail = `invitee.${uniqueId}@example.com`;
      const response = await agent
        .post('/api/v6/auth/organization/invite-member')
        .send({
            organizationId,
            email: inviteEmail,
            role: 'member'
        })
        .expect(200);
        
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(inviteEmail);
      expect(response.body.status).toBe('pending');
  });

  it('should sign out', async () => {
      await agent
        .post('/api/v6/auth/sign-out')
        .send({}) // Must send empty body to set Content-Type: application/json
        .expect(200);
      
      const response = await agent
        .get('/api/v6/auth/get-session')
        .expect(200);
      
      expect(response.body).toBe(null);
  });
});
