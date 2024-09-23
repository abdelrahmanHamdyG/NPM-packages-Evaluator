import { Metrics } from "./Metrics.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";
import { Issue } from "./IssueInterface.js";
import { Logger } from "./logger.js";

const logger = new Logger();

// Defining the ResponsivenessMetric class to calculate how responsive the repository is
export class ResponsivenessMetric extends Metrics {
  public filteredIssues: Issue[] = [];

  // Initializing with GitHub and NPM data
  constructor(githubData: GitHubData, npmData: NPMData) {
    super(githubData, npmData);
    logger.log(1, "ResponsivenessMetric instance created."); // Info level
  }

  // Calculating the responsiveness score based on the number of closed issues
  public async calculateScore(): Promise<number> {
    this.filteredIssues = this.githubData.Closed_Issues || [];
    logger.log(2, `Number of closed issues: ${this.filteredIssues.length}`); // Debug level

    if (this.filteredIssues.length === 0) {
      logger.log(1, "No closed issues found, returning default score: 0.25"); // Info level
      return 0.25;
    }

    let standard_no_of_issues = 0;
    const repoSize = this.githubData?.size ?? 0;
    logger.log(2, `Repository size (KB): ${repoSize}`); // Debug level

    // Determining the standard number of issues based on repository size
    if (repoSize / 1000 >= 100) {
      standard_no_of_issues = 120;
      logger.log(2, "Repository size > 100MB, standard number of issues set to 120."); // Debug level
    } else if (repoSize / 1000 > 50) {
      standard_no_of_issues = 90;
      logger.log(2, "Repository size > 50MB, standard number of issues set to 90."); // Debug level
    } else {
      standard_no_of_issues = 80;
      logger.log(2, "Repository size <= 50MB, standard number of issues set to 80."); // Debug level
    }

    // If the number of closed issues exceeds the standard, return a perfect score
    if (this.filteredIssues.length > standard_no_of_issues) {
      logger.log(1, "Number of closed issues exceeds standard, returning score: 1"); // Info level
      return 1;
    }

    // Calculating the responsiveness score based on the ratio of closed issues to the standard
    const score = Math.max(this.filteredIssues.length / standard_no_of_issues, 0);
    logger.log(2, `Calculated responsiveness score: ${score}`); // Debug level
    return score;
  }

  // Measuring the latency for calculating the responsiveness score
  public async calculateLatency(): Promise<{ score: number; latency: number }> {
    const start = performance.now();
    logger.log(1, "Calculating responsiveness score with latency..."); // Info level

    const score = await this.calculateScore();
    const end = performance.now();

    const latency = end - start;
    logger.log(2, `Score calculated: ${score}, Latency: ${latency} ms`); // Debug level

    return { score, latency };
  }
}
