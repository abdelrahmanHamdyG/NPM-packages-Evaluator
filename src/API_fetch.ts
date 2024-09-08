//import { Octokit } from "octokit";
// import dotenv from "dotenv";
// dotenv.config();

//const env: NodeJS.ProcessEnv = process.env;

export async function fetchRepoData(
    owner: string,
    name: string,

): Promise <void | JSON> {

    try {
       
        const octokit = new Octokit({
            auth: env.GITHUB_TOKEN
        });
        

      const response =  await octokit.request("GET /repos/{owner}/{repo}", {
        owner: owner,
        repo: name,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28"
        }
      });
      return response.data as JSON;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };


  export async function fetchNpmPackageData
  (packageName : string): Promise <void | JSON> {
    const url = `https://api.npms.io/v2/package/${packageName}`;

  try {
    console.log("we are here");
    const response = await fetch(url);
    const data = await response.json();
    console.log("this is the data returned from the npm \n"+data);
    const repository = data?.collected?.metadata?.repository;
    console.log(repository);
    
    return data;

  } catch (error) {
    console.error("Error fetching data:", error);
  }
  };



