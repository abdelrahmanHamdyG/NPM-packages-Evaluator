// LicenseMetric.ts
import { Metrics } from "./Metrics.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";
import { Logger } from "./logger.js";

const logger = new Logger();

export class LicenseMetric extends Metrics {
  compatibleLicenses = [
    // GNU General Public License v2
    "GNU General Public License v2 (GPL-2.0)",
    "GPL-2.0",
    "GPL 2.0",
    "GPLv2",
    "GNU GPL v2",
    "GNU GPL 2.0",

    // GNU General Public License v3
    "GNU General Public License v3 (GPL-3.0)",
    "GPL-3.0",
    "GPL 3.0",
    "GPLv3",
    "GNU GPL v3",
    "GNU GPL 3.0",

    // MIT License
    "MIT",
    "MIT License",
    "Massachusetts Institute of Technology License",

    // BSD License (2-Clause)
    "BSD License (2-Clause)",
    "BSD 2-Clause",
    "BSD-2-Clause",
    "BSD Simplified License",
    "BSD FreeBSD License",

    // BSD License (3-Clause)
    "BSD License (3-Clause)",
    "BSD 3-Clause",
    "BSD-3-Clause",
    "New BSD License",
    "BSD Modified License",

    // Apache License 1.1
    "Apache License 1.1",
    "Apache 1.1",
    "Apache License, Version 1.1",

    // Zlib License
    "Zlib License",
    "zlib/libpng License",
    "zlib",

    // X11 License
    "X11 License",
    "MIT/X11 License",
    "X11",
    "X11-style License",

    // Public Domain
    "Public Domain",
    "Unlicense",
    "CC0"
  ];

  partialCompatibility = [
    // Mozilla Public License 2.0
    "Mozilla Public License 2.0",
    "MPL 2.0",
    "MPL-2.0",

    // GNU Lesser General Public License (LGPL)
    "GNU Lesser General Public License (LGPL)",
    "LGPL",
    "LGPL-2.1",
    "LGPL-3.0",
    "Lesser General Public License",
    "GNU LGPL 2.1",
    "GNU LGPL 3.0",

    // Eclipse Public License
    "Eclipse Public License",
    "EPL",
    "EPL-1.0",
    "EPL-2.0",

    // Creative Commons Attribution License
    "Creative Commons Attribution License",
    "CC Attribution 4.0",
    "CC-BY 4.0",
    "CC-BY",
    "CC Attribution",
    "CC-BY 3.0"
  ];

  constructor(githubData: GitHubData, npmData: NPMData) {
    super(githubData, npmData);
    logger.log(1, "LicenseMetric instance created.");
  }

  public async calculateScore(): Promise<number> {
    logger.log(1, "Calculating license compatibility score...");

    let repoLicense = this.githubData.license ?? "";
    logger.log(1, `Initial GitHub license: ${repoLicense}`);

    // If the GitHub license is not in compatibleLicenses or partialCompatibility,
    // assign the NPM license
    if (
      !this.compatibleLicenses.includes(repoLicense) &&
      !this.partialCompatibility.includes(repoLicense)
    ) {
      repoLicense = this.npmData.license ?? "";
      logger.log(1, `GitHub license not compatible; using NPM license: ${repoLicense}`);
    }

    // Full compatibility check
    if (this.compatibleLicenses.includes(repoLicense)) {
      logger.log(1, `License ${repoLicense} is fully compatible.`);
      return 1; // Fully compatible
    }

    // Partial compatibility check
    if (this.partialCompatibility.includes(repoLicense)) {
      logger.log(1, `License ${repoLicense} is partially compatible.`);
      return 0.5; // Return partial score
    }

    logger.log(1, `License ${repoLicense} is incompatible.`);
    return 0; // Incompatible
  }

  public async calculateLatency(): Promise<{ score: number; latency: number }> {
    logger.log(1, "Calculating latency for license score calculation...");
    const start = performance.now();
    const score = await this.calculateScore();
    const end = performance.now();
    const latency = end - start;

    logger.log(1, `Calculated score: ${score}, Latency: ${latency} ms`);
    return { score, latency };
  }
}