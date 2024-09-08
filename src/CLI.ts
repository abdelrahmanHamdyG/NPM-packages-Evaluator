import { fetchRepoData } from "./API_fetch.js";
import { PackageData } from "./PackageData.js";
import { exec } from "child_process";

export class CLI {


    public testSuites():void {
        console.log("we should test things here");
    }
    
    
    public rankModules(path:string):void {

        fetchRepoData("abdelrahmanHamdyG", "ECE-46100-Project-").then(
            (res:void | JSON) =>{
                if (res){
                const res_obj= res as PackageData ;
                
                const res_info: PackageData = {
                    name: res_obj.name,
                };
                console.log(res_info.name);
            }
            });
        console.log("we found the file " + path);

    }

    public installDependencies():void {
          
        exec("npm install", (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing npm install: ${error.message}`);
                return;
            }

            if (stderr) {
                console.error(`stderr: ${stderr}`);
                return;
            }

            console.log(`stdout: ${stdout}`);
        });

        console.log("installing dependencies has been called");
        
    }


}
