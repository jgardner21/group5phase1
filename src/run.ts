#!/usr/bin/node
//This allows the file to be run as a command line script without specifying node

//The following dependancies need to be vendored with the software

import { Command } from 'commander';
import get_metric_scores from './urlparse_cmd/process_url';
import begin_tests from './test_cmd/test_cmd';
import install_dependencies from './install_cmd/install';

const program = new Command();

program
    .version("0.0.1")
    .command("install") //Adds install command
    .description("Install all dependancies for package manager")
    .action(() => {

        install_dependencies() //Manage the command execution in another file

    });

program
    .version("0.0.1")
    .command("test") //Adds test command
    .description("Run test suite on codebase")
    .action(() => {

        begin_tests()
        
    });

program
    .version("0.0.1")
    .argument("<filename>", "Absolute file path of ASCII-encoded, newline delimited package URLs") //This will pick up on any command input that isnt install or test
    .description("Parse package URLs and provide metric scores for each package")
    .action((filename: string) => {
        
        get_metric_scores(filename);

    });

//Need to figure out how to exit 0 on success or non-zero on failure

program.parse();