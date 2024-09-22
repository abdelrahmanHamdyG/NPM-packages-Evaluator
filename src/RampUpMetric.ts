// RampUpMetric.ts
import { Metrics } from "./Metrics.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";
import { Logger } from "./logger.js";

export class RampUpMetric extends Metrics {
  private logger: Logger;
  constructor(githubData: GitHubData, npmData: NPMData) {
    super(githubData, npmData);
    this.logger = new Logger();
  }

  public async calculateScore():Promise<number>{
    this.logger.log(1,"Calculating RampUp Score...");

    const readmeScore = this.calculateReadmeDescription();
    this.logger.log(1,`README Description Score: ${readmeScore}`);

    const forksStarsScore = this.calculateForksStarsPercentage();
    this.logger.log(1,`Forks and Stars Percentage Score: ${forksStarsScore}`);

    const sizeProportionScore = this.calculateSizeProportion();
    this.logger.log(1,`Repository Size Proportion Score: ${sizeProportionScore}`);

    const issuesScore = this.calculateOpentoClosedIssueRatio();
    this.logger.log(1,`Open to Closed Issue Ratio Score: ${issuesScore}`);

    const contributorsScore = this.calculateContributors();
    this.logger.log(1,`Contributors Score: ${contributorsScore}`);

    const RampUp = readmeScore + 
    forksStarsScore + sizeProportionScore + issuesScore + contributorsScore;
    this.logger.log(1,`Total RampUp Score: ${RampUp}`);

    return RampUp;
  }

  public async calculateLatency(): Promise<{ score: number; latency: number }> {
    this.logger.log(2,"Measuring latency for score calculation...");

    const start = performance.now();
    const score =await this.calculateScore();
    const end = performance.now();

    const latency = end - start;
    this.logger.log(2,`Score Calculation Latency: ${latency} ms`);

    return {score:score ,latency};
  }

  public calculateForksStarsPercentage(): number {
    const forks = this.githubData.numberOfForks ?? 0;
    const stars = this.githubData.numberOfStars ?? 0;
    const totalForksStars = forks + stars;

    this.logger.log(2,`Total Forks: ${forks}, 
      Total Stars: ${stars}, Total Forks + Stars: ${totalForksStars}`);

    let score = 0;
    if (totalForksStars >= 1000) {
      score = 0.1;
    } else {
      score = 0.1 * (totalForksStars / 1000);
    }

    return score;
  }

  public calculateReadmeDescription(): number {
    const hasReadme = !!this.githubData.readme;
    const hasDescription = !!this.githubData.description;

    this.logger.log(2,`Has README: ${hasReadme}, Has Description: ${hasDescription}`);

    if (hasReadme && hasDescription) {
      return 0.2;
    } else if (hasReadme || hasDescription) {
      return 0.1;
    }
    return 0;
  }

  public calculateSizeProportion(): number {
    const repoSizeKB = (this.githubData.size ?? 0) / 1000;
    this.logger.log(2,`Repository Size (KB): ${repoSizeKB}`);

    return this.continuousScore(repoSizeKB);
  }

  public continuousScore(x: number): number {
    // Generates a score using a continuous function, scales size proportion
    return (0.35 / (x + 10)) + 0.05;
  }

  public calculateOpentoClosedIssueRatio(): number {
    const openIssues = this.githubData.openIssues?.length ?? 0;
    const closedIssues = this.githubData.Closed_Issues?.length ?? 0;

    this.logger.log(2,`Open Issues: ${openIssues}, Closed Issues: ${closedIssues}`);

    if (closedIssues > openIssues) {
      return 0.2;
    }

    const issueRatio = (closedIssues / (openIssues + 1)) * 0.2; // Avoid division by 0

    return issueRatio;
  }

  public calculateContributors(): number {
    const contributors = this.githubData.contributions?.length ?? 0;
    const repoSizeKB = (this.githubData.size ?? 0) / 1000;

    // Scale the contributors score using a normalized logistic function
    const standardNoOfContributors = this.contributorScalingNormalized(repoSizeKB);
    this.logger.log(2,`Contributors: ${contributors},
       Standard No. of Contributors (Normalized): ${standardNoOfContributors}`);

    // Scale the contributors to a maximum score of 0.1
    const score = Math.min(0.1, (contributors / standardNoOfContributors) * 0.1);

    return score;
  }

  public contributorScalingNormalized(repoSizeKB: number): number {
    // Normalized logistic function to scale the expected number of contributors between 0 and 1
    this.logger.log(2,`Normalized Scale according to size ${repoSizeKB} :
      ${1 / (1 + Math.exp(-0.1 * (repoSizeKB - 50)))}`);
    return 1 / (1 + Math.exp(-0.1 * (repoSizeKB - 50)));
  }
}
