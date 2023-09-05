#!/usr/bin/node
//This allows the file to be run as a command line script without specifying node

//The following dependancies need to be vendored with the software

import { Command } from "commander";
import get_metric_scores from "./urlparse_cmd/process_url";
import begin_tests from "./test_cmd/test_cmd";
import install_dependancies from "./install_cmd/install";

const program = new Command();

program
    .version("0.0.1")
    .command("install")
    .description("Install all dependancies for package manager")
    .action(() => {

        install_dependancies()

    });

program
    .version("0.0.1")
    .command("test")
    .description("Run test suite on codebase")
    .action(() => {

        begin_tests()
        
    });

program
    .version("0.0.1")
    .argument("<filename>", "Absolute file path of ASCII-encoded, newline delimited package URLs")
    .description("Parse package URLs and provide metric scores for each package")
    .action((filename: string) => {

        get_metric_scores(filename);

    });

program.parse();

//Currently, I can manually delete the file extension off of the run.js extention to make commands work as ./run <command>, but there has to be a better way of doing that