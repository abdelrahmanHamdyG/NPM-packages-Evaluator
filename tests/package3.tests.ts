import axios from 'axios';
import { describe, it, expect, vi } from 'vitest';
const BASE_URL = 'http://localhost:3000'; // Replace with your API base URL

describe('/package/:id API tests', () => {
  it('should return package details for a valid package ID', async () => {
    const validId = 'debug_4'; // Replace with a known valid ID in your setup
    const response = await axios.get(`${BASE_URL}/package/${validId}`);
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('metadata');
    expect(response.data.metadata).toHaveProperty('ID', validId);
    expect(response.data).toHaveProperty('data.Content');
    expect(typeof response.data.data.Content).toBe('string');
  });

  it('should return 400 for an invalid package ID', async () => {
    const invalidId = 'invalid_package_id!';
    try {
      await axios.get(`${BASE_URL}/package/${invalidId}`);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data).toHaveProperty('error', 'PackageID is missing or malformed.');
    }
  });

  it('should return 404 if the package is not found', async () => {
    const nonexistentId = 'nonexistent-package-id';
    try {
      await axios.get(`${BASE_URL}/package/${nonexistentId}`);
    } catch (error) {
      expect(error.response.status).toBe(404);
      expect(error.response.data).toHaveProperty('error', 'Package not found.');
    }
  });

  it('should return 500 for server errors', async () => {
    const idCausingError = 'error-causing-package-id'; // Simulate an ID that causes server issues
    try {
      await axios.get(`${BASE_URL}/package/${idCausingError}`);
    } catch (error) {
      expect(error.response.status).toBe(500);
      expect(error.response.data).toHaveProperty('error', 'Internal server error.');
    }
  });
});
