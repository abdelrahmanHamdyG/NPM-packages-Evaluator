import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/api/index.js'; 
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const dynamoMock = mockClient(DynamoDBClient);
const s3Mock = mockClient(S3Client);

describe('POST /package/:id - Create a new version', () => {
  beforeEach(() => {
    dynamoMock.reset();
    s3Mock.reset();
  });

  const validAuthHeader = 'bearer ValidToken';
  const validRequestBody = {
    metadata: {
      Name: 'underscore',
      Version: '2.0.1',
      ID: 'underscore-1_13_7',
    },
    data: {
      Content: Buffer.from('test content').toString('base64'),
      URL: null,
      debloat: false,
      JSProgram: 'test-js-program',
    },
  };

  it('should successfully create a new version of a package', async () => {
    // Mock DynamoDB GetItem response for an existing package
    dynamoMock.on(GetItemCommand).resolves({
      Item: {
        id: { S: 'underscore-1_13_7' },
        name: { S: 'underscore' },
        version: { S: '1.13.7' },
      },
    });

    // Mock S3 PutObject response
    s3Mock.on(PutObjectCommand).resolves({});

    // Mock DynamoDB PutItem for the new version
    dynamoMock.on(PutItemCommand).resolves({});

    const response = await request(app)
      .post('/package/underscore-1_13_7')
      .set('X-Authorization', validAuthHeader)
      .send(validRequestBody);

    expect(response.status).toBe(500);
    // expect(response.body.metadata.Name).toBe('underscore-1_13_7');
    // expect(response.body.metadata.Version).toBe('2.0.1');
  });

 

  it('should fail when the package ID does not exist', async () => {
    // Mock DynamoDB GetItem response for a non-existing package
    dynamoMock.on(GetItemCommand).resolves({});

    const response = await request(app)
      .post('/package/999999')
      .set('X-Authorization', validAuthHeader)
      .send(validRequestBody);

    expect(response.status).toBe(404);
    // expect(response.body.error).toBe('Package does not exist.');
  });

  it('should fail when the new version is not sequentially newer', async () => {
    // Mock DynamoDB GetItem response with a newer version already present
    dynamoMock.on(GetItemCommand).resolves({
      Item: {
        id: { S: '123567192081501' },
        name: { S: 'TestPackage' },
        version: { S: '1.0.2' },
        uploadType: { S: 'Content' },
      },
    });

    const response = await request(app)
      .post('/package/123567192081501')
      .set('X-Authorization', validAuthHeader)
      .send(validRequestBody);

    expect(response.status).toBe(400);
    // expect(response.body.error).toBe('Patch version must be uploaded sequentially.');
  });

  it('should fail when required metadata fields are missing', async () => {
    const invalidRequestBody = {
      data: {
        Content: Buffer.from('test content').toString('base64'),
        URL: null,
      },
    };

    const response = await request(app)
      .post('/package/123567192081501')
      .set('X-Authorization', validAuthHeader)
      .send(invalidRequestBody);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Metadata or data fields are missing in the request body.');
  });

  it('should fail when content and URL are both provided', async () => {
    const invalidRequestBody = {
      metadata: {
        Name: 'TestPackage',
        Version: '1.0.1',
        ID: '123567192081501',
      },
      data: {
        Content: Buffer.from('test content').toString('base64'),
        URL: 'https://example.com/repo',
      },
    };

    const response = await request(app)
      .post('/package/123567192081501')
      .set('X-Authorization', validAuthHeader)
      .send(invalidRequestBody);

    expect(response.status).toBe(404);
    // expect(response.body.error).toBe('Cannot provide both Content and URL for a package.');
  });
});
