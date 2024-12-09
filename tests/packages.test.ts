import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";
import packagesRouter from "../src/api/routes/packages.js"; 
import { getPackagesFromDynamoDB } from "../src/api/services/dynamoservice.js";

// Mock DynamoDB service
vi.mock("../src/api/services/dynamoservice.js", () => ({
  getPackagesFromDynamoDB: vi.fn(),
}));

const app = express();
app.use(express.json());
app.use("/packages", packagesRouter);

describe("POST /packages", () => {
  it("should return packages for a valid request body", async () => {
    const mockPackages = [
      { Name: "debug", Version: "4.3.4", ID: "debug-4.3.4" },
      { Name: "lodash", Version: "4.17.21", ID: "lodash-4.17.21" },
    ];

    getPackagesFromDynamoDB.mockResolvedValueOnce({
      packages: mockPackages,
      nextOffset: "10",
    });

    const payload = [
      { Name: "debug", Version: "^4.0.0" },
      { Name: "lodash", Version: "~4.17.0" },
    ];

    const response = await request(app)
      .post("/packages")
      .send(payload)
      .set("X-Authorization", "Bearer validToken");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockPackages);
    expect(response.headers["x-next-offset"]).toBe("10");
  });

  it("should return 400 for invalid request body", async () => {
    const payload = [{ Version: "^4.0.0" }]; // Missing `Name`

    const response = await request(app)
      .post("/packages")
      .send(payload)
      .set("X-Authorization", "Bearer validToken");

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      "error",
      "Invalid PackageQuery. Ensure the request body contains an array of { Name, Version } objects."
    );
  });

  it("should return 404 when no packages are found", async () => {
    getPackagesFromDynamoDB.mockResolvedValueOnce({
      packages: [],
      nextOffset: "",
    });

    const payload = [{ Name: "nonexistent", Version: "1.0.0" }];

    const response = await request(app)
      .post("/packages")
      .send(payload)
      .set("X-Authorization", "Bearer validToken");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty(
      "error",
      "No packages found matching the query."
    );
  });

  it("should return 413 if too many packages are returned", async () => {
    const mockPackages = Array.from({ length: 101 }, (_, index) => ({
      Name: `package${index}`,
      Version: "1.0.0",
      ID: `package${index}-1.0.0`,
    }));

    getPackagesFromDynamoDB.mockResolvedValueOnce({
      packages: mockPackages,
      nextOffset: "",
    });

    const payload = [{ Name: "*", Version: "^1.0.0" }];

    const response = await request(app)
      .post("/packages")
      .send(payload)
      .set("X-Authorization", "Bearer validToken");

    expect(response.status).toBe(413);
    expect(response.body).toHaveProperty(
      "error",
      "Too many packages returned. Refine your query."
    );
  });

  it("should handle wildcard queries with no results", async () => {
    getPackagesFromDynamoDB.mockResolvedValueOnce({
      packages: [],
      nextOffset: "",
    });

    const payload = [{ Name: "*" }];

    const response = await request(app)
      .post("/packages")
      .send(payload)
      .set("X-Authorization", "Bearer validToken");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
