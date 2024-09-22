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
    }

    private async readFromFile(path: string): Promise<Array<string>> {
        try {
            logger.log(1, `Reading data from file: ${path}`);
            const data = await fs.readFile(path, "utf8");
            const lines: Array<string> = data.split("\n");

            lines.forEach((v, i, arr) => {
                arr[i] = v.trim();
            });

            logger.log(1, `Successfully read ${lines.length} lines from file: ${path}`);
            return lines;
        } catch (err) {
            logger.log(2, `Error reading from file: ${path}. Error: ${err}`);
            return [];
        }
    }

    public rankModules(path: string): void {
        logger.log(1, `Starting module ranking process using file: ${path}`);
        this.rankModulesTogether(path)
            .then(async results => {
                logger.log(1, "Processing fetched data for each module...");

                // Loop through results and process each module
                for (const [index, { npmData, githubData }] of results.entries()) {
                    logger.log(1, `Processing result ${index + 1}:`);

                    if (npmData) npmData.printMyData();
                    if (githubData) githubData.printMyData();

                    logger.log(1, "Calculating net score...");
                    if (githubData && npmData) {
                        const netScoreClass = new NetScore(githubData, npmData);
                        const net = await netScoreClass.calculateLatency();
                        const metrics = netScoreClass.getMetricResults();

                        if (metrics) {
                            const [correctness, responsiveness, 
                                rampUp, busFactor, license] = metrics;
                            logger.log(1, `Correctness Score: 
                                ${correctness.score}, Latency: 
                                ${(correctness.latency / 1000).toFixed(3)} sec`);
                            logger.log(1, `Responsiveness Score: 
                                ${responsiveness.score}, Latency: 
                                ${(responsiveness.latency / 1000).toFixed(3)} sec`);
                            logger.log(1, `Ramp-Up Score: 
                                ${rampUp.score}, Latency: 
                                ${(rampUp.latency / 1000).toFixed(3)} sec`);
                            logger.log(1, `Bus Factor Score: 
                                ${busFactor.score}, Latency: 
                                ${(busFactor.latency / 1000).toFixed(3)} sec`);
                            logger.log(1, `License Score: 
                                ${license.score}, Latency: 
                                ${(license.latency / 1000).toFixed(3)} sec`);
                            logger.log(1, `Net Score: 
                                ${net.score}, Latency: ${(net.latency / 1000).toFixed(3)} sec`);
                        }
                    }
                }
            })
            .catch(error => {
                logger.log(2, `Error during module ranking: ${error}`);
            });
    }

    public async rankModulesTogether(path: string): 
    Promise<{ npmData: void | NPMData, githubData: void | GitHubData }[]> {
        logger.log(1, `Starting to rank modules from file: ${path}`);
        try {
            const urls = await this.readFromFile(path);
            logger.log(1, `Found ${urls.length} URLs to process.`);
            
            const promisesArray = [];

            for (let i = 0; i < urls.length; i++) {
                let gitUrl = "empty";
                let npmUrl = "empty";

                if (urls[i][8] === "g") {
                    gitUrl = urls[i];
                } else {
                    npmUrl = urls[i];
                }

                logger.log(1, `Processing URL ${i + 1}: GitHub URL = 
                    ${gitUrl}, NPM URL = ${npmUrl}`);
                const data = this.fetchBothData(npmUrl, gitUrl);
                promisesArray.push(data);
            }

            const result = await Promise.all(promisesArray);
            logger.log(1, "Successfully fetched data for all modules.");
            return result;
        } catch (err) {
            logger.log(2, `Error while ranking modules: ${err}`);
            return [];
        }
    }

    public async fetchBothData(npmUrl: string, githubUrl: string): 
    Promise<{ npmData: void | NPMData, githubData: void | GitHubData }> {
        logger.log(1, `Fetching data for NPM URL: ${npmUrl}, GitHub URL: ${githubUrl}`);

        let npmData = new NPMData();
        let githubData = new GitHubData();

        if (githubUrl !== "empty") {
            const githubObject = this.parseGitHubUrl(githubUrl);
            logger.log(1, `GitHub data: Username = 
                ${githubObject.username}, Repo = ${githubObject.repoName}`);

            const gitHubAPI = new GitHubAPI(githubObject.username, githubObject.repoName);
            githubData = await gitHubAPI.fetchData();

            return { npmData, githubData };
        } else {
            const npmObject = this.parseNpmPackageUrl(npmUrl);
            logger.log(1, `NPM package: ${npmObject}`);

            const npmAPI = new NpmAPI(npmObject);
            npmData = await npmAPI.fetchData();

            logger.log(1, `Fetched NPM data for package: ${npmObject}`);

            if (npmData.githubUrl && npmData.githubUrl !== "empty") {
                const githubObject = this.parseGitHubUrl(npmData.githubUrl);
                logger.log(1, `GitHub URL from NPM package: ${npmData.githubUrl}`);

                const gitHubAPI = new GitHubAPI(githubObject.username, githubObject.repoName);
                githubData = await gitHubAPI.fetchData();
            }

            return { npmData, githubData };
        }
    }

    private parseGitHubUrl(url: string): { username: string, repoName: string } {
        logger.log(1, `Parsing GitHub URL: ${url}`);

        const regex = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)/;
        const match = url.match(regex);

        if (match) {
            const [, username, repoName] = match;
            return { username, repoName };
        } else {
            logger.log(2, `GitHub URL parsing failed: ${url}`);
            return { username: "empty", repoName: "empty" };
        }
    }

    private parseNpmPackageUrl(url: string): string {
        logger.log(1, `Parsing NPM package URL: ${url}`);

        const regex = /https:\/\/www\.npmjs\.com\/package\/([^\/]+)/;
        const match = url.match(regex);

        return match ? match[1] : "empty";
    }
}
