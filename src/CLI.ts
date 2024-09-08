import { fetchRepoData } from "./API_fetch.js";
import { fetchNpmPackageData } from "./API_fetch.js";
import {GitHubData } from "./GitHubData.js";
import {NPMData } from "./NPMData.js";

export class CLI {
    public testSuites(): void {
        console.log("We should test things here");
    }
    
    public rankModules(path: string): void {
        console.log("Rank modules is called and the path is " + path);

        fetchNpmPackageData("even").then(
            (res: void | NPMData) => {
                if (res) {
                    console.log("This is NPM data:\n");
                    console.log(res);
                }
            }
        ).catch(error => {
            console.error("Error fetching NPM package data:", error);
        });



        fetchRepoData("abdelrahmanHamdyG", "ECE-46100-Project-").then(
            (res: void | GitHubData) => {
                if (res) {
                    console.log("This is GitHub Data:\n");
                    console.log(res);
                }
            }
        ).catch(error => {
            console.error("Error fetching GitHub repository data:", error);
        });

        
    }
}
