import { GitHubData } from "../src/GitHubData";
import { NPMData } from "../src/NPMData";
import { describe, test, expect, beforeEach } from "vitest";
import {NetScore} from "../src/NetScore";
import { Issue } from "../src/IssueInterface";
import {ResponsivenessMetric} from"../src/ResponsivenessMetric";
import { RampUpMetric } from "../src/RampUpMetric";
import {LicenseMetric} from"../src/LicenseMetric";
import { Metrics } from "../src/Metrics";

import { BusFactorMetric } from "../src/BusFactorMetric";
function createMockIssues(numIssues: number): Issue[] {
    return Array(numIssues).fill(null).map((_, index) => ({
      body : "test",
      id: index + 1,
      title: `Mock Issue ${index + 1}`,
      created_at: `2022-09-${(index % 30) + 1}T12:00:00Z`,
      closed_at: `2022-09-${(index % 30) + 2}T12:00:00Z`,
    }));
}

describe("NetScore Tests", () => {
    let npmData: NPMData;
    let netScore: NetScore;
    let githubData:GitHubData;
    let rampUpMetric:RampUpMetric;
    let busFactor:BusFactorMetric;
    let licenseMetric:LicenseMetric;
    let responsivenessMetric:ResponsivenessMetric;
    beforeEach(() => {
      //mocking githubData and NpmData
      githubData = new GitHubData();
      githubData.license="MIT";
      githubData.size=60000;
      githubData.Closed_Issues=createMockIssues(100);
      githubData.name="testtest";
      githubData.readme=true;
      githubData.description=true;
      npmData = new NPMData();
      netScore = new NetScore(githubData, npmData);
      rampUpMetric=new RampUpMetric(githubData, npmData);
      responsivenessMetric=new ResponsivenessMetric(githubData, npmData);
      licenseMetric=new LicenseMetric(githubData, npmData);
      busFactor=new BusFactorMetric(githubData, npmData);
    });
    test("should calcualate the net score", async () => {
        const score  = await netScore.calculateScore();
        const expected=(0.5 / 11) + (1/11)*(await busFactor.calculateScore())+(1/11)*(await rampUpMetric.calculateScore())+(5/11)*(await responsivenessMetric.calculateScore())+(3/11)* (await licenseMetric.calculateScore());
        expect(score).toBeCloseTo(expected,5);
      });
      test("return value of net score", async () => {
        const score  = await netScore.calculateScore();
        const s  = netScore.getMetricResults();
        expect(s).toBeDefined;
      });
      test("should calcualate the net score and latency", async () => {
        const {latency,score}  = await netScore.calculateLatency();
        const expected=(0.5 / 11) + (1/11)*(await busFactor.calculateScore())+(1/11)*(await rampUpMetric.calculateScore())+(5/11)*(await responsivenessMetric.calculateScore())+(3/11)* (await licenseMetric.calculateScore());
        expect(score).toBeCloseTo(expected,5);
        expect(latency).toBeGreaterThan(0);
      });
});
