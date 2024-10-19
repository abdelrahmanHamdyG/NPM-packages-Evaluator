import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import   {CorrectnessMetric} from "../src/CorrectnessMetric";
import { GitHubData } from "../src/GitHubData";
import { NPMData } from "../src/NPMData";
import git from "isomorphic-git";
import fs from "fs-extra";
import http from "isomorphic-git/http/node/index.js";


describe("CorrectnessMetric", () => {
  let correctnessMetric: CorrectnessMetric;
  let githubData: GitHubData;
  let npmData: NPMData;

  beforeAll(() => {
    githubData = {
      name: "test-repo",
      url: "https://github.com/user/test-repo.git",
    } as GitHubData;

    npmData = {} as NPMData;
    correctnessMetric = new CorrectnessMetric(githubData, npmData);
  });

  afterAll(async () => {
    // Clean up any cloned repositories
    await fs.remove(githubData.name as string as string);
  });

  it("should clone the repository", async () => {
    // Mock the git.clone function
    const cloneSpy = vi.spyOn(git, "clone").mockResolvedValue();

    await correctnessMetric.cloneRepo();

    expect(cloneSpy).toHaveBeenCalledWith({
      fs,
      http,
      dir: githubData.name as string,
      url: githubData.url,
      singleBranch: true,
      depth: 21,
    });

    cloneSpy.mockRestore();
  });

  it("should get the latest commit", async () => {
    // Mock the git.log function
    const logSpy = vi.spyOn(git, "log").mockResolvedValue([
      { oid: "latest-commit-oid" },
    ] as any);

    const latestCommit = await correctnessMetric
    .getLatestCommit(githubData.name as string as string);

    expect(latestCommit).toEqual({ oid: "latest-commit-oid" });

    logSpy.mockRestore();
  });

  it("should get the commit 20 commits ago", async () => {
    // Mock the git.log function
    const commits = Array.from({ length: 21 }, (_, i) => ({ oid: `commit-${i}` }));
    const logSpy = vi.spyOn(git, "log").mockResolvedValue(commits as any);

    const commit20Ago = await correctnessMetric.getCommit20Ago(githubData.name as string as string);

    expect(commit20Ago).toEqual({ oid: "commit-20" });

    logSpy.mockRestore();
  });

  it("should checkout a specific commit", async () => {
    // Mock the git.checkout function
    const checkoutSpy = vi.spyOn(git, "checkout").mockResolvedValue();

    await correctnessMetric.checkoutCommit(githubData.name as string, "some-commit-oid");

    expect(checkoutSpy).toHaveBeenCalledWith({
      fs,
      dir: githubData.name as string,
      ref: "some-commit-oid",
    });

    checkoutSpy.mockRestore();
  });

  it("should calculate the correctness score", async () => {
    // Mock dependent functions
    vi.spyOn(correctnessMetric, "cloneRepo").mockResolvedValue();
    vi.spyOn(correctnessMetric, "getCommit20Ago").mockResolvedValue({ oid: "commit-oid" } as any);
    vi.spyOn(correctnessMetric, "checkoutCommit").mockResolvedValue();
    vi.spyOn(fs, "remove").mockResolvedValue();

    // Mock countTotalLinesFilesAndTests to return different results
    const countSpy = vi.spyOn(correctnessMetric, "countTotalLinesFilesAndTests");
    countSpy
      .mockResolvedValueOnce({
        totalLines: 100,
        totalFiles: 10,
        testFileCount: 2,
        testLineCount: 20,
      })
      .mockResolvedValueOnce({
        totalLines: 80,
        totalFiles: 8,
        testFileCount: 1,
        testLineCount: 10,
      });

    const score = await correctnessMetric.calculateScore();

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);

    // Restore mocks
    vi.restoreAllMocks();
  });

  it("should calculate latency and score", async () => {
    // Mock the calculateScore function
    const calculateScoreSpy = vi.spyOn(correctnessMetric, "calculateScore").mockResolvedValue(0.75);

    const result = await correctnessMetric.calculateLatency();

    expect(result.score).toBe(0.75);
    expect(result.latency).toBeGreaterThan(0);

    calculateScoreSpy.mockRestore();
  });

  it("should analyze and return 0", async () => {
    const analyzeResult = await correctnessMetric.analyze();
    expect(analyzeResult).toBe(0);
  });
});
