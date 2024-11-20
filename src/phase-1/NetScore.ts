import { GitHubData } from "./GitHubData.js";
import { RampUpMetric } from "./RampUpMetric.js";
import { CorrectnessMetric } from "./CorrectnessMetric.js";
import { BusFactorMetric } from "./BusFactorMetric.js";
import { ResponsivenessMetric } from "./ResponsivenessMetric.js";
import { LicenseMetric } from "./LicenseMetric.js";
import { NPMData } from "./NPMData.js";
import { Metrics } from "./Metrics.js";
import { Logger } from "./logger.js";
import { CodeReviewMetric } from "./CodeReviewMetric.js";  // Import CodeReviewMetric

const logger = new Logger();

export class NetScore extends Metrics {
  private correctnessMetric: CorrectnessMetric;
  private busFactorMetric: BusFactorMetric;
  private responsivenessMetric: ResponsivenessMetric;
  private rampUpMetric: RampUpMetric;
  private licenseMetric: LicenseMetric;
  private codeReviewMetric: CodeReviewMetric;

  // New attribute to store metric results
  private metrics: [
    correctness: { score: number, latency: number },
    responsiveness: { score: number, latency: number },
    rampUp: { score: number, latency: number },
    busFactor: { score: number, latency: number },
    license: { score: number, latency: number },
    codeReview: { score: number, latency: number }
  ] | null = null;

  constructor(githubData: GitHubData, npmData: NPMData) {
    super(githubData, npmData);
    logger.log(1, "NetScore instance created.");
    this.correctnessMetric = new CorrectnessMetric(githubData, npmData);
    this.responsivenessMetric = new ResponsivenessMetric(githubData, npmData);
    this.rampUpMetric = new RampUpMetric(githubData, npmData);
    this.busFactorMetric = new BusFactorMetric(githubData, npmData);
    this.licenseMetric = new LicenseMetric(githubData, npmData);
    this.codeReviewMetric = new CodeReviewMetric(githubData, npmData);  // Create
  }

  // Method to calculate and store metric results
  public async calculateScore(): Promise<number> {
    logger.log(1, "Calculating NetScore...");
    // Calculate all metrics in parallel using Promise.all
    const metricResults = await Promise.all([
      this.correctnessMetric.calculateLatency(),
      this.responsivenessMetric.calculateLatency(),
      this.rampUpMetric.calculateLatency(),
      this.busFactorMetric.calculateLatency(),
      this.licenseMetric.calculateLatency(),
      this.codeReviewMetric.calculateLatency()  // Call calculateLatency
    ]);

    const [correctness, responsiveness, rampUp, busFactor, license, codeReviewMetric] = metricResults;
    logger.log(2, `Correctness score: ${correctness.score}, latency: ${correctness.latency}`);
    logger.log(2, `Responsiveness score: ${responsiveness.score}, latency: ${responsiveness.latency}`);
    logger.log(2, `RampUp score: ${rampUp.score}, latency: ${rampUp.latency}`);
    logger.log(2, `BusFactor score: ${busFactor.score}, latency: ${busFactor.latency}`);
    logger.log(2, `License score: ${license.score}, latency: ${license.latency}`);
    logger.log(2, `CodeReview score: ${codeReviewMetric.score}, latency: ${codeReviewMetric.latency}`);

    // Store the results in the class attribute
    this.metrics = metricResults;

    // Calculate NetScore based on the stored metric results
    const netScore = 
      (1/11) * rampUp.score + 
      (1/11) * correctness.score + 
      (1/11) * busFactor.score + 
      (5/11) * responsiveness.score + 
      (2/11) * license.score; +
      (1/11) * codeReviewMetric.score;

    logger.log(1, `Calculated NetScore: ${netScore}`);
    return netScore;
  }

  public getMetricResults(): [
    correctness: { score: number, latency: number },
    responsiveness: { score: number, latency: number },
    rampUp: { score: number, latency: number },
    busFactor: { score: number, latency: number },
    license: { score: number, latency: number },
    codeReview: { score: number, latency: number }
  ] | null {
    logger.log(2, "Returning stored metric results.");
    return this.metrics;
  }

  public async calculateLatency(): Promise<{ score: number; latency: number }> {
    logger.log(1, "Calculating latency for NetScore calculation...");
    const start = performance.now();
    const score = await this.calculateScore();
    const end = performance.now();
    const latency = end - start;
    logger.log(1, `NetScore: ${score}, Latency: ${latency} ms`);
    return { score, latency };
  }
}