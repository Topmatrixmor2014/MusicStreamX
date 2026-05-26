import request from 'supertest';
import express from 'express';
import { fanRoutes } from '../routes/fans';

const app = express();
app.use(express.json());
app.use('/api/v1/fans', fanRoutes);

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const ARTIST_UUID = '660e8400-e29b-41d4-a716-446655440001';

const validFan = {
  username: 'testfan',
  email: 'fan@example.com',
  walletAddress: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQRSTU',
};

describe('GET /api/v1/fans/:id', () => {
  it('returns fan by UUID', async () => {
    const res = await request(app).get(`/api/v1/fans/${VALID_UUID}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: VALID_UUID });
  });

  it('returns 422 for non-UUID id', async () => {
    const res = await request(app).get('/api/v1/fans/not-a-uuid');
    expect(res.status).toBe(422);
  });
});

describe('POST /api/v1/fans', () => {
  it('registers fan with valid data', async () => {
    const res = await request(app).post('/api/v1/fans').send(validFan);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Fan registered');
  });

  it('returns 422 when username is too short', async () => {
    const res = await request(app).post('/api/v1/fans').send({ ...validFan, username: 'ab' });
    expect(res.status).toBe(422);
  });

  it('returns 422 when username is too long', async () => {
    const res = await request(app).post('/api/v1/fans').send({ ...validFan, username: 'a'.repeat(51) });
    expect(res.status).toBe(422);
  });

  it('returns 422 for invalid email', async () => {
    const res = await request(app).post('/api/v1/fans').send({ ...validFan, email: 'bad-email' });
    expect(res.status).toBe(422);
  });

  it('returns 422 when walletAddress is missing', async () => {
    const { walletAddress: _w, ...noWallet } = validFan;
    const res = await request(app).post('/api/v1/fans').send(noWallet);
    expect(res.status).toBe(422);
  });
});

describe('POST /api/v1/fans/:id/follow', () => {
  it('follows an artist with valid data', async () => {
    const res = await request(app)
      .post(`/api/v1/fans/${VALID_UUID}/follow`)
      .send({ artistId: ARTIST_UUID });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Artist followed');
  });

  it('returns 422 for non-UUID fan id', async () => {
    const res = await request(app)
      .post('/api/v1/fans/bad-id/follow')
      .send({ artistId: ARTIST_UUID });
    expect(res.status).toBe(422);
  });

  it('returns 422 for non-UUID artistId', async () => {
    const res = await request(app)
      .post(`/api/v1/fans/${VALID_UUID}/follow`)
      .send({ artistId: 'not-a-uuid' });
    expect(res.status).toBe(422);
  });

  it('returns 422 when artistId is missing', async () => {
    const res = await request(app).post(`/api/v1/fans/${VALID_UUID}/follow`).send({});
    expect(res.status).toBe(422);
  });
});
