// RampUpMetric.ts
import { Metrics } from "./Metrics.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";

export class RampUpMetric extends Metrics {
  constructor(githubData: GitHubData, npmData: NPMData) {
    super(githubData, npmData);
  }

  public calculateScore(): number {
    console.log("Calculating RampUp Score...");

    const readmeScore = this.calculateReadmeDescription();
    console.log(`README Description Score: ${readmeScore}`);

    const forksStarsScore = this.calculateForksStarsPercentage();
    console.log(`Forks and Stars Percentage Score: ${forksStarsScore}`);

    const sizeProportionScore = this.calculateSizeProportion();
    console.log(`Repository Size Proportion Score: ${sizeProportionScore}`);

    const issuesScore = this.calculateOpentoClosedIssueRatio();
    console.log(`Open to Closed Issue Ratio Score: ${issuesScore}`);

    const contributorsScore = this.calculateContributors();
    console.log(`Contributors Score: ${contributorsScore}`);

    const RampUp = readmeScore + 
    forksStarsScore + sizeProportionScore + issuesScore + contributorsScore;
    console.log(`Total RampUp Score: ${RampUp}`);

    return RampUp;
  }

  public calculateLatency(): number {
    console.log("Measuring latency for score calculation...");

    const start = performance.now();
    this.calculateScore();
    const end = performance.now();

    const latency = end - start;
    console.log(`Score Calculation Latency: ${latency} ms`);

    return latency;
  }

  public calculateForksStarsPercentage(): number {
    const forks = this.githubData.numberOfForks ?? 0;
    const stars = this.githubData.numberOfStars ?? 0;
    const totalForksStars = forks + stars;

    console.log(`Total Forks: ${forks}, 
      Total Stars: ${stars}, Total Forks + Stars: ${totalForksStars}`);

    let score = 0;
    if (totalForksStars >= 1000) {
      score = 0.1;
    } else {
      score = 0.1 * (totalForksStars / 1000);
    }

    console.log(`Forks and Stars Percentage Score: ${score}`);
    return score;
  }

  public calculateReadmeDescription(): number {
    const hasReadme = !!this.githubData.readme;
    const hasDescription = !!this.githubData.description;

    console.log(`Has README: ${hasReadme}, Has Description: ${hasDescription}`);

    if (hasReadme && hasDescription) {
      return 0.2;
    } else if (hasReadme || hasDescription) {
      return 0.1;
    }
    return 0;
  }

  public calculateSizeProportion(): number {
    const repoSizeKB = (this.githubData.size ?? 0) / 1000;
    console.log(`Repository Size (KB): ${repoSizeKB}`);

    return this.continuousScore(repoSizeKB);
  }

  public continuousScore(x: number): number {
    // Generates a score using a continuous function, scales size proportion
    return (0.35 / (x + 10)) + 0.05;
  }

  public calculateOpentoClosedIssueRatio(): number {
    const openIssues = this.githubData.openIssues?.length ?? 0;
    const closedIssues = this.githubData.Closed_Issues?.length ?? 0;

    console.log(`Open Issues: ${openIssues}, Closed Issues: ${closedIssues}`);

    if (closedIssues > openIssues) {
      return 0.2;
    }

    const issueRatio = (closedIssues / (openIssues + 1)) * 0.2; // Avoid division by 0
    console.log(`Open to Closed Issue Ratio Score: ${issueRatio}`);

    return issueRatio;
  }

  public calculateContributors(): number {
    const contributors = this.githubData.contributions?.length ?? 0;
    const repoSizeKB = (this.githubData.size ?? 0) / 1000;

    // Scale the contributors score using a normalized logistic function
    const standardNoOfContributors = this.contributorScalingNormalized(repoSizeKB);
    console.log(`Contributors: ${contributors},
       Standard No. of Contributors (Normalized): ${standardNoOfContributors}`);

    // Scale the contributors to a maximum score of 0.1
    const score = Math.min(0.1, (contributors / standardNoOfContributors) * 0.1);
    console.log(`Contributors Score: ${score}`);

    return score;
  }

  public contributorScalingNormalized(repoSizeKB: number): number {
    // Normalized logistic function to scale the expected number of contributors between 0 and 1
    return 1 / (1 + Math.exp(-0.1 * (repoSizeKB - 50)));
  }
}
