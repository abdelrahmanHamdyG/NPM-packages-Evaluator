import { GitHubAPI } from "./GitHubAPI.js";
import { NpmAPI } from "./NpmAPI.js";
import {GitHubData } from "./GitHubData.js";
import {NPMData } from "./NPMData.js";
import {Logger} from "./logger.js";




const logger=new Logger();

export class CLI {
    public testSuites(): void {
        
        logger.log(1,"we started testing now");
    }
    
    public rankModules(path: string): void {
        logger.log(2,"rankModulesFunction is called and the path is " + path);

        const gitHubAPI=new GitHubAPI("abdelrahmanHamdyG","ECE-46100-Project-");
        const npmAPI=new NpmAPI("even");
        
        npmAPI.fetchData().then(
            (res: void | NPMData) => {
                if (res) {
                    console.log("This is NPM data:\n");
                    logger.log(1,"data come from the npm "+res);
                    console.log(res);
                }
            }
        ).catch(error => {
            logger.log(1,"Error fetching GitHub repository data");
            logger.log(2,error);
        });



        gitHubAPI.fetchData().then(
            (res: void | GitHubData) => {
                if (res) {
                    logger.log(1,"data come from the GitHub API "+res);
                    console.log(res);
                }
            }
        ).catch(error => {
            logger.log(1,"Error fetching GitHub repository data");
            logger.log(2,error);
        });

        
    }
}
