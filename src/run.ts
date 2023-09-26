#!/usr/bin/node
//This allows the file to be run as a command line script without specifying node

//The following dependancies need to be vendored with the software

require('dotenv').config()
import { Command } from 'commander';
import get_metric_scores from './urlparse_cmd/process_url';
import begin_tests from './test_cmd/test_cmd';
import logger from './logger'


const program = new Command();


/*program
    .version("0.0.1")
    .command("install") //Adds install command
    .description("Install all dependancies for package manager")
    .action(() => {
        try {
            install_dependencies() //Manage the command execution in another file
            logger.debug("Exited ./run install successfully")
            process.exitCode = 0
        }
        catch(err) {
            //Log error msg
            logger.error("Command ./run install failed")
            logger.error(err)
            process.exitCode = 1
        }
    });*/

program
    .version("0.0.1")
    .command("test") //Adds test command
    .description("Run test suite on codebase")
    .action(() => {
        try {
            begin_tests()
            logger.debug("Exited ./run test successfully")
            process.exitCode = 0
        }
        catch(err) {

            logger.error("Command ./run test failed")
            logger.error(err)
            process.exitCode = 1
        }

    });

program
    .version("0.0.1")
    .argument("<filename>", "Absolute file path of ASCII-encoded, newline delimited package URLs") //This will pick up on any command input that isnt install or test
    .description("Parse package URLs and provide metric scores for each package")
    .action(async (filename: string) => {

        try {
            await get_metric_scores(filename);
            logger.debug("Exited ./run URL_FILE successfully")
            process.exitCode = 0
        }
        catch (err) {
            logger.error("Command ./run URL_FILE failed")
            logger.error(err)
            process.exitCode = 1
        }


    });


program.parse();