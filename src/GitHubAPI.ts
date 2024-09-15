import { Octokit } from "octokit";

import { GitHubData } from "./GitHubData.js";
import { API } from "./API.js";
import { Issue } from "./IssueInterface.js";
import { url } from "inspector";


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

            const issues: Issue[] = [];
            let page = 1;
            let perPage = 100;
            let moreIssues = true;

            const currentDate = new Date();

            const threeMonthsAgo = new Date(currentDate.setMonth(currentDate.getMonth() - 3)).toISOString();

            while (moreIssues) {
                const issuesResponse = await octokit.request("GET /repos/{owner}/{repo}/issues", {
                    owner: this.owner,
                    repo: this.repoName,
                    headers: {
                        "X-GitHub-Api-Version": "2022-11-28"
                    },
                    page: page,
                    per_page: perPage,
                    state: "closed",
                    since: threeMonthsAgo 
                });

                const fetchedIssues = issuesResponse.data as Issue[];

                if (fetchedIssues.length === 0) {
                    moreIssues = false;
                } else {
                    issues.push(...fetchedIssues);
                    page++;
                }
            }



            const commitsResponse = await octokit
            .request("GET /repos/{owner}/{repo}/commits", {
                owner: this.owner,
                repo: this.repoName,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            });

            const contributors = await octokit
            .request("GET /repos/{owner}/{repo}/contributors", {
                owner: this.owner,
                repo: this.repoName,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            });

            const contributionsArray: number[] = [];
            for (let i = 0; i < contributors.length; i++) {
                contributionsArray.push(contributors[i].contributions);
              }

            const readmeFound = 
            reposResponse.data.readme ? true : false;
            const descriptionFound = 
            reposResponse.data.description ? true : false;
            let license="empty";
            if(reposResponse.data.license!=null)
                license= reposResponse.data.license.name
            
// 
            
            
            
            if(this.repoName=="express"){
                
                
                 console.log(issues[0]);
            }
                
            return new GitHubData(reposResponse.data.name,
                 issues.length, commitsResponse.data.length,
                 contributionsArray,readmeFound,descriptionFound,
                 reposResponse.data.forks_count,
                 reposResponse.data.stargazers_count,
                 license,
                 issues);
        } catch (error) {
            if(error)
                this.logger.log(2, `Error fetching data: ${error} for the repo ${this.repoName}`);
        }
        return new GitHubData();
    }
}
