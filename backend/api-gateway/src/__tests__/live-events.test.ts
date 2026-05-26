import request from 'supertest';
import express from 'express';
import { liveEventsRoutes } from '../routes/live-events';

const app = express();
app.use(express.json());
app.use('/api/v1/live-events', liveEventsRoutes);

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const ARTIST_UUID = '660e8400-e29b-41d4-a716-446655440001';

const validEvent = {
  title: 'Live Concert',
  artistId: ARTIST_UUID,
  scheduledAt: '2027-06-15T20:00:00.000Z',
  ticketPrice: 10.0,
  maxAttendees: 500,
};

describe('GET /api/v1/live-events', () => {
  it('returns events list', async () => {
    const res = await request(app).get('/api/v1/live-events');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('events');
  });

  it('accepts valid pagination params', async () => {
    const res = await request(app).get('/api/v1/live-events?page=2&limit=20');
    expect(res.status).toBe(200);
  });

  it('returns 422 for invalid limit', async () => {
    const res = await request(app).get('/api/v1/live-events?limit=200');
    expect(res.status).toBe(422);
  });
});

describe('GET /api/v1/live-events/:id', () => {
  it('returns event by UUID', async () => {
    const res = await request(app).get(`/api/v1/live-events/${VALID_UUID}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: VALID_UUID });
  });

  it('returns 422 for non-UUID id', async () => {
    const res = await request(app).get('/api/v1/live-events/bad-id');
    expect(res.status).toBe(422);
  });
});

describe('POST /api/v1/live-events', () => {
  it('creates event with valid data', async () => {
    const res = await request(app).post('/api/v1/live-events').send(validEvent);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Event created');
  });

  it('returns 422 when title is missing', async () => {
    const { title: _t, ...noTitle } = validEvent;
    const res = await request(app).post('/api/v1/live-events').send(noTitle);
    expect(res.status).toBe(422);
  });

  it('returns 422 for invalid artistId', async () => {
    const res = await request(app).post('/api/v1/live-events').send({ ...validEvent, artistId: 'bad' });
    expect(res.status).toBe(422);
  });

  it('returns 422 for invalid scheduledAt', async () => {
    const res = await request(app).post('/api/v1/live-events').send({ ...validEvent, scheduledAt: 'not-a-date' });
    expect(res.status).toBe(422);
  });

  it('returns 422 for negative ticketPrice', async () => {
    const res = await request(app).post('/api/v1/live-events').send({ ...validEvent, ticketPrice: -1 });
    expect(res.status).toBe(422);
  });

  it('returns 422 for maxAttendees less than 1', async () => {
    const res = await request(app).post('/api/v1/live-events').send({ ...validEvent, maxAttendees: 0 });
    expect(res.status).toBe(422);
  });

  it('accepts ticketPrice of 0 (free event)', async () => {
    const res = await request(app).post('/api/v1/live-events').send({ ...validEvent, ticketPrice: 0 });
    expect(res.status).toBe(201);
  });
});

describe('PUT /api/v1/live-events/:id', () => {
  it('updates event with valid data', async () => {
    const res = await request(app).put(`/api/v1/live-events/${VALID_UUID}`).send({ title: 'Updated Concert' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Event updated');
    expect(res.body.id).toBe(VALID_UUID);
  });

  it('returns 422 for non-UUID id', async () => {
    const res = await request(app).put('/api/v1/live-events/bad-id').send({ title: 'X' });
    expect(res.status).toBe(422);
  });

  it('returns 422 for invalid ticketPrice on update', async () => {
    const res = await request(app).put(`/api/v1/live-events/${VALID_UUID}`).send({ ticketPrice: -5 });
    expect(res.status).toBe(422);
  });
});
