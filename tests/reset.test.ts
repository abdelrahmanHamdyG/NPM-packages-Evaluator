import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/api/index.js';

describe('DELETE /reset', () => {
  beforeEach(() => {
    // Mocking the application behavior for service interactions
    app.locals.services = {
      clearRegistryInDynamoDB: vi.fn(),
      clearRegistryInS3: vi.fn(),
    };
  });

  it('should reset the registry successfully and return 200', async () => {
    app.locals.services.clearRegistryInDynamoDB.mockResolvedValueOnce(true);
    app.locals.services.clearRegistryInS3.mockResolvedValueOnce(true);

    const response = await request(app)
      .delete('/reset')
      .expect(200);

    expect(response.status).toBe(200);
    expect(response.text).toBe('');
  });

  afterEach(() => {
    // Reset mocks after each test case
    vi.resetAllMocks();
  });
});