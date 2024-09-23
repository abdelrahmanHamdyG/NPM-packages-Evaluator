/* eslint-disable no-useless-escape */
import { readFileSync, writeFileSync } from "fs";
import { GitHubAPI } from "./GitHubAPI.js";
import { NpmAPI } from "./NpmAPI.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";
import { Logger } from "./logger.js";
import fs from "fs/promises";
import { NetScore } from "./NetScore.js";

const logger = new Logger();

export class CLI {
  
  // running the test suites
  public testSuites(): void {
    logger.log(1, "starting test suites...");
    
    // reading the raw test-results file
    const rawData = readFileSync("testResults.json", "utf-8");

    // filtering out non-json lines and keeping only the relevant ones
    const cleanedData = rawData.split("\n").filter(line => {
        // keeping lines that start with '{' or end with '}', which are parts of the json data
        return line.trim().startsWith("{") || line.trim().endsWith("}");
    }).join("\n");

    // writing the cleaned data into a new file without parsing
    writeFileSync("cleanTestResults.json", cleanedData);
    
    // reading cleantestresults.json and coverage-summary.json files
    const testResults = JSON.parse(readFileSync("cleanTestResults.json", "utf-8"));
    const coverageSummary = JSON.parse(readFileSync("coverage/coverage-summary.json", "utf-8"));

    // extracting test summary
    const totalTests = testResults.numTotalTests;
    const passedTests = testResults.numPassedTests;

    // extracting coverage summary
    const lineCoverage = coverageSummary.total.lines.pct;

    // calculating coverage percentage
    const coveragePercentage = lineCoverage.toFixed(2); // percentage of lines covered

    // logging the results
    console.log(
    `${passedTests}/${totalTests} test cases passed. ${coveragePercentage} line coverage achieved.`); 
   
    logger.log(1, "test suites completed.");
  }

  // reading from a file and returning an array of urls
  private async readFromFile(path: string): Promise<Array<string>> {
    logger.log(2, `attempting to read from file: ${path}`);
    try {
      const data = await fs.readFile(path, "utf8");

      // splitting the content by new lines and trimming each line
      const urls: Array<string> = data.split("\n").map((v) => v.trim());
      
      // removing the last element if it is an empty string
      if(urls[urls.length-1]===""||urls[urls.length-1].length<=2){
        urls.pop();
      }
      logger.log(2, `successfully read ${urls.length} urls from file.`);
      return urls;
    } catch (err) {
      logger.log(1, `error reading from file ${path}: ${err}`);
      return [];
    }
  }

  // ranking the modules by reading the urls from a file
  public rankModules(path: string): void {
    logger.log(1, `starting to rank modules from path: ${path}`);

    // ranking the modules together and then processing the results
    this.rankModulesTogether(path)
      .then(async (results) => {
        logger.log(1, "the data fetched for each url:");

        const urls=await this.readFromFile(path);
        // looping through results and processing each module
        for (const [index, { npmData, githubData }] of results.entries()) {
          logger.log(1, `processing result ${index + 1}:`);

          // printing npm data if available
          if (npmData) {
            npmData.printMyData();
          } 

          // printing github data if available
          if (githubData) {
            githubData.printMyData();
          } 

          // calculating netscore if both github and npm data are available
          if (githubData && npmData) {
            const netScoreClass = new NetScore(githubData, npmData);
            const net = await netScoreClass.calculateLatency();
            const metrics = netScoreClass.getMetricResults();
            if (metrics) {
              const [correctness, responsiveness, rampUp, busFactor, license] =
                metrics;
              
              // formatting the result into a readable format
              const formattedResult = {
                URL: urls[index],
                NetScore :Number(net.score.toFixed(3)) ,
                NetScore_Latency: Number((net.latency / 1000).toFixed(3)), // convert to number
                RampUp: Number(rampUp.score.toFixed(3)),
                RampUp_Latency: Number((rampUp.latency / 1000).toFixed(3)), // convert to number
                Correctness: Number(correctness.score.toFixed(3)),
                Correctness_Latency: Number((correctness.latency / 1000).toFixed(3)), // convert to number
                BusFactor: Number(busFactor.score.toFixed(3)),
                BusFactor_Latency: Number((busFactor.latency / 1000).toFixed(3)), // convert to number
                ResponsiveMaintainer: Number(responsiveness.score.toFixed(3)),
                ResponsiveMaintainer_Latency: Number((responsiveness.latency / 1000).toFixed(3)), // convert to number
                License: Number(license.score.toFixed(3)),
                License_Latency: Number((license.latency / 1000).toFixed(3)) // convert to number
            };
            
              // logging the result
              if(githubData.name!=="empty"){
                console.log(JSON.stringify(formattedResult));
              }else{
                console.log(
                { URL: urls[index], error: "github repo doesn't exist" }
                );              
              }
            }
          }
        }
      })
      .catch((error) => {
        logger.log(1, `error in rankmodules: ${error}`);
      });
  }

  // ranking modules by fetching both github and npm data
  public async rankModulesTogether(
    path: string
  ): Promise<{ npmData: void | NPMData; githubData: void | GitHubData}[]> {

    try {
      // reading urls from the file
      const urls = await this.readFromFile(path);

      const promisesArray = [];
      
      // looping through each url to fetch the data
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        let gitUrl = "empty";
        let npmUrl = "empty";

        // checking whether the url is a github or npm url
        if (url[8] === "g") {
          gitUrl = url;
        } else {
          npmUrl = url;
        }

        // fetching both data and adding the promise to the array
        const data = this.fetchBothData(npmUrl, gitUrl);
        promisesArray.push(data);
      }

      // resolving all promises
      const results = await Promise.all(promisesArray);
      return results;
    } catch (err) {
      logger.log(1, `error in rankmodulestogether: ${err}`);
      return [];
    }
  }

  // fetching both npm and github data based on the provided urls
  public async fetchBothData(
    npmUrl: string,
    githubUrl: string
  ): Promise<{ npmData: void | NPMData; githubData: void | GitHubData }> {

    let npmData = new NPMData();
    let githubData = new GitHubData();
    
    // fetching github data if the github url is not empty
    if (githubUrl !== "empty") {
      const githubObject = this.parseGitHubUrl(githubUrl);
      const gitHubAPI = new GitHubAPI(
        githubObject.username,
        githubObject.repoName
      );

      githubData = await gitHubAPI.fetchData();

      return { npmData, githubData };
    } else {
      // fetching npm data if the github url is empty
      const npmObject = this.parseNpmPackageUrl(npmUrl);

      const npmAPI = new NpmAPI(npmObject);

      npmData = await npmAPI.fetchData();

      // if the npm data contains a github url, fetching the github data as well
      if (npmData.githubUrl && npmData.githubUrl !== "empty") {
        const githubObject = this.parseGitHubUrl(npmData.githubUrl);

        const gitHubAPI = new GitHubAPI(
          githubObject.username,
          githubObject.repoName
        );
        githubData = await gitHubAPI.fetchData();
      } 
      return { npmData, githubData };
    }
  }

  // parsing the github url and extracting the username and repository name
  private parseGitHubUrl(url: string): { username: string; repoName: string } {
    const regex = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)/;

    // applying the regex to the provided url
    const match = url.match(regex);

    if (match) {
      // extracting username and repository name from the match
      const [, username, repoName] = match;
      return { username, repoName };
    } else {
      // returning empty values if the url does not match the expected pattern
      return { username: "empty", repoName: "empty" };
    }
  }

  // parsing the npm package url and extracting the package name
  private parseNpmPackageUrl(url: string): string {
    const regex = /https:\/\/www\.npmjs\.com\/package\/([^\/]+)/;

    // applying the regex to the provided url
    const match = url.match(regex);

    // if a match is found, returning the package name, otherwise returning "empty"
    if (match) {
      const packageName = match[1];
      return packageName;
    } else {
      return "empty";
    }
  }
}
