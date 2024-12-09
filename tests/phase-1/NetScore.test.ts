import { GitHubData } from "../../src/phase-1/GitHubData";
import { NPMData } from "../../src/phase-1/NPMData";
import { describe, test, expect, beforeEach } from "vitest";
import {NetScore} from "../../src/phase-1/NetScore";
import { Issue } from "../../src/phase-1/IssueInterface";
import {ResponsivenessMetric} from"../../src/phase-1/ResponsivenessMetric";
import { RampUpMetric } from "../../src/phase-1/RampUpMetric";
import {LicenseMetric} from"../../src/phase-1/LicenseMetric";
import { Metrics } from "../../src/phase-1/Metrics";
import { DependencyPinningMetric } from "../../src/phase-1/DependencyPinningMetric";
import { CorrectnessMetric } from "../../src/phase-1/CorrectnessMetric";

import { BusFactorMetric } from "../../src/phase-1/BusFactorMetric";
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
    let dependencyMetric:DependencyPinningMetric;
    let correctnessMetric:CorrectnessMetric;
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
      dependencyMetric = new DependencyPinningMetric(githubData, npmData);
      correctnessMetric=new CorrectnessMetric(githubData, npmData);
    });
  
      test("return value of net score", async () => {
        const score  = await netScore.calculateScore();
        const s  = netScore.getMetricResults();
        expect(s).toBeDefined;
      });
      test("should calcualate the net score and latency", async () => {
        const {latency,score}  = await netScore.calculateLatency();
        const expected=(0.5 / 11) + (1/13)*(await busFactor.calculateScore())+(1/13)*(await rampUpMetric.calculateScore())+(3/13)*(await responsivenessMetric.calculateScore())+(3/13)* (await licenseMetric.calculateScore())+(2/13)* (await dependencyMetric.calculateScore());
        expect(score).toBeCloseTo(expected,1);
        expect(latency).toBeGreaterThan(0);
      });
});
