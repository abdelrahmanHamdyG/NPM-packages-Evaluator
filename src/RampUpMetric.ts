import { Metrics } from "./Metrics.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";
import { Logger } from "./logger.js";

const logger = new Logger();

export class RampUpMetric extends Metrics {
  constructor(githubData: GitHubData, npmData: NPMData) {
    super(githubData, npmData);
  }

  public async calculateScore(): Promise<number> {
    logger.log(1, "Calculating RampUp Score...");

    const readmeScore = this.calculateReadmeDescription();
    logger.log(1, `README Description Score: ${readmeScore}`);

    const forksStarsScore = this.calculateForksStarsPercentage();
    logger.log(1, `Forks and Stars Percentage Score: ${forksStarsScore}`);

    const sizeProportionScore = this.calculateSizeProportion();
    logger.log(1, `Repository Size Proportion Score: ${sizeProportionScore}`);

    const issuesScore = this.calculateOpentoClosedIssueRatio();
    logger.log(1, `Open to Closed Issue Ratio Score: ${issuesScore}`);

    const contributorsScore = this.calculateContributors();
    logger.log(1, `Contributors Score: ${contributorsScore}`);

    const RampUp = readmeScore + 
      forksStarsScore + 
      sizeProportionScore + 
      issuesScore + 
      contributorsScore;
      
    logger.log(1, `Total RampUp Score: ${RampUp}`);

    return RampUp;
  }

  public async calculateLatency(): Promise<{ score: number; latency: number }> {
    logger.log(1, "Measuring latency for score calculation...");

    const start = performance.now();
    const score = await this.calculateScore();
    const end = performance.now();

    const latency = end - start;
    logger.log(1, `Score Calculation Latency: ${latency} ms`);

    return { score, latency };
  }

  public calculateForksStarsPercentage(): number {
    const forks = this.githubData.numberOfForks ?? 0;
    const stars = this.githubData.numberOfStars ?? 0;
    const totalForksStars = forks + stars;

    // eslint-disable-next-line max-len
    logger.log(1, `Total Forks: ${forks}, Total Stars: ${stars}, Total Forks + Stars: ${totalForksStars}`);

    let score = 0;
    if (totalForksStars >= 1000) {
      score = 0.1;
    } else {
      score = 0.1 * (totalForksStars / 1000);
    }

    logger.log(1, `Forks and Stars Percentage Score: ${score}`);
    return score;
  }

  public calculateReadmeDescription(): number {
    const hasReadme = !!this.githubData.readme;
    const hasDescription = !!this.githubData.description;

    logger.log(1, `Has README: ${hasReadme}, Has Description: ${hasDescription}`);

    if (hasReadme && hasDescription) {
      return 0.2;
    } else if (hasReadme || hasDescription) {
      return 0.1;
    }
    return 0;
  }

  public calculateSizeProportion(): number {
    const repoSizeKB = (this.githubData.size ?? 0) / 1000;
    logger.log(1, `Repository Size (KB): ${repoSizeKB}`);

    return this.continuousScore(repoSizeKB);
  }

  public continuousScore(x: number): number {
    // Generates a score using a continuous function, scales size proportion
    return (0.35 / (x + 10)) + 0.05;
  }

  public calculateOpentoClosedIssueRatio(): number {
    const openIssues = this.githubData.openIssues?.length ?? 0;
    const closedIssues = this.githubData.Closed_Issues?.length ?? 0;

    logger.log(1, `Open Issues: ${openIssues}, Closed Issues: ${closedIssues}`);

    if (closedIssues > openIssues) {
      return 0.2;
    }

    const issueRatio = (closedIssues / (openIssues + 1)) * 0.2; // Avoid division by 0
    logger.log(1, `Open to Closed Issue Ratio Score: ${issueRatio}`);

    return issueRatio;
  }

  public calculateContributors(): number {
    const contributors = this.githubData.contributions?.length ?? 0;
    const repoSizeKB = (this.githubData.size ?? 0) / 1000;

    // Scale the contributors score using a normalized logistic function
    const standardNoOfContributors = this.contributorScalingNormalized(repoSizeKB);
    // eslint-disable-next-line max-len
    logger.log(1, `Contributors: ${contributors}, Standard No. of Contributors (Normalized): ${standardNoOfContributors}`);

    // Scale the contributors to a maximum score of 0.1
    const score = Math.min(0.1, (contributors / standardNoOfContributors) * 0.1);
    logger.log(1, `Contributors Score: ${score}`);

    return score;
  }

  public contributorScalingNormalized(repoSizeKB: number): number {
    // Normalized logistic function to scale the expected number of contributors between 0 and 1
    return 1 / (1 + Math.exp(-0.1 * (repoSizeKB - 50)));
  }
}
