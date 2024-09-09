import { Octokit } from "octokit";
import dotenv from "dotenv";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";
import {Logger} from "./logger.js";




const logger=new Logger();

dotenv.config();

const env: NodeJS.ProcessEnv = process.env;


export async function fetchRepoData(
    owner: string,
    name: string
): Promise<void | GitHubData> {
    try {
        const octokit = new Octokit({
            auth: env.GITHUB_TOKEN
        });

        logger.log(1,"we are fetching the data from github API");
        logger.log(2,"we are in the fetchRepoData with parameters owner:"+
            owner+" repo name="+name);

        // Fetch repository data
        const reposResponse = 
        await octokit.request("GET /repos/{owner}/{repo}", {
            owner: owner,
            repo: name,
            headers: {
                "X-GitHub-Api-Version": "2022-11-28"
            }
        });

        // Fetch issues
        const issuesResponse = 
        await octokit.request("GET /repos/{owner}/{repo}/issues", {
            owner: owner,
            repo: name,
            headers: {
                "X-GitHub-Api-Version": "2022-11-28"
            }
        });

        // Fetch commits
        const commitsResponse =
         await octokit.request("GET /repos/{owner}/{repo}/commits", {
            owner: owner,
            repo: name,
            headers: {
                "X-GitHub-Api-Version": "2022-11-28"
            }
        });

        // Return desired information
        logger.log(2,
            "succussfully returning the data fetched from Github API");
        return new GitHubData(reposResponse.data.name
          , issuesResponse.data.length,
            commitsResponse.data.length);
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}



  export async function fetchNpmPackageData
  (packageName : string): Promise <void | NPMData> {
    const url = `https://api.npms.io/v2/package/${packageName}`;

  try {
    
    logger.log(1,"we are fetching the data from NPM ");
    logger.log(2,"we are in the fetchNpmPackageData for package:"+packageName);
    const response = await fetch(url);
    const data = await response.json();
    const metadata = data?.collected?.metadata;
     
    
    logger.log(2,
        "succussfully returning the data fetched from Github API");
   
    return new NPMData(metadata.license,metadata.repository.url);

  } catch (error) {
    console.error("Error fetching data:", error);
  }
  };



