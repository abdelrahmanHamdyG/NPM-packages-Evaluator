import { CLI } from "./CLI.js";
import { Logger } from "./logger.js";

// Create a logger instance and get the command-line arguments
const logger = new Logger();
const args = process.argv.slice(2); // Remove the first two elements (node and script name)
const mode = args[0]; // The mode is the first argument provided by the user
const cli = new CLI(); // Create a CLI instance

// Log the start of the script
logger.log(1, "\n\n\n********************************************\n\n\n");
logger.log(2, `Script started with mode: ${mode}`);

// Switch case to handle different modes
switch (mode) {
    case "test":
        // If mode is "test", run the test suites
        logger.log(1, "We are running the tests now.");
        cli.testSuites(); // Execute the test suites
        logger.log(2, "Test suites execution finished.");
        break;

    default: {
        // If no test mode, check if the LOG_FILE environment variable is set
        if(!process.env.LOG_FILE){
            process.exit(1); // If LOG_FILE is not set, exit the process
        }
        
        // Log that we are going to rank modules
        logger.log(1, "We are going to rank the modules now.");
        logger.log(2, `Rank modules is called with parameter = ${mode}`);

        cli.rankModules(mode); // Call rankModules method with the provided mode

        logger.log(1, "Ranking of modules completed."); // Log the completion of module ranking
    }
    break;
}

// Log the end of the script
logger.log(2, "Script execution finished.");
logger.log(1, "\n\n\n********************************************\n\n\n");
