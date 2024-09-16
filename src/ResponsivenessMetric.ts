// RampUpMetric.ts
import { Metrics } from "./Metrics.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";
import { Issue } from "./IssueInterface.js";

export class ResponsivenessMetric extends Metrics {

  public filteredIssues: Issue[] = [];

  constructor(githubData: GitHubData, npmData: NPMData) {
    super(githubData, npmData);
  
  }

  public calculateScore(): number {
    const timeDifferences = this.getTimeDiff();
    const averageTime = timeDifferences.length
      ? timeDifferences.reduce((sum, time) => sum + time, 0)
      / timeDifferences.length
      : 0;
    const score = averageTime 
    < 7 ? 1 : Math.max((12 - (averageTime / 7)) / 12, 0);
    return score;
  }

  public calculateLatency(): number {
    return -1;
  }

  

  private getTimeDiff(): number[] {
    return this.filteredIssues.map((issue: Issue) => {
      const createdAt = new Date(issue.created_at);
      const closedAt = new Date(issue.closed_at!);
      return (closedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    });
  }
}
