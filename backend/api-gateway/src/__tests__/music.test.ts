import request from 'supertest';
import express from 'express';
import { musicRoutes } from '../routes/music';
import * as cacheService from '../services/cacheService';

jest.mock('../services/cacheService');

const app = express();
app.use(express.json());
app.use('/api/v1/music', musicRoutes);

const mockCacheGet = cacheService.cacheGet as jest.MockedFunction<typeof cacheService.cacheGet>;
const mockCacheSet = cacheService.cacheSet as jest.MockedFunction<typeof cacheService.cacheSet>;
const mockCacheDel = cacheService.cacheDel as jest.MockedFunction<typeof cacheService.cacheDel>;

const VALID_IPFS = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';

const validTrack = {
  title: 'Test Track',
  artist: 'Test Artist',
  genre: 'pop',
  duration: 180,
  ipfs_hash: VALID_IPFS,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCacheGet.mockResolvedValue(null);
  mockCacheSet.mockResolvedValue(undefined);
  mockCacheDel.mockResolvedValue(undefined);
});

describe('GET /api/v1/music', () => {
  it('returns tracks and sets X-Cache MISS on cache miss', async () => {
    const res = await request(app).get('/api/v1/music');
    expect(res.status).toBe(200);
    expect(res.headers['x-cache']).toBe('MISS');
    expect(res.body).toMatchObject({ success: true, data: [] });
    expect(mockCacheSet).toHaveBeenCalledWith('top_tracks', expect.any(Object), expect.any(Number));
  });

  it('returns cached data and sets X-Cache HIT on cache hit', async () => {
    const cached = { success: true, data: [{ id: '1' }] };
    mockCacheGet.mockResolvedValue(cached);
    const res = await request(app).get('/api/v1/music');
    expect(res.status).toBe(200);
    expect(res.headers['x-cache']).toBe('HIT');
    expect(res.body).toEqual(cached);
    expect(mockCacheSet).not.toHaveBeenCalled();
  });
});

describe('GET /api/v1/music/:id', () => {
  it('returns track by id with X-Cache MISS', async () => {
    const res = await request(app).get('/api/v1/music/abc123');
    expect(res.status).toBe(200);
    expect(res.headers['x-cache']).toBe('MISS');
    expect(res.body).toMatchObject({ success: true, data: { id: 'abc123' } });
  });

  it('returns cached track with X-Cache HIT', async () => {
    const cached = { success: true, data: { id: 'abc123', title: 'Cached' } };
    mockCacheGet.mockResolvedValue(cached);
    const res = await request(app).get('/api/v1/music/abc123');
    expect(res.status).toBe(200);
    expect(res.headers['x-cache']).toBe('HIT');
    expect(res.body).toEqual(cached);
  });
});

describe('POST /api/v1/music', () => {
  it('creates a track with valid metadata', async () => {
    const res = await request(app).post('/api/v1/music').send(validTrack);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ title: 'Test Track', artist: 'Test Artist' });
    expect(mockCacheDel).toHaveBeenCalledWith('top_tracks');
  });

  it('returns 400 when title is missing', async () => {
    const { title: _t, ...noTitle } = validTrack;
    const res = await request(app).post('/api/v1/music').send(noTitle);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('returns 400 for invalid genre', async () => {
    const res = await request(app).post('/api/v1/music').send({ ...validTrack, genre: 'invalid' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid ipfs_hash', async () => {
    const res = await request(app).post('/api/v1/music').send({ ...validTrack, ipfs_hash: 'not-a-hash' });
    expect(res.status).toBe(400);
  });

  it('strips unknown fields from body', async () => {
    const res = await request(app).post('/api/v1/music').send({ ...validTrack, unknownField: 'x' });
    expect(res.status).toBe(201);
    expect(res.body.data.unknownField).toBeUndefined();
  });
});
