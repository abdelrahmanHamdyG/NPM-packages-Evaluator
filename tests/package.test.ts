import request from 'supertest';
import app from '../src/api/index.js'; 
import { describe, it, expect, vi } from 'vitest';

describe('GET /package/:id', () => {
  it('should return package data when given a valid package ID', async () => {
    const validPackageId = 'zero'; 
    const response = await request(app)
      .get(`/package/${validPackageId}`)
      .set('X-Authorization', 'Bearer <valid-token>') 
      .expect(200);

    // Validate the response structure
    expect(response.body).toHaveProperty('metadata');
    expect(response.body.metadata).toHaveProperty('Name');
    expect(response.body.metadata.Name).toBe('ECE-46100-Project');
    expect(response.body.metadata).toHaveProperty('Version');
    expect(response.body.metadata.Version).toBe('1.0.0');
    expect(response.body.metadata).toHaveProperty('ID');
    expect(response.body.metadata.ID).toBe('zero');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('Content');
    expect(typeof response.body.data.Content).toBe('string');
  });

  it('should return 400 if PackageID is missing or malformed', async () => {
    const response = await request(app)
      .get('/package/~') // Invalid ID in the URL
      .set('X-Authorization', 'Bearer <valid-token>')
      .expect(400);

    expect(response.body.error).toBe('PackageID is missing or malformed.');
  });

  it('should return 404 if the package does not exist', async () => {
    const invalidPackageId = 'nonexistent-package'; // Non-existing package ID
    const response = await request(app)
      .get(`/package/${invalidPackageId}`)
      .set('X-Authorization', 'Bearer <valid-token>')
      .expect(404);

    expect(response.body.error).toBe('Package not found.');
  });

  it('should return 403 if the AuthenticationToken is missing or invalid', async () => {
    const validPackageId = 'underscore';
    const response = await request(app)
      .get(`/package/${validPackageId}`)
      .expect(403); // Missing authentication token

    expect(response.body.error).toBe('Authentication token is missing.');
  });

});

describe('GET /package/:id/rate', () => {
  const validPackageId = 'zero'; // valid package ID
  const invalidPackageId = 'nonexistent-package'; // invalid package ID

  it('should return package rating data when given a valid package ID and valid token', async () => {
    const response = await request(app)
      .get(`/package/${validPackageId}/rate`)
      .set('X-Authorization', 'Bearer <valid-token>') 
      .expect(200);

    // Validate the response structure and content
    expect(response.body).toHaveProperty('NetScore');
    expect(typeof response.body.NetScore).toBe('number');
    expect(response.body).toHaveProperty('NetScore_Latency');
    expect(typeof response.body.NetScore_Latency).toBe('number');
    expect(response.body).toHaveProperty('Correctness');
    expect(typeof response.body.Correctness).toBe('number');
    // Add further checks based on the expected structure of your rating response
  }, 20000);

  it('should return 400 if PackageID is missing or malformed', async () => {
    const response = await request(app)
      .get(`/package/~`)// Invalid ID in the URL
      .set('X-Authorization', 'Bearer <valid-token>')
      .expect(400);

    expect(response.body.error).toBe('PackageID is missing or malformed.');
  });

  it('should return 404 if the package does not exist', async () => {
    const response = await request(app)
      .get(`/package/${invalidPackageId}/rate`)
      .set('X-Authorization', 'Bearer <valid-token>')
      .expect(404);

    expect(response.body.error).toBe('Package does not exist.');
  });

  it('should return 403 if the AuthenticationToken is missing or invalid', async () => {
    const response = await request(app)
      .get(`/package/${validPackageId}/rate`)
      .expect(403); // Missing or invalid token

    expect(response.body.error).toBe('Authentication failed due to invalid or missing AuthenticationToken.');
  });
});
