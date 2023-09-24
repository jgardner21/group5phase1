import fs from 'fs';
import path from 'path'
import logger from '../../logger';

export class RampUpCalculator {

    private clone_path: string;

    constructor(clone_path: string) {
        //This never uses the API
        //Everything in here is got via the cloned API
        this.clone_path = clone_path;
    }

    scanReadme(): Object {

        const dir_contents = fs.readdirSync(this.clone_path) //Reads the directory contents and returns a list of filenames


        const readme_file = dir_contents.find((file) => { //Looks for a filename matching one of the 4 below, these were the most common formats I could find
            return (file.toLowerCase() === "readme.md" || file.toLowerCase() === "readme.markdown" || file.toLowerCase() === "readme.txt" || file.toLowerCase() === "readme")
        });

        if(readme_file) { //If one is found

            const readme_contents: string = fs.readFileSync(path.join(this.clone_path, readme_file), 'utf8') //Get README contents
            const readme_length = readme_contents.length //Get readme length in characters (in lines would technically be better but its no big deal)
            logger.debug(`Found README with length ${readme_file}`)
            const hasDocs = this.scanForDocumentation(readme_contents) //Use readme contents to scan for documentation

            //Idea is that a relatively shorter README is fine with external documentation
            
            return { "readmeLength": readme_length, "docScore": hasDocs}; //Return both values at once
        }
        else {
            logger.error("Unable to find README file for Ramp-Up score, assuming score of 0")
            return { "readmeScore": -1, "docScore": -1};
        }
    }

    //Gonna call this once I've already extracted the readme contents
    scanForDocumentation(readme_contents: string) {
        //Scans the readme for any hyperlinks to external documentation
        //Does this by looking for hyperlinks with docs/documentation/wiki in the URL or in the displayed text
        //Not perfect, sometimes misses documentation and has a few false positives but its not too frequent

        const doc_regex = /\[(.*?)\]\((.*?)\)/gi //Regex that matches a hyperlink (denoted by brackets) and a URL that comes after the brackets
        const matches = readme_contents.match(doc_regex);
        var hasDocumentation = 0; //0 by default

        if(matches) {  //If any valid links exist
            matches.forEach((match) => {
                if (match.toLowerCase().includes('documentation') || match.toLowerCase().includes('docs') || match.toLowerCase().includes('wiki')) {
                    //If there's a documentation link, set it to one
                    logger.debug(`Found external documentation link: ${match}`)
                    hasDocumentation = 1
                }
            })
        }
        return hasDocumentation;
    }

    //Dont think this is possible
    
    // numFunctionsExported(packageJSON: any) {
    //     if(packageJSON.hasOwnProperty("main")) {
    //         var main_file = packageJSON.main
    //     }

    //     // const relative_path = path.relative('./', path.join(this.clone_path, main_file))
    //     //Require only accepts relative paths so in order to get module exports via require, we need to do this to get the absolute path to the main file
        
    //     try {
    //         require(path.join(this.clone_path, main_file))
    //     }

    //     catch (err) {
    //         console.log(err)
    //         throw err
    //     }
    

    //     // console.log(typeof(pkg_exports))
        
    //     return 0;
    // }

    numOfDependancies(packageJSON: any) {
        //Gets the number of dependencies of the package from the package.json file
        if(packageJSON.hasOwnProperty("dependencies")) {
            logger.debug(`Found ${Object.keys(packageJSON.dependencies).length} dependancies for package ${packageJSON.name}`)
            return Object.keys(packageJSON.dependencies).length;
        }
        else {
            logger.debug(`Did not find any dependancies for package ${packageJSON.name}`)
            return 0
        }

    }

    calcRampUpScore(readmeLength: number, hasExtDocumentation: number, numDependancies: number): number {
        // console.log(`Readme length: ${readmeLength}`)
        // console.log(`Has documentation: ${hasExtDocumentation}`)
        // console.log(`Num of dependancies: ${numDependancies}`)

        //More dependencies = functionality of the code is more complex
        //No matter what, we will make this decrease ramp-up somewhat
        //However, the amount it decreases it by is dependant on the readme length or precense of documentation


        var difficulty;
        if(hasExtDocumentation) {
            //We just assume documentation explains things well so readme length isn't really relevant
            //All that matters from here is the complexity of the package itself
            //We're going to assume that because trained engineers are using this,
            //It should be pretty easy for them to understand a package with sufficient documentation

            difficulty = numDependancies / 1500
        }
        else {
            //Assume that functionality gets exponentially more complicated as more dependencies are needed
            //The + 15 basically just makes it so that packages with 0 dependancies dont just get a free pass regardless of their documentation quality
            difficulty = (numDependancies + 15)**2 / readmeLength

        }

        if(difficulty > 1) {
            difficulty = 1
        }
        if(difficulty < 0.005) {
            difficulty = 0
            //Makes it possible to get a 1 without having 0 dependencies
        }

        logger.info("Successfully calculated ramp-up score")
        return 1 - difficulty;
    }
}
