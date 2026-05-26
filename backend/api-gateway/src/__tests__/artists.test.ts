import request from 'supertest';
import express from 'express';
import { artistRoutes } from '../routes/artists';
import * as cacheService from '../services/cacheService';

jest.mock('../services/cacheService');

const app = express();
app.use(express.json());
app.use('/api/v1/artists', artistRoutes);

const mockCacheGet = cacheService.cacheGet as jest.MockedFunction<typeof cacheService.cacheGet>;
const mockCacheSet = cacheService.cacheSet as jest.MockedFunction<typeof cacheService.cacheSet>;
const mockCacheDel = cacheService.cacheDel as jest.MockedFunction<typeof cacheService.cacheDel>;

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

const validArtist = {
  name: 'Test Artist',
  email: 'artist@example.com',
  walletAddress: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQRSTU',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCacheGet.mockResolvedValue(null);
  mockCacheSet.mockResolvedValue(undefined);
  mockCacheDel.mockResolvedValue(undefined);
});

describe('GET /api/v1/artists', () => {
  it('returns artists list', async () => {
    const res = await request(app).get('/api/v1/artists');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('artists');
  });

  it('accepts valid pagination params', async () => {
    const res = await request(app).get('/api/v1/artists?page=1&limit=10');
    expect(res.status).toBe(200);
  });

  it('returns 422 for invalid page param', async () => {
    const res = await request(app).get('/api/v1/artists?page=0');
    expect(res.status).toBe(422);
  });

  it('returns 422 for limit exceeding max', async () => {
    const res = await request(app).get('/api/v1/artists?limit=101');
    expect(res.status).toBe(422);
  });
});

describe('GET /api/v1/artists/:id', () => {
  it('returns artist by UUID with X-Cache MISS', async () => {
    const res = await request(app).get(`/api/v1/artists/${VALID_UUID}`);
    expect(res.status).toBe(200);
    expect(res.headers['x-cache']).toBe('MISS');
    expect(res.body).toMatchObject({ id: VALID_UUID });
  });

  it('returns cached artist with X-Cache HIT', async () => {
    const cached = { id: VALID_UUID, name: 'Cached Artist' };
    mockCacheGet.mockResolvedValue(cached);
    const res = await request(app).get(`/api/v1/artists/${VALID_UUID}`);
    expect(res.status).toBe(200);
    expect(res.headers['x-cache']).toBe('HIT');
    expect(res.body).toEqual(cached);
  });

  it('returns 422 for non-UUID id', async () => {
    const res = await request(app).get('/api/v1/artists/not-a-uuid');
    expect(res.status).toBe(422);
  });
});

describe('GET /api/v1/artists/:id/analytics', () => {
  it('returns analytics data for valid UUID', async () => {
    const res = await request(app).get(`/api/v1/artists/${VALID_UUID}/analytics`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      artistId: VALID_UUID,
      totalStreams: expect.any(Number),
      totalEarnings: expect.any(Number),
      streamHistory: expect.any(Array),
      earningsHistory: expect.any(Array),
      topTracks: expect.any(Array),
      geoDistribution: expect.any(Array),
    });
    expect(res.body.streamHistory).toHaveLength(30);
  });

  it('returns 422 for non-UUID id', async () => {
    const res = await request(app).get('/api/v1/artists/bad-id/analytics');
    expect(res.status).toBe(422);
  });
});

describe('POST /api/v1/artists', () => {
  it('registers artist with valid data', async () => {
    const res = await request(app).post('/api/v1/artists').send(validArtist);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Artist registered');
  });

  it('returns 422 when name is missing', async () => {
    const { name: _n, ...noName } = validArtist;
    const res = await request(app).post('/api/v1/artists').send(noName);
    expect(res.status).toBe(422);
  });

  it('returns 422 for invalid email', async () => {
    const res = await request(app).post('/api/v1/artists').send({ ...validArtist, email: 'not-email' });
    expect(res.status).toBe(422);
  });

  it('returns 422 when walletAddress is missing', async () => {
    const { walletAddress: _w, ...noWallet } = validArtist;
    const res = await request(app).post('/api/v1/artists').send(noWallet);
    expect(res.status).toBe(422);
  });
});

describe('PUT /api/v1/artists/:id', () => {
  it('updates artist and invalidates cache', async () => {
    const res = await request(app).put(`/api/v1/artists/${VALID_UUID}`).send({ name: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Artist updated');
    expect(mockCacheDel).toHaveBeenCalledWith(`artist_profile:${VALID_UUID}`);
  });

  it('returns 422 for non-UUID id', async () => {
    const res = await request(app).put('/api/v1/artists/bad-id').send({ name: 'X' });
    expect(res.status).toBe(422);
  });
});
