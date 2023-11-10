import fs from 'fs'

export default function checkEnvFile() {
    //Check env file is formatted properly
    //And all values are valid

    if(!(process.env.hasOwnProperty("GITHUB_TOKEN"))) {
        throw new Error("No GITHUB_TOKEN variable found in .env file")
    }
    else if(!process.env.GITHUB_TOKEN?.startsWith("ghp_")) {
        throw new Error("Invalid GitHub token detected, please check .env file and enter a valid token")
    }
    if(!(process.env.hasOwnProperty("LOG_FILE"))) {
        throw new Error("No LOG_FILE variable found in .env file")
    }
    else if(!fs.existsSync(process.env.LOG_FILE!)) {
        throw new Error(`Invalid LOG_FILE path detected: '${process.env.LOG_FILE}'.`);
    }
}
