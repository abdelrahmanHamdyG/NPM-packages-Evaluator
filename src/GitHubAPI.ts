import { Octokit } from "octokit";

import { GitHubData } from "./GitHubData";
import { API } from "./API";

export class GitHubAPI extends API{
    private owner: string;
    private repoName: string;

    constructor(owner: string, repoName: string) {
        super();
        this.owner = owner;
        this.repoName = repoName;
    }

    public async fetchData():  Promise<GitHubData>  {
        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });

        try {
            this.logger.log(1, "Fetching data from GitHub API");
            this.logger.log(2, 
                `Fetching data for owner: ${this.owner}, repo: 
                ${this.repoName}`);

            const reposResponse = await octokit
            .request("GET /repos/{owner}/{repo}", {
                owner: this.owner,
                repo: this.repoName,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            });

            const issuesResponse = await octokit
            .request("GET /repos/{owner}/{repo}/issues", {
                owner: this.owner,
                repo: this.repoName,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            });

            const commitsResponse = await octokit
            .request("GET /repos/{owner}/{repo}/commits", {
                owner: this.owner,
                repo: this.repoName,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            });

            this.logger.log(2, "Successfully fetched data from GitHub API");
            return new GitHubData(reposResponse.data.name,
                 issuesResponse.data.length, commitsResponse.data.length);
        } catch (error) {
            if(error)
                this.logger.log(0, `Error fetching data: ${error}`);
        }
        return new GitHubData();
    }
}
