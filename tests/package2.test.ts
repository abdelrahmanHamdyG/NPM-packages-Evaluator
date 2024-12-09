import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";
import packageRouter from "../src/api/routes/package.js"; // Adjust the path to your package router
import { getPackageFromDynamoDB } from "../src/api/services/dynamoservice.js";
import { downloadFileFromS3 } from "../src/api/services/s3service.js";

// Mock the external services
vi.mock("../src/api/services/dynamoservice.js", () => ({
    getPackageFromDynamoDB: vi.fn(),
}));

vi.mock("../src/api/services/s3service.js", () => ({
    downloadFileFromS3: vi.fn(),
}));


const app = express();
app.use(express.json());
app.use("/package", packageRouter);

describe("GET /package/:id", () => {
    it("should return 404 if the package is not found", async () => {
        vi.mocked(getPackageFromDynamoDB).mockResolvedValueOnce(null);

        const response = await request(app).get("/package/nonexistent-id");
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: "Package not found." });
    });

    it("should return 500 if there is an internal server error", async () => {
        vi.mocked(getPackageFromDynamoDB).mockRejectedValueOnce(new Error("DynamoDB error"));

        const response = await request(app).get("/package/example-id");
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: "Internal server error." });
    });
});


describe("GET /package/:id/rate", () => {
  it("should return 404 if the package does not exist", async () => {
    vi.mocked(getPackageFromDynamoDB).mockResolvedValueOnce(null);

    const response = await request(app).get("/package/nonexistent-id/rate");
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Package does not exist." });
  });

  it("should return 500 if there is an internal server error", async () => {
    vi.mocked(getPackageFromDynamoDB).mockRejectedValueOnce(new Error("DynamoDB error"));

    const response = await request(app).get("/package/example-id/rate");
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Internal server error." });
  });
});

describe("GET /package/:id/cost", () => {
  it("should return 404 if the package is not found", async () => {
    // Mock the DynamoDB call to return null (package not found)
    vi.mocked(getPackageFromDynamoDB).mockResolvedValueOnce(null);

    const response = await request(app).get("/package/nonexistent-id/cost");
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Package not found." });
  });

  it("should return 500 if the package content key is missing", async () => {
    const mockPackageData = {
      name: "example-package",
      version: "1.0.0",
      id: "example-id",
      s3Key: "", // Missing s3Key
    };

    vi.mocked(getPackageFromDynamoDB).mockResolvedValueOnce(mockPackageData);

    const response = await request(app).get("/package/example-id/cost");
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Package content key is missing." });
  });

  it("should return 500 if an error occurs while calculating the cost", async () => {
    const mockPackageData = {
      name: "example-package",
      version: "1.0.0",
      id: "example-id",
      s3Key: "example-s3-key",
    };

    // Mocking DynamoDB and S3 methods
    vi.mocked(getPackageFromDynamoDB).mockResolvedValueOnce(mockPackageData);
    vi.mocked(downloadFileFromS3).mockRejectedValueOnce(new Error("S3 download error"));

    const response = await request(app).get("/package/example-id/cost");
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Internal server error." });
  });
});