import { Octokit } from "octokit";
import { GitHubData } from "./GitHubData.js";
import { API } from "./API.js";
import { Issue } from "./IssueInterface.js";
import { Contributor } from "./ContributorInterface.js";

export class GitHubAPI extends API {
    private owner: string;
    private repoName: string;

    constructor(owner: string, repoName: string) {
        super();
        this.owner = owner;
        this.repoName = repoName;
    }

    public async fetchData(): Promise<GitHubData> {
        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });

        try {
            
            this.logger.log(2,
                 `Fetching data for owner:
                  ${this.owner}, repo: ${this.repoName}`);

            // Initialize API requests
            const reposRequest = octokit.request("GET /repos/{owner}/{repo}", {
                owner: this.owner,
                repo: this.repoName,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            });

            const commitsRequest =
             octokit.request("GET /repos/{owner}/{repo}/commits", {
                owner: this.owner,
                repo: this.repoName,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            });

            // Fetch issues and contributors with pagination
            const issuesRequest = this.fetchIssues(octokit);
            const contributorsRequest = this.fetchContributors(octokit);

            const readmeRequest = 
            octokit.request("GET /repos/{owner}/{repo}/readme", {
                owner: this.owner,
                repo: this.repoName,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            });

            // Wait for all data fetches to complete in parallel
            const [reposResponse, issues, 
                commitsResponse, contributors,
                 readmeResponse] = await Promise.all([
                reposRequest,
                issuesRequest,
                commitsRequest,
                contributorsRequest,
                readmeRequest.catch(() => null)
            ]);

            // Process contributors data
            const totalContributions = (contributors as 
                Contributor[]).map((contributor: Contributor) => ({
               contributor: contributor.login,
                // totalLinesAdded: contributor.total,
                commits: contributor.contributions
            }));



            
            const readmeFound = !!readmeResponse;
            const descriptionFound = !!reposResponse.data.description;
            const license = reposResponse.data.license ? reposResponse.data
            .license.name : "empty";

            

            this.logger.log(2, "Successfully fetched data from GitHub API");
            return new 
            GitHubData(this.generateRepoUrl(this.owner,this.repoName),
                reposResponse.data.name,
                issues.length,
                commitsResponse.data.length,
                reposResponse.data.forks_count,
                reposResponse.data.stargazers_count,
                reposResponse.data.collaborators_url.length,
                readmeFound,
                descriptionFound,
                totalContributions,
                license,
                issues
            );
        } catch (error) {
            this.logger.log(2,
                 `Error fetching data: ${error} for the repo ${this.repoName}`);
            return new GitHubData(); // Return empty data on error
        }
    }

    // Fetch issues with pagination
    private async fetchIssues(octokit: Octokit): Promise<Issue[]> {
        const issues: Issue[] = [];
        let page = 1;
        const perPage = 100;
        let moreIssues = true;

        const currentDate = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(currentDate.getMonth() - 3);

        while (moreIssues) {
            const issuesResponse = 
            await octokit.request("GET /repos/{owner}/{repo}/issues", {
                owner: this.owner,
                repo: this.repoName,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                },
                page: page,
                per_page: perPage,
                state: "closed",
                since: threeMonthsAgo.toISOString()
            });

            const fetchedIssues = issuesResponse.data as Issue[];
            if (fetchedIssues.length === 0) {
                moreIssues = false;
            } else {
                issues.push(...fetchedIssues);
                page++;
            }
        }

        return issues;
    }

    // Fetch contributors with pagination
    private async fetchContributors(octokit: Octokit): Promise<Contributor[]> {
        const contributors: Contributor[] = [];
        let page = 1;
        const perPage = 50;
        let moreContributors = true;


        while (moreContributors) {
            const contributorsResponse = 
            await octokit.request("GET /repos/{owner}/{repo}/contributors", {

                owner: this.owner,
                repo: this.repoName,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                },
                page: page,
                per_page: perPage
            });

            const fetchedContributors = 
            contributorsResponse.data as Contributor[];
            if (fetchedContributors.length === 0) {
                moreContributors = false;
            } else {
                contributors.push(...fetchedContributors);
                page++;
            }
        }

        return contributors;
    }

    public generateRepoUrl(username: string, repoName: string): string {
        // Ensure the username and repoName are trimmed and not empty
        if (!username.trim() || !repoName.trim()) {
            throw new Error("Username and repository name cannot be empty.");
        }
        // Construct the GitHub repository URL
        return `https://github.com/${username}/${repoName}`;
    }
}
