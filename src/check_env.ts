import fs from 'fs'

export default function checkEnvFile() {
    //Check env file is formatted properly
    //And all values are valid

    if(!(process.env.hasOwnProperty("GITHUB_TOKEN"))) {
        throw new Error("No GITHUB_TOKEN variable found in .env file")
    }

    if(!(process.env.hasOwnProperty("LOG_FILE"))) {
        throw new Error("No LOG_FILE variable found in .env file")
    }
    else if(!fs.existsSync(process.env.LOG_FILE!)) {
        throw new Error("Invalid log file path, unable to resolve")
    }
}
