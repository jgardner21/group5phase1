#!/usr/bin/env node
//This allows the file to be run as a command line script without specifying node

//The following dependancies need to be vendored with the software

import { Command } from "commander";

const program = new Command();

program
    .version("0.0.1")
    .command("install")
    .description("Install all dependancies for package manager")
    .action(() => {
      
        console.log("Install success");
    });

program
    .version("0.0.1")
    .command("test")
    .description("Run test suite on codebase")
    .action(() => {
        console.log("Test success");
    });

program
    .version("0.0.1")
    .argument("<filename>", "Absolute file path of ASCII-encoded, newline delimited package URLs")
    .description("Parse package URLs and provide metric scores for each package")
    .action((filename) => {
        //open filename
        if(filename.charAt(0) != "/") {
            console.log("Invalid file path, input must be an absolute file location")
        }
        else {
            console.log(`Parse success with filename ${filename}`);
        }

    });

program.parse();