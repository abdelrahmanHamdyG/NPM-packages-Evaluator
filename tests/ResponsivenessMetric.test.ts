import { GitHubData } from "../src/GitHubData";
import { NPMData } from "../src/NPMData";
import { describe, test, expect, beforeEach } from "vitest";
import { Issue } from "../src/IssueInterface";
import {ResponsivenessMetric} from"../src/ResponsivenessMetric";
function createMockIssues(numIssues: number): Issue[] {
    return Array(numIssues).fill(null).map((_, index) => ({
      body : "test",
      id: index + 1,
      title: `Mock Issue ${index + 1}`,
      created_at: `2022-09-${(index % 30) + 1}T12:00:00Z`,
      closed_at: `2022-09-${(index % 30) + 2}T12:00:00Z`,
    }));
  }
describe("Resposiveness Tests", () => {
    let npmData: NPMData;
    let responsivenessMetric: ResponsivenessMetric;
    let githubData:GitHubData;
    beforeEach(() => {
      //mocking githubData and NpmData
      githubData = new GitHubData();
      githubData.size=0;
      githubData.Closed_Issues=createMockIssues(0);
      npmData = new NPMData();
      responsivenessMetric = new ResponsivenessMetric(githubData, npmData);
    });
    test("should calcualate the score of 0.25", async () => {
        const score  = await responsivenessMetric.calculateScore();
        expect(score).toBe(0.25);
      });
    
    test("should calculate the score of 1 ", async () => {
        githubData.size=60000;
        githubData.Closed_Issues=createMockIssues(100);
        const  score = await responsivenessMetric.calculateScore();
        expect(score).toBe(1);
    });
    test("should calculate the score by an equation", async () => {
        githubData.size=110000;
        githubData.Closed_Issues=createMockIssues(80);
        const expectedScore=8/12;
        const score = await responsivenessMetric.calculateScore();
        expect(score).toBe(expectedScore);
    });
    test("should calculate latency and the score ", async () => {
        githubData.size=40000;
        githubData.Closed_Issues=createMockIssues(70);
        const expectedScore=7/8;
        
        const { score, latency } = await responsivenessMetric.calculateLatency();
        expect(score).toBe(expectedScore);
        // Latency should be a positive number (time taken to calculate)
        expect(latency).toBeGreaterThanOrEqual(0);
    });
});