//The following dependancies need to be vendored with the software

import { Command } from "commander";

const program = new Command();

program
    .version("0.0.1")
    .description("Trustworthy in-house CLI designed for ACME Corp.")
    .command("install", "Install all dependancies for package manager")
    .command("test", "Run test suite on codebase")

program
    .version("0.0.1")
    .argument("<filename>", "Absolute file path of ASCII-encoded, newline delimited package URLs")
    .description("Parse package URLs and provide metric scores for each package")
    .action((filename: string) => {
        //open filename
        console.log("Success")
    })