import { GitHubData } from "./GitHubData.js";
import { RampUpMetric } from "./RampUpMetric.js";
import { CorrectnessMetric } from "./CorrectnessMetric.js";
import { BusFactorMetric } from "./BusFactorMetric.js";
import { ResponsivenessMetric } from "./ResponsivenessMetric.js";
import { LicenseMetric } from "./LicenseMetric.js";
import { NPMData } from "./NPMData.js";
import { Metrics } from "./Metrics.js";
import { Logger } from "./logger.js";

const logger = new Logger();

export class NetScore extends Metrics {
  private correctnessMetric: CorrectnessMetric;
  private busFactorMetric: BusFactorMetric;
  private responsivenessMetric: ResponsivenessMetric;
  private rampUpMetric: RampUpMetric;
  private licenseMetric: LicenseMetric;
  private metrics: [
    correctness: { score: number, latency: number },
    responsiveness: { score: number, latency: number },
    rampUp: { score: number, latency: number },
    busFactor: { score: number, latency: number },
    license: { score: number, latency: number },
  ] | null = null;

  constructor(githubData: GitHubData, npmData: NPMData) {
    super(githubData, npmData);
    this.correctnessMetric = new CorrectnessMetric(githubData, npmData);
    this.responsivenessMetric = new ResponsivenessMetric(githubData, npmData);
    this.rampUpMetric = new RampUpMetric(githubData, npmData);
    this.busFactorMetric = new BusFactorMetric(githubData, npmData);
    this.licenseMetric = new LicenseMetric(githubData, npmData);
    logger.log(1, "NetScore instance created with provided GitHub and NPM data.");
  }

  public async calculateScore(): Promise<number> {
    logger.log(1, "Calculating NetScore...");

    // Calculate all metrics in parallel using Promise.all
    const metricResults = await Promise.all([
      this.correctnessMetric.calculateLatency(),
      this.responsivenessMetric.calculateLatency(),
      this.rampUpMetric.calculateLatency(),
      this.busFactorMetric.calculateLatency(),
      this.licenseMetric.calculateLatency()
    ]);

    const [correctness, responsiveness, rampUp, busFactor, license] = metricResults;
    this.metrics = metricResults;

    logger.log(1, `Metrics calculated: 
      Correctness: ${correctness.score}, 
      Responsiveness: ${responsiveness.score}, 
      Ramp-Up: ${rampUp.score}, 
      Bus Factor: ${busFactor.score}, 
      License: ${license.score}`);

    // Calculate NetScore based on the stored metric results
    const netScore = 
      0.2 * rampUp.score + 
      0.2 * correctness.score + 
      0.2 * busFactor.score + 
      0.2 * responsiveness.score + 
      0.2 * license.score;

    logger.log(1, `NetScore calculated: ${netScore}`);
    return netScore;
  }

  public getMetricResults(): [
    correctness: { score: number, latency: number },
    responsiveness: { score: number, latency: number },
    rampUp: { score: number, latency: number },
    busFactor: { score: number, latency: number },
    license: { score: number, latency: number },
  ] | null {
    logger.log(1, "Retrieving stored metric results.");
    return this.metrics;
  }

  public async calculateLatency(): Promise<{ score: number; latency: number }> {
    logger.log(1, "Calculating latency for NetScore computation...");
    const start = performance.now();
    const score = await this.calculateScore();
    const end = performance.now();
    const latency = end - start;
    logger.log(1, `NetScore calculation completed with latency: ${latency} ms`);
    return { score, latency };
  }
}
