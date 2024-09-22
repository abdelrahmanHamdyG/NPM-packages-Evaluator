// CLI.ts
/* eslint-disable no-useless-escape */
import { GitHubAPI } from "./GitHubAPI.js";
import { NpmAPI } from "./NpmAPI.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";
import { Logger } from "./logger.js";
import fs from "fs/promises";
import { NetScore } from "./NetScore.js";

const logger = new Logger();

export class CLI {
  public testSuites(): void {
    logger.log(1, "Starting test suites...");
    // Implement test suites logic here
    logger.log(1, "Test suites completed.");
  }

  private async readFromFile(path: string): Promise<Array<string>> {
    logger.log(2, `Attempting to read from file: ${path}`);
    try {
      const data = await fs.readFile(path, "utf8");

      const urls: Array<string> = data.split("\n").map((v) => v.trim());
      logger.log(2, `Successfully read ${urls.length} URLs from file.`);
      return urls;
    } catch (err) {
      logger.log(1, `Error reading from file ${path}: ${err}`);
      return [];
    }
  }

  public rankModules(path: string): void {
    logger.log(1, `Starting to rank modules from path: ${path}`);
    this.rankModulesTogether(path)
      .then(async (results) => {
        logger.log(1, "The data fetched for each URL:");

        // Loop through results and process each module
        for (const [index, { npmData, githubData }] of results.entries()) {
          logger.log(1, `Processing result ${index + 1}:`);
          logger.log(2, `npm delay: ${(npmData?.latency || 0) / 1000}s`);
          logger.log(2, `github delay: ${(githubData?.latency || 0) / 1000}s`);

          if (npmData) {
            logger.log(2, "NPM Data:");
            npmData.printMyData();
          } else {
            logger.log(1, "No NPM data available.");
          }

          logger.log(1, "\n**************************\n");

          if (githubData) {
            logger.log(2, "GitHub Data:");
            githubData.printMyData();
          } else {
            logger.log(1, "No GitHub data available.");
          }

          logger.log(1, "\n**************************\n");

          if (githubData && npmData) {
            const netScoreClass = new NetScore(githubData, npmData);
            const net = await netScoreClass.calculateLatency();
            const metrics = netScoreClass.getMetricResults();
            if (metrics) {
              const [correctness, responsiveness, rampUp, busFactor, license] =
                metrics;
              logger.log(1, "Calculated Metrics:");
              logger.log(
                1,
                `Correctness Score: ${correctness.score}, Latency: ${
                  correctness.latency / 1000
                }s`
              );
              logger.log(
                1,
                `Responsiveness Score: ${responsiveness.score}, Latency: ${
                  responsiveness.latency / 1000
                }s`
              );
              logger.log(
                1,
                `Ramp-Up Score: ${rampUp.score}, Latency: ${
                  rampUp.latency / 1000
                }s`
              );
              logger.log(
                1,
                `Bus Factor Score: ${busFactor.score}, Latency: ${
                  busFactor.latency / 1000
                }s`
              );
              logger.log(
                1,
                `License Score: ${license.score}, Latency: ${
                  license.latency / 1000
                }s`
              );

              logger.log(
                1,
                `Net Score: ${net.score}, Latency: ${net.latency / 1000}s`
              );
            } else {
              logger.log(1, "No metrics available.");
            }
            logger.log(1, "\n**************************\n");
          }
        }
        logger.log(1, "Completed ranking modules.");
      })
      .catch((error) => {
        logger.log(1, `Error in rankModules: ${error}`);
      });
  }

  public async rankModulesTogether(
    path: string
  ): Promise<{ npmData: void | NPMData; githubData: void | GitHubData }[]> {
    logger.log(2, `rankModulesTogether is called with path: ${path}`);

    try {
      const urls = await this.readFromFile(path);
      logger.log(2, `Processing ${urls.length} URLs.`);

      const promisesArray = [];
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        let gitUrl = "empty";
        let npmUrl = "empty";

        if (url[8] === "g") {
          gitUrl = url;
        } else {
          npmUrl = url;
        }

        logger.log(
          2,
          `URL ${i + 1}: ${url}, GitHub URL: ${gitUrl}, NPM URL: ${npmUrl}`
        );
        const data = this.fetchBothData(npmUrl, gitUrl);
        promisesArray.push(data);
      }

      const results = await Promise.all(promisesArray);
      logger.log(2, "Successfully fetched data for all URLs.");
      return results;
    } catch (err) {
      logger.log(1, `Error in rankModulesTogether: ${err}`);
      return [];
    }
  }

  public async fetchBothData(
    npmUrl: string,
    githubUrl: string
  ): Promise<{ npmData: void | NPMData; githubData: void | GitHubData }> {
    logger.log(
      2,
      `Fetching data for npmUrl: ${npmUrl}, githubUrl: ${githubUrl}`
    );

    let npmData = new NPMData();
    let githubData = new GitHubData();
    if (githubUrl !== "empty") {
      const githubObject = this.parseGitHubUrl(githubUrl);
      logger.log(
        2,
        `Parsed GitHub URL - Username: ${githubObject.username}, Repo: ${githubObject.repoName}`
      );
      const gitHubAPI = new GitHubAPI(
        githubObject.username,
        githubObject.repoName
      );

      logger.log(
        2,
        `Fetching GitHub data for ${githubObject.username}/${githubObject.repoName}`
      );

      githubData = await gitHubAPI.fetchData();
      logger.log(
        2,
        `Fetched GitHub data for ${githubObject.username}/${githubObject.repoName}`
      );

      return { npmData, githubData };
    } else {
      const npmObject = this.parseNpmPackageUrl(npmUrl);
      logger.log(2, `Parsed NPM package name: ${npmObject}`);

      const npmAPI = new NpmAPI(npmObject);
      logger.log(2, `Fetching NPM data for package: ${npmObject}`);

      npmData = await npmAPI.fetchData();
      logger.log(2, `Fetched NPM data for package: ${npmObject}`);

      if (npmData.githubUrl && npmData.githubUrl !== "empty") {
        const githubObject = this.parseGitHubUrl(npmData.githubUrl);
        logger.log(
          2,
          // eslint-disable-next-line max-len
          `Extracted GitHub URL from NPM data - Username: ${githubObject.username}, Repo: ${githubObject.repoName}`
        );

        const gitHubAPI = new GitHubAPI(
          githubObject.username,
          githubObject.repoName
        );
        logger.log(
          2,
          `Fetching GitHub data for ${githubObject.username}/${githubObject.repoName}`
        );

        githubData = await gitHubAPI.fetchData();
        logger.log(
          2,
          `Fetched GitHub data for ${githubObject.username}/${githubObject.repoName}`
        );
      } else {
        logger.log(
          1,
          `No GitHub URL found in NPM data for package: ${npmObject}`
        );
      }
      return { npmData, githubData };
    }
  }

  private parseGitHubUrl(url: string): { username: string; repoName: string } {
    logger.log(2, `Parsing GitHub URL: ${url}`);
    const regex = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)/;

    // Apply the regex to the provided URL
    const match = url.match(regex);

    if (match) {
      // Extract username and repository name from the match
      const [, username, repoName] = match;
      logger.log(2, `Parsed GitHub username: ${username}, repoName: ${repoName}`);
      return { username, repoName };
    } else {
      // Return empty values if the URL does not match the expected pattern
      logger.log(1, `Failed to parse GitHub URL: ${url}`);
      return { username: "empty", repoName: "empty" };
    }
  }

  private parseNpmPackageUrl(url: string): string {
    logger.log(2, `Parsing NPM package URL: ${url}`);
    const regex = /https:\/\/www\.npmjs\.com\/package\/([^\/]+)/;

    // Apply the regex to the provided URL
    const match = url.match(regex);

    // If a match is found, return the package name, otherwise return "empty"
    if (match) {
      const packageName = match[1];
      logger.log(2, `Parsed NPM package name: ${packageName}`);
      return packageName;
    } else {
      logger.log(1, `Failed to parse NPM package URL: ${url}`);
      return "empty";
    }
  }
}
