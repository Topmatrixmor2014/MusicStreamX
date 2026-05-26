import request from 'supertest';
import express from 'express';
import { governanceRoutes } from '../routes/governance';

const app = express();
app.use(express.json());
app.use('/api/v1/governance', governanceRoutes);

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VOTER_UUID = '660e8400-e29b-41d4-a716-446655440001';

const validProposal = {
  title: 'Increase royalty rate',
  description: 'Proposal to increase the base royalty rate from 70% to 80%.',
  proposerId: VALID_UUID,
  votingEndsAt: '2027-01-01T00:00:00.000Z',
};

describe('GET /api/v1/governance/proposals', () => {
  it('returns proposals list', async () => {
    const res = await request(app).get('/api/v1/governance/proposals');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('proposals');
  });

  it('accepts valid query params', async () => {
    const res = await request(app).get('/api/v1/governance/proposals?page=1&limit=10&status=active');
    expect(res.status).toBe(200);
  });

  it('returns 422 for invalid status', async () => {
    const res = await request(app).get('/api/v1/governance/proposals?status=invalid');
    expect(res.status).toBe(422);
  });

  it('returns 422 for page=0', async () => {
    const res = await request(app).get('/api/v1/governance/proposals?page=0');
    expect(res.status).toBe(422);
  });
});

describe('GET /api/v1/governance/proposals/:id', () => {
  it('returns proposal by UUID', async () => {
    const res = await request(app).get(`/api/v1/governance/proposals/${VALID_UUID}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: VALID_UUID });
  });

  it('returns 422 for non-UUID id', async () => {
    const res = await request(app).get('/api/v1/governance/proposals/bad-id');
    expect(res.status).toBe(422);
  });
});

describe('POST /api/v1/governance/proposals', () => {
  it('creates proposal with valid data', async () => {
    const res = await request(app).post('/api/v1/governance/proposals').send(validProposal);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Proposal created');
  });

  it('returns 422 when title is missing', async () => {
    const { title: _t, ...noTitle } = validProposal;
    const res = await request(app).post('/api/v1/governance/proposals').send(noTitle);
    expect(res.status).toBe(422);
  });

  it('returns 422 for invalid proposerId', async () => {
    const res = await request(app).post('/api/v1/governance/proposals').send({ ...validProposal, proposerId: 'bad' });
    expect(res.status).toBe(422);
  });

  it('returns 422 for invalid votingEndsAt', async () => {
    const res = await request(app).post('/api/v1/governance/proposals').send({ ...validProposal, votingEndsAt: 'not-a-date' });
    expect(res.status).toBe(422);
  });
});

describe('POST /api/v1/governance/proposals/:id/vote', () => {
  it('casts a yes vote', async () => {
    const res = await request(app)
      .post(`/api/v1/governance/proposals/${VALID_UUID}/vote`)
      .send({ voterId: VOTER_UUID, vote: 'yes' });
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Vote cast');
    expect(res.body.proposalId).toBe(VALID_UUID);
  });

  it('casts a no vote', async () => {
    const res = await request(app)
      .post(`/api/v1/governance/proposals/${VALID_UUID}/vote`)
      .send({ voterId: VOTER_UUID, vote: 'no' });
    expect(res.status).toBe(201);
  });

  it('casts an abstain vote', async () => {
    const res = await request(app)
      .post(`/api/v1/governance/proposals/${VALID_UUID}/vote`)
      .send({ voterId: VOTER_UUID, vote: 'abstain' });
    expect(res.status).toBe(201);
  });

  it('returns 422 for invalid vote value', async () => {
    const res = await request(app)
      .post(`/api/v1/governance/proposals/${VALID_UUID}/vote`)
      .send({ voterId: VOTER_UUID, vote: 'maybe' });
    expect(res.status).toBe(422);
  });

  it('returns 422 for non-UUID proposal id', async () => {
    const res = await request(app)
      .post('/api/v1/governance/proposals/bad-id/vote')
      .send({ voterId: VOTER_UUID, vote: 'yes' });
    expect(res.status).toBe(422);
  });
});
