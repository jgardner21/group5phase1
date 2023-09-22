import fs, { read } from 'fs';
import path from 'path'
import { GithubAPIService } from './git_API_call';
import { dir } from 'console';

export class RampUpCalculator {
    private githubAPI: GithubAPIService;
    private clone_path: string;

    constructor(githubAPI: GithubAPIService, clone_path: string) {
        this.githubAPI = githubAPI;
        this.clone_path = clone_path;
    }

    //Ideas:
    //Look at actual length of readme file
    //Look for any hyperlinks to a documentation website
    //Look at the amount of functions available to use
    //Look at the number of dependancies to estimate the complexity of whats going on under the hood

    //Each returns a "score" out of 10 that goes into the final calc
    scanReadme(): Object {
        const dir_contents = fs.readdirSync(this.clone_path)


        const readme_file = dir_contents.find((file) => {
            return (file.toLowerCase() === "readme.md" || file.toLowerCase() === "readme.markdown" || file.toLowerCase() === "readme.txt" || file.toLowerCase() === "readme")
        });

        if(readme_file) { //If one is found
            const readme_contents: string = fs.readFileSync(path.join(this.clone_path, readme_file), 'utf8')
            const readme_length = readme_contents.length
            const hasDocs = this.scanForDocumentation(readme_contents)

            //Idea is that a relatively shorter README is fine with external documentation
            
            return { "readmeLength": readme_length, "docScore": hasDocs};
        }
        else {
            console.log("Unable to find README file, assuming score of 0")
            return { "readmeScore": 0, "docScore": 0};
        }

    }

    //Gonna call this once I've already extracted the readme contents, doesn't make sense to do it any other way
    scanForDocumentation(readme_contents: string) {

        const doc_regex = /\[(.*?)\]\((.*?)\)/gi //Regex that matches a hyperlink (denoted by brackets) and a URL that comes after the brackets
        const matches = readme_contents.match(doc_regex);
        var hasDocumentation = 0; //0 by default

        if(matches) {  //If any valid links exist
            matches.forEach((match) => {
                if (match.toLowerCase().includes('documentation') || match.toLowerCase().includes('docs') || match.toLowerCase().includes('wiki')) {
                    //If there's a documentation link, set it to one
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
        if(packageJSON.hasOwnProperty("dependencies")) {
            return Object.keys(packageJSON.dependencies).length;
        }
        else {
            return 0
        }

    }

    calcRampUpScore(readmeLength: number, hasExtDocumentation: number, numDependancies: number): number {
        console.log(`Readme length: ${readmeLength}`)
        console.log(`Has documentation: ${hasExtDocumentation}`)
        console.log(`Num of dependancies: ${numDependancies}`)

        //Now just need to build formulas
        
        return -1;
    }
}
