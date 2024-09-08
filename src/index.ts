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




