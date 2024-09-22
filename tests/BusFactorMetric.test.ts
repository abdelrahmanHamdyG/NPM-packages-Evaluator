import { GitHubData } from "../src/GitHubData";
import { NPMData } from "../src/NPMData";
import { describe, test, expect, beforeEach } from "vitest";
import { BusFactorMetric } from "../src/BusFactorMetric";
function createMockContributors(numContributors: number): Array<{ contributor: string, commits: number }> {
  return Array(numContributors).fill(null).map((_, index) => ({
    contributor: `Contributor ${index + 1}`,  // Assigns a unique name to each contributor
    commits: 2, // 2 commits only to every contributor to test it easily
  }));
}
describe("BusFactorMetric Tests", () => {
  let githubData: GitHubData;
  let npmData: NPMData;
  let busFactorMetric: BusFactorMetric;
  let numberofco:any;
  beforeEach(() => {
    // Mock GitHubData and NPMData
    githubData = new GitHubData();
    numberofco=10;
    githubData.contributions=createMockContributors(numberofco);
    npmData = new NPMData(); //I don't need this for BusFactorMetric, but it's passed to the constructor
    busFactorMetric = new BusFactorMetric(githubData, npmData);
  });

  test("should calculate total commits correctly", () => {
    const totalCommits = busFactorMetric.totalCommits();
    expect(totalCommits).toBe((numberofco*2));//2*10 
  });

  test("should calculate HHI correctly", () => {
    const totalCommits = busFactorMetric.totalCommits();
    const hhi = busFactorMetric.HHI(totalCommits);

    // HHI = 10*(2/20)^2 
    const expectedHHI = 10*Math.pow(1 / 10, 2);
    expect(hhi).toBeCloseTo(expectedHHI, 5); // Using toBeCloseTo for floating-point precision
  });

  test("should calculate bus factor correctly", async () => {
    const busFactor = await busFactorMetric.calculateScore();
    const totalCommits = busFactorMetric.totalCommits();
    const hhi = busFactorMetric.HHI(totalCommits);
    const expectedBusFactor = Math.max(0, 1 - hhi); // 1 - HHI
    expect(busFactor).toBeCloseTo(expectedBusFactor, 5);
  });

  test("should handle edge case of no commits", async () => {
    // Simulate empty contributions
    githubData.contributions = [];
    busFactorMetric = new BusFactorMetric(githubData, npmData);
    const busFactor = await busFactorMetric.calculateScore();
    expect(busFactor).toBe(0); // No commits should return bus factor 0
  });

  test("should calculate latency", async () => {
    const { score, latency } = await busFactorMetric.calculateLatency();

    // The score should still be valid
    const totalCommits = busFactorMetric.totalCommits();
    const hhi = busFactorMetric.HHI(totalCommits);
    const expectedScore = Math.max(0, 1 - hhi);

    expect(score).toBeCloseTo(expectedScore, 5);

    // Latency should be a positive number (time taken to calculate)
    expect(latency).toBeGreaterThanOrEqual(0);
  });
});