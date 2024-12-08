import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";
import tracksRouter from "../src/api/routes/tracks.js"; // Adjust path based on your project structure

const app = express();
app.use(express.json());
app.use("/tracks", tracksRouter);

describe("GET /tracks", () => {
  it("should return the list of tracks the student plans to implement", async () => {
    const response = await request(app)
      .get("/tracks")

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("plannedTracks");
    expect(response.body.plannedTracks).toEqual([
      "Performance track",
    ]);
  });

});
