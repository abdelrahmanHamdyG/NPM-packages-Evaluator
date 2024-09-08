import { Octokit } from "octokit";
import dotenv from "dotenv";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";
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
    
    const response = await fetch(url);
    const data = await response.json();
    const metadata = data?.collected?.metadata;
     
    
    return new NPMData(metadata.license,metadata.repository.url);

  } catch (error) {
    console.error("Error fetching data:", error);
  }
  };



