import { GitHubData } from "../../src/phase-1/GitHubData";
import { NPMData } from "../../src/phase-1/NPMData";
import { describe, test, expect, beforeEach } from "vitest";
import {LicenseMetric} from"../../src/phase-1/LicenseMetric";
describe("BusFactorMetric Tests", () => {
    let npmData: NPMData;
    let licenseMetric: LicenseMetric;
    let githubData:GitHubData;
    beforeEach(() => {
      //mocking githubData and NpmData
      githubData = new GitHubData();
      githubData.license="MIT";
      npmData = new NPMData();
      npmData.license="empty";
      licenseMetric = new LicenseMetric(githubData, npmData);
    });
    test("should calculate latency and the license", async () => {
        const { score, latency } = await licenseMetric.calculateLatency();
        expect(score).toBe(1);
        // Latency should be a positive number (time taken to calculate)
        expect(latency).toBeGreaterThanOrEqual(0);
      });
    
    test("should calculate latency and the license (partial)", async () => {
        githubData.license="MPL 2.0";
        const { score, latency } = await licenseMetric.calculateLatency();
        expect(score).toBe(0.5);
        // Latency should be a positive number (time taken to calculate)
        expect(latency).toBeGreaterThanOrEqual(0);
    });
    test("should calculate latency and the license from github (not)", async () => {
        githubData.license="empty";
        const { score, latency } = await licenseMetric.calculateLatency();
        expect(score).toBe(0);
        // Latency should be a positive number (time taken to calculate)
        expect(latency).toBeGreaterThanOrEqual(0);
    });
    test("should calculate latency and the license from npm ", async () => {
        githubData.license="empty";
        npmData.license="MIT";
        const { score, latency } = await licenseMetric.calculateLatency();
        expect(score).toBe(1);
        // Latency should be a positive number (time taken to calculate)
        expect(latency).toBeGreaterThanOrEqual(0);
    });
});