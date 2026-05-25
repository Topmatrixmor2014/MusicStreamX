import { logger } from '../utils/logger';
import { errorHandler } from '../middleware/errorHandler';

describe('Logger utility', () => {
  it('should have info, error, warn methods', () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
  });
});

describe('Error handler middleware', () => {
  it('should be a function', () => {
    expect(typeof errorHandler).toBe('function');
  });

  it('should call res.status with statusCode from error', () => {
    const err: any = new Error('Test error');
    err.statusCode = 400;
    const req: any = { originalUrl: '/test', method: 'GET' };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Test error' }));
  });

  it('should default to 500 when no statusCode on error', () => {
    const err: any = new Error('Internal error');
    const req: any = { originalUrl: '/test', method: 'GET' };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
