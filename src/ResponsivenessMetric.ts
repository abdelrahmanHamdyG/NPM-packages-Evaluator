import { Metrics } from "./Metrics.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";
import { Issue } from "./IssueInterface.js";
import { Logger } from "./logger.js"; 

export class ResponsivenessMetric extends Metrics {
  public filteredIssues: Issue[] = [];
  private logger: Logger;

  constructor(githubData: GitHubData, npmData: NPMData) {
    super(githubData, npmData);
    this.logger = new Logger(); // Initialize logger
  }

  public async calculateScore(): Promise<number> {
    this.logger.log(1, "Calculating Responsiveness Metric...");

    this.filteredIssues = this.githubData.Closed_Issues || [];

    if (this.filteredIssues.length === 0) {
      this.logger.log(1, "No closed issues found in the repository. Returning default score: 0.25");
      return 0.25;
    }

    this.logger.log(2, `Total closed issues found: ${this.filteredIssues.length}`);

    let standardNoOfIssues = 0;
    const repoSize = this.githubData?.size ?? 0; // Default to 0 if size is undefined
    this.logger.log(2, `Repository size: ${repoSize / 1000} MB`);

    if (repoSize / 1000 >= 100) { // If the repo size is greater than 100MB
      standardNoOfIssues = 120;
      this.logger.log(1, "Repository is large (>100MB). Standard number of issues set to 120.");
    } else if (repoSize / 1000 > 50) { 
      standardNoOfIssues = 90;
      this.logger.log(1, "Repository size is between 50MB and 100MB." +
         "Standard number of issues set to 90.");
    } else {
      standardNoOfIssues = 80;
      this.logger.log(1, "Repository size is below 50MB. Standard number of issues set to 80.");
    }

    if (this.filteredIssues.length > standardNoOfIssues) {
      this.logger.log(1, "Closed issues exceed the standard number. Returning score: 1");
      return 1;
    }

    const score = Math.max(this.filteredIssues.length / standardNoOfIssues, 0);
    this.logger.log(1, `Responsiveness score calculated: ${score}`);
    return score;
  }

  public async calculateLatency(): Promise<{ score: number; latency: number }> {
    this.logger.log(1, "Calculating Responsiveness Metric with latency measurement...");

    const start = performance.now();
    const score = await this.calculateScore();
    const end = performance.now();

    const latency = end - start;
    this.logger.log(1, `Responsiveness score: ${score}`);
    this.logger.log(2, `Latency: ${latency} milliseconds`);

    return { score, latency };
  }
}
