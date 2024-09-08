
import {fetchRepoData} from "./API_fetch.js";

interface  RepoData {
    name?: string;
}

  fetchRepoData("abdelrahmanHamdyG", "ECE-46100-Project-").then(
    (res:void | JSON) =>
    {
    if (res){
    const res_obj= res as RepoData ;
    
    const res_info: RepoData = {
        name: res_obj.name,
    };
    console.log(res_info.name);
    }
    });

import {CLI} from "./CLI";


const args=process.argv.slice(2);
const mode=args[0];



const cli=new CLI();

switch(mode){

    case "install":
        cli.installDependencies();
        break;
    case "test":
        cli.testSuites();
        break;
    default:
        cli.rankModules(mode);

       
};





