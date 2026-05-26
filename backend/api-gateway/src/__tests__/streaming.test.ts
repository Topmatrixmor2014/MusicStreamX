import request from 'supertest';
import express from 'express';
import { streamingRoutes } from '../routes/streaming';

const app = express();
app.use(express.json());
app.use('/api/v1/streaming', streamingRoutes);

const TRACK_UUID = '550e8400-e29b-41d4-a716-446655440000';
const FAN_UUID = '660e8400-e29b-41d4-a716-446655440001';

describe('GET /api/v1/streaming/:trackId', () => {
  it('returns stream URL for valid UUID', async () => {
    const res = await request(app).get(`/api/v1/streaming/${TRACK_UUID}`);
    expect(res.status).toBe(200);
    expect(res.body.streamUrl).toContain(TRACK_UUID);
  });

  it('returns 422 for non-UUID trackId', async () => {
    const res = await request(app).get('/api/v1/streaming/not-a-uuid');
    expect(res.status).toBe(422);
  });
});

describe('POST /api/v1/streaming/play', () => {
  it('records a play event with valid data', async () => {
    const res = await request(app).post('/api/v1/streaming/play').send({
      trackId: TRACK_UUID,
      fanId: FAN_UUID,
      durationPlayed: 120,
    });
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Play recorded');
    expect(res.body.data).toMatchObject({ trackId: TRACK_UUID, fanId: FAN_UUID, durationPlayed: 120 });
  });

  it('returns 422 for non-UUID trackId', async () => {
    const res = await request(app).post('/api/v1/streaming/play').send({
      trackId: 'bad',
      fanId: FAN_UUID,
      durationPlayed: 60,
    });
    expect(res.status).toBe(422);
  });

  it('returns 422 for non-UUID fanId', async () => {
    const res = await request(app).post('/api/v1/streaming/play').send({
      trackId: TRACK_UUID,
      fanId: 'bad',
      durationPlayed: 60,
    });
    expect(res.status).toBe(422);
  });

  it('returns 422 for negative durationPlayed', async () => {
    const res = await request(app).post('/api/v1/streaming/play').send({
      trackId: TRACK_UUID,
      fanId: FAN_UUID,
      durationPlayed: -1,
    });
    expect(res.status).toBe(422);
  });

  it('accepts durationPlayed of 0', async () => {
    const res = await request(app).post('/api/v1/streaming/play').send({
      trackId: TRACK_UUID,
      fanId: FAN_UUID,
      durationPlayed: 0,
    });
    expect(res.status).toBe(201);
  });
});
