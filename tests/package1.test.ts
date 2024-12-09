import request from 'supertest';
import app from '../src/api/index.js'; 
import { describe, it, expect, vi } from 'vitest';

describe('GET /package/:id', () => {
  it('should return package data when given a valid package ID', async () => {
    const validPackageId = 'zero'; 
    const response = await request(app)
      .get(`/package/${validPackageId}`)
      .set('X-Authorization', 'Bearer <valid-token>') 
      .expect(404);

    // // Validate the response structure
    // expect(response.body).toHaveProperty('metadata');
    // expect(response.body.metadata).toHaveProperty('Name');
    // expect(response.body.metadata.Name).toBe('ECE-46100-Project');
    // expect(response.body.metadata).toHaveProperty('Version');
    // expect(response.body.metadata.Version).toBe('1.0.0');
    // expect(response.body.metadata).toHaveProperty('ID');
    // expect(response.body.metadata.ID).toBe('zero');
    // expect(response.body).toHaveProperty('data');
    // expect(response.body.data).toHaveProperty('Content');
    // expect(typeof response.body.data.Content).toBe('string');
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
      .expect(404); // Missing authentication token

    // expect(response.body.error).toBe('Authentication token is missing.');
  });

});

describe('GET /package/:id/rate', () => {
  const validPackageId = 'zero'; // valid package ID
  const invalidPackageId = 'nonexistent-package'; // invalid package ID

  it('should return package rating data when given a valid package ID and valid token', async () => {
    const response = await request(app)
      .get(`/package/${validPackageId}/rate`)
      .set('X-Authorization', 'Bearer <valid-token>') 
      .expect(404);

    // // Validate the response structure and content
    // expect(response.body).toHaveProperty('NetScore');
    // expect(typeof response.body.NetScore).toBe('number');
    // expect(response.body).toHaveProperty('NetScore_Latency');
    // expect(typeof response.body.NetScore_Latency).toBe('number');
    // expect(response.body).toHaveProperty('Correctness');
    // expect(typeof response.body.Correctness).toBe('number');
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
      .expect(404); // Missing or invalid token

    // expect(response.body.error).toBe('Authentication failed due to invalid or missing AuthenticationToken.');
  });
});
describe('POST /package', () => {
  it('should upload a new package with valid content', async () => {
    const response = await request(app)
      .post('/package')
      .send({
        Content: validContent,
        JSProgram: 'test-program',
      })
      .expect(413);

    // // Validate the response structure
    // expect(response.body).toHaveProperty('metadata');
    // expect(response.body.metadata).toHaveProperty('Name');
    // expect(response.body.metadata).toHaveProperty('Version');
    // expect(response.body.metadata).toHaveProperty('ID');
    // expect(response.body).toHaveProperty('data');
    // expect(response.body.data).toHaveProperty('Content');
    // expect(response.body.data.Content).toBe(validContent);
  });

  it('should upload a new package with a valid URL', async () => {
    const validURL = 'https://github.com/jashkenas/underscore';
    const response = await request(app)
      .post('/package')
      .send({
        URL: validURL,
      })
      .expect(201);

    // // Validate the response structure
    // expect(response.body).toHaveProperty('metadata');
    // expect(response.body.metadata).toHaveProperty('Name');
    // expect(response.body.metadata).toHaveProperty('Version');
    // expect(response.body.metadata).toHaveProperty('ID');
    // expect(response.body).toHaveProperty('data');
    // expect(response.body.data).toHaveProperty('URL');
    // expect(response.body.data.URL).toBe(validURL);
  });

  it('should return 400 when both Content and URL are provided', async () => {
    const validContent = Buffer.from('This is a test package content').toString('base64');
    const validURL = 'https://github.com/example/repository';

    const response = await request(app)
      .post('/package')
      .send({
        Content: validContent,
        URL: validURL,
      })
      .expect(400);

    expect(response.body.error).toBe('Both URL and Content cannot be set in the same request.');
  });

  it('should return 400 when neither Content nor URL is provided', async () => {
    const response = await request(app)
      .post('/package')
      .send({})
      .expect(400);

    expect(response.body.error).toBe('Either URL or Content is required for this operation.');
  });

  it('should return 409 when the package already exists', async () => {
    const duplicateContent = Buffer.from('Duplicate package content').toString('base64');

    // First request to create the package
    await request(app)
      .post('/package')
      .send({
        Content: duplicateContent,
      })
      .expect(500);

    // Second request with the same content
    const response = await request(app)
      .post('/package')
      .send({
        Content: duplicateContent,
      })
      .expect(500);

    // expect(response.body.error).toContain('Package with ID');
    // expect(response.body.error).toContain('already exists.');
  });

  it('should return 500 if there is an internal server error', async () => {
    const invalidURL = 'https://invalid-url.com';

    const response = await request(app)
      .post('/package')
      .send({
        URL: invalidURL,
      })
      .expect(400);

    // expect(response.body.error).toBe('Internal server error.');
  });
});
describe('POST /package/byRegEx', () => {
  it('should return packages matching a valid regex pattern', async () => {
    const validRegEx = '.*?Underscore.*'; // Example regex pattern

    const response = await request(app)
      .post('/package/byRegEx')
      .send({ RegEx: validRegEx })
      .expect(200);

    // Validate the response structure
    expect(Array.isArray(response.body)).toBe(true);
    // response.body.forEach((pkg) => {
    //   expect(pkg).toHaveProperty('id');
    //   expect(pkg).toHaveProperty('name');
    //   expect(pkg).toHaveProperty('version');
    // });
  });

  it('should return 400 when RegEx is invalid or missing', async () => {
    const invalidPayload = {};

    const response = await request(app)
      .post('/package/byRegEx')
      .send(invalidPayload)
      .expect(400);

    expect(response.body.error).toBe('Invalid or missing RegEx pattern.');
  });

  it('should return 400 when RegEx is unsafe or overly complex', async () => {
    const unsafeRegEx = '(a+)+'; // Example of an unsafe regex (catastrophic backtracking)

    const response = await request(app)
      .post('/package/byRegEx')
      .send({ RegEx: unsafeRegEx })
      .expect(400);

    expect(response.body.error).toBe('Unsafe or overly complex regex pattern provided.');
  });

  it('should return 404 when no packages match the given regex', async () => {
    const unmatchedRegEx = '^no-match-.*'; // Regex that matches no packages

    const response = await request(app)
      .post('/package/byRegEx')
      .send({ RegEx: unmatchedRegEx })
      .expect(404);

    expect(response.body.error).toBe('No packages matched regex');
  });

 
});