/**
 * CRM + Settings HTTP integration (Milestone 1.8a) — gated enquiry creates a
 * b2b lead, admin pipeline RBAC + stage/assign/note updates, and the
 * settings singleton (super-admin only). The WhatsApp alert is dormant (no keys,
 * no admin number) so it is skipped without throwing — the lead still persists.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ROLES } from '@sajawat/shared';
import { createApp } from '../../src/app.js';
import { accessTokenFor } from '../helpers.js';
import { CrmLead } from '../../src/modules/crm/crm.model.js';
import { Settings } from '../../src/modules/settings/settings.model.js';

const app = createApp();
let mongo: MongoMemoryServer;
let customerAuth: string;
let adminAuth: string;
let superAuth: string;

const ENQUIRY = {
  name: 'Ravi Traders',
  company: 'Ravi Traders Pvt Ltd',
  phone: '9876543210',
  email: 'ravi@traders.test',
  city: 'Surat',
  quantity: 500,
  productInterest: 'Bridal sets, festive necklaces',
  message: 'Looking for bulk pricing.',
};

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Promise.all([CrmLead.syncIndexes(), Settings.syncIndexes()]);
  customerAuth = `Bearer ${await accessTokenFor(ROLES.CUSTOMER, new mongoose.Types.ObjectId().toString())}`;
  adminAuth = `Bearer ${await accessTokenFor(ROLES.ADMIN, new mongoose.Types.ObjectId().toString())}`;
  superAuth = `Bearer ${await accessTokenFor(ROLES.SUPER_ADMIN, new mongoose.Types.ObjectId().toString())}`;
}, 60_000);

afterEach(async () => {
  await Promise.all([CrmLead.deleteMany({}), Settings.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

async function submitEnquiry(): Promise<string> {
  const res = await request(app)
    .post('/api/v1/enquiries')
    .set('Authorization', customerAuth)
    .send(ENQUIRY);
  expect(res.status).toBe(201);
  return res.body.data.id as string;
}

describe('enquiry → lead', () => {
  it('a gated customer can submit an enquiry; it persists as a new b2b lead', async () => {
    const res = await request(app)
      .post('/api/v1/enquiries')
      .set('Authorization', customerAuth)
      .send(ENQUIRY);
    expect(res.status).toBe(201);
    expect(res.body.data.stage).toBe('new');

    const lead = await CrmLead.findById(res.body.data.id);
    expect(lead?.type).toBe('b2b');
    expect(lead?.source).toBe('web');
    expect(lead?.company).toBe(ENQUIRY.company);
  });

  it('requires authentication', async () => {
    const res = await request(app).post('/api/v1/enquiries').send(ENQUIRY);
    expect(res.status).toBe(401);
  });

  it('validates the enquiry body (missing company → 400)', async () => {
    const { company, ...partial } = ENQUIRY;
    void company;
    const res = await request(app)
      .post('/api/v1/enquiries')
      .set('Authorization', customerAuth)
      .send(partial);
    expect(res.status).toBe(400);
  });
});

describe('admin CRM pipeline', () => {
  it('403 for a customer (no crm:read)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/crm/leads')
      .set('Authorization', customerAuth);
    expect(res.status).toBe(403);
  });

  it('admin lists, filters, reads, and updates leads', async () => {
    const id = await submitEnquiry();

    const list = await request(app).get('/api/v1/admin/crm/leads').set('Authorization', adminAuth);
    expect(list.status).toBe(200);
    expect(list.body.data.total).toBe(1);

    const detail = await request(app)
      .get(`/api/v1/admin/crm/leads/${id}`)
      .set('Authorization', adminAuth);
    expect(detail.body.data.company).toBe(ENQUIRY.company);

    const updated = await request(app)
      .patch(`/api/v1/admin/crm/leads/${id}`)
      .set('Authorization', adminAuth)
      .send({ stage: 'contacted', note: 'Called, sent catalogue.' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.stage).toBe('contacted');
    expect(updated.body.data.notes).toHaveLength(1);
    expect(updated.body.data.notes[0].body).toBe('Called, sent catalogue.');

    const filtered = await request(app)
      .get('/api/v1/admin/crm/leads?stage=new')
      .set('Authorization', adminAuth);
    expect(filtered.body.data.total).toBe(0);
  });

  it('rejects an empty update', async () => {
    const id = await submitEnquiry();
    const res = await request(app)
      .patch(`/api/v1/admin/crm/leads/${id}`)
      .set('Authorization', adminAuth)
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('settings singleton', () => {
  it('403 for an admin without settings:manage', async () => {
    const res = await request(app).get('/api/v1/admin/settings').set('Authorization', adminAuth);
    expect(res.status).toBe(403);
  });

  it('super admin reads and updates the admin WhatsApp number', async () => {
    const get = await request(app).get('/api/v1/admin/settings').set('Authorization', superAuth);
    expect(get.status).toBe(200);

    const patched = await request(app)
      .patch('/api/v1/admin/settings')
      .set('Authorization', superAuth)
      .send({ adminWhatsappNumber: '+919876543210', businessName: 'Sajawat' });
    expect(patched.status).toBe(200);
    expect(patched.body.data.adminWhatsappNumber).toBe('+919876543210');
    expect(patched.body.data.businessName).toBe('Sajawat');
  });

  it('an enquiry still succeeds when WhatsApp is configured-but-dormant (number set, no API keys)', async () => {
    await request(app)
      .patch('/api/v1/admin/settings')
      .set('Authorization', superAuth)
      .send({ adminWhatsappNumber: '+919876543210' });
    // Provider has no keys → alert is skipped, lead still created.
    const res = await request(app)
      .post('/api/v1/enquiries')
      .set('Authorization', customerAuth)
      .send(ENQUIRY);
    expect(res.status).toBe(201);
  });
});
