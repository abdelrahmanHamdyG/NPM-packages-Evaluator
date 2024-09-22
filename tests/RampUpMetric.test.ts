import { describe, it, expect, beforeAll} from "vitest";
import { RampUpMetric } from "../src/RampUpMetric";
import { GitHubData } from "../src/GitHubData";
import { NPMData } from "../src/NPMData";

describe("RampUpMetric", () => {
  let rampUpMetric: RampUpMetric;
  let githubData: GitHubData;
  let npmData: NPMData;

  beforeAll(() => {
    githubData = {
      readme: true,
      description: true,
      numberOfForks: 500,
      numberOfStars: 300,
      size: 5000, // in KB

    } as GitHubData;

    npmData = {} as NPMData;
    rampUpMetric = new RampUpMetric(githubData, npmData);
  });

  it("should calculate the README description score", () => {
    const score = rampUpMetric.calculateReadmeDescription();
    expect(score).toBe(0.2);
  });

  it("should calculate the forks and stars percentage score", () => {
    const score = rampUpMetric.calculateForksStarsPercentage();
    expect(score).toBeCloseTo(0.08, 2); // (800/1000) * 0.1
  });

  it("should calculate the repository size proportion score", () => {
    const score = rampUpMetric.calculateSizeProportion();
    expect(score).toBeGreaterThan(0); // Validate that the continuous score gives a positive value
  });

  

  it("should calculate the contributors score", () => {
    const score = rampUpMetric.calculateContributors();
    expect(score).toBeLessThanOrEqual(0.1); // Score is capped at 0.1
  });

  it("should calculate the total RampUp score", async () => {
    const score = await rampUpMetric.calculateScore();
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("should calculate latency and score", async () => {
    const result = await rampUpMetric.calculateLatency();
    expect(result.score).toBeGreaterThan(0);
    expect(result.latency).toBeGreaterThan(0);
  });
});