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

        const start = performance.now();
        try {
            this.logger.log(1, `Fetching GitHub data for repo: ${this.owner}/${this.repoName}`);

            // Initialize API requests
            const reposRequest = octokit.request("GET /repos/{owner}/{repo}", {
                owner: this.owner,
                repo: this.repoName,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            });

            const commitsRequest = octokit.request("GET /repos/{owner}/{repo}/commits", {
                owner: this.owner,
                repo: this.repoName,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            });

            this.logger.log(2, "Fetching issues and contributors...");
            const issuesRequest = this.fetchIssues(octokit);
            const contributorsRequest = this.fetchContributors(octokit);

            const readmeRequest = octokit.request("GET /repos/{owner}/{repo}/readme", {
                owner: this.owner,
                repo: this.repoName,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            });

            // Wait for all data fetches to complete in parallel
            this.logger.log(2, "Waiting for all data to be fetched from the GitHub API...");
            const [reposResponse, issuesResponse, commitsResponse, 
                contributors, readmeResponse] = await Promise.all([
                reposRequest,
                issuesRequest,
                commitsRequest,
                contributorsRequest,
                readmeRequest.catch(() => null) // Handle potential readme absence
            ]);

            const closed_issues = issuesResponse.closedIssues;
            const openIssues = issuesResponse.openIssues;

            // Process contributors data
            this.logger.log(2, `Processing contributor data for repo: ${this.repoName}`);
            const totalContributions = 
            (contributors as Contributor[]).map((contributor: Contributor) => ({
                contributor: contributor.login,
                commits: contributor.contributions
            }));

            const readmeFound = !!readmeResponse;
            const descriptionFound = !!reposResponse.data.description;
            const license = reposResponse.data.license ? reposResponse.data.license.name : "empty";

            const end = performance.now();
            const latency = end - start;

            this.logger.log(1, `Successfully fetched and processed data for repo: 
                ${this.owner}/${this.repoName}`);
            this.logger.log(2, `Latency for data fetch: ${latency} ms`);

            return new GitHubData(
                this.generateRepoUrl(this.owner, this.repoName),
                reposResponse.data.name,
                closed_issues.length,
                commitsResponse.data.length,
                reposResponse.data.forks_count,
                reposResponse.data.stargazers_count,
                reposResponse.data.collaborators_url.length,
                readmeFound,
                descriptionFound,
                totalContributions,
                license,
                closed_issues,
                reposResponse.data.size,
                openIssues,
                latency
            );
        } catch (error) {
            this.logger.log(1, `Error fetching data for repo 
                ${this.owner}/${this.repoName}: ${error}`);
            return new GitHubData(); // Return empty data on error
        }
    }

    // Fetch issues with pagination
    private async fetchIssues(octokit: Octokit): 
    Promise<{ closedIssues: Issue[], openIssues: Issue[] }> {
        const closedIssues: Issue[] = [];
        const openIssues: Issue[] = [];
        let page = 1;
        const perPage = 100;
        let moreIssues = true;

        const currentDate = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(currentDate.getMonth() - 3);

        this.logger.log(2, `Fetching closed issues since ${threeMonthsAgo.toISOString()}...`);

        // Fetch closed issues
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
                since: threeMonthsAgo.toISOString()
            });

            const fetchedIssues = issuesResponse.data as Issue[];
            if (fetchedIssues.length === 0) {
                moreIssues = false;
                this.logger.log(2, `No more closed issues found on page ${page}.`);
            } else {
                closedIssues.push(...fetchedIssues);
                this.logger.log(2, `Fetched ${fetchedIssues.length}
                     closed issues from page ${page}.`);
                page++;
            }
        }

        // Reset page counter and fetch open issues
        page = 1;
        moreIssues = true;

        this.logger.log(2, "Fetching open issues...");
        while (moreIssues) {
            const issuesResponse = await octokit.request("GET /repos/{owner}/{repo}/issues", {
                owner: this.owner,
                repo: this.repoName,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                },
                page: page,
                per_page: perPage,
                state: "open",
                since: threeMonthsAgo.toISOString()
            });

            const fetchedIssues = issuesResponse.data as Issue[];
            if (fetchedIssues.length === 0) {
                moreIssues = false;
                this.logger.log(2, `No more open issues found on page ${page}.`);
            } else {
                openIssues.push(...fetchedIssues);
                this.logger.log(2, `Fetched ${fetchedIssues.length} open 
                    issues from page ${page}.`);
                page++;
            }
        }

        return { closedIssues, openIssues };
    }

    // Fetch contributors with pagination
    private async fetchContributors(octokit: Octokit): Promise<Contributor[]> {
        const contributors: Contributor[] = [];
        let page = 1;
        const perPage = 50;
        let moreContributors = true;

        this.logger.log(2, "Fetching contributors...");

        while (moreContributors) {
            const contributorsResponse = await 
            octokit.request("GET /repos/{owner}/{repo}/contributors", {
                owner: this.owner,
                repo: this.repoName,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28"
                },
                page: page,
                per_page: perPage
            });

            const fetchedContributors = contributorsResponse.data as Contributor[];
            if (fetchedContributors.length === 0) {
                moreContributors = false;
                this.logger.log(2, `No more contributors found on page ${page}.`);
            } else {
                contributors.push(...fetchedContributors);
                this.logger.log(2, `Fetched ${fetchedContributors.length} 
                    contributors from page ${page}.`);
                page++;
            }
        }

        return contributors;
    }

    public generateRepoUrl(username: string, repoName: string): string {
        if (!username.trim() || !repoName.trim()) {
            this.logger.log(1, "Invalid username or repository name provided.");
            throw new Error("Username and repository name cannot be empty.");
        }

        const repoUrl = `https://github.com/${username}/${repoName}`;
        this.logger.log(2, `Generated repository URL: ${repoUrl}`);
        return repoUrl;
    }
}
