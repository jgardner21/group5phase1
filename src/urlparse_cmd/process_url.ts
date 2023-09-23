const fs = require('fs');
const { execSync } = require('child_process')

import { GithubAPIService } from './metric_calc/git_API_call'
import { cleanupTempDir, cloneRepoLocally } from './metric_calc/local_clone';
import { MetricScores } from './metric_calc/pkg_metric';
//REALLY NEED TO MAKE THESE CONSISTANT BETWEEN IMPORT AND REQUIRE



class MetricScoreResults {
    //General purpose class  
    url: string; //URL parsed from file
    api_caller!: GithubAPIService; //Exclamation mark means we guarantee the api caller is initialized at some point when it needs to be
    repo_obj!: any; //Useful to have this here before passing it into other classes
    net_score: number = 0; //All scores by default 0
    ramp_up: number = 0;
    correctness: number = 0;
    bus_factor: number = 0;
    maintainer: number = 0;
    license: number = 0;
    clone_path: string = '';

    constructor (url: string) {
        this.url = url;
    }

    async init_api_caller (owner: string, repo: string): Promise<boolean> {
        this.api_caller = new GithubAPIService(owner, repo);

        //Test API is valid by gathering big repo object that well need anyways
        //Gonna use a specialized call
        try {
            this.repo_obj = await this.api_caller.fetchAPIdata('')

            //Kill 2 birds with one stone here
            //Acts as a test run to make sure we can connect to the GitHub API properly
            //And gets us the repo_obj we need to use

            console.log("Successfully connected to the GitHub API")
            //console.log(this.repo_obj)
            return true
        }
        catch (err) {
            console.error("Failed to connect to GitHub API")
            console.log(err)
            return false
        }

    }

    calc_net_score() {
        this.net_score = (this.license) * (this.bus_factor * 0.40 + 0.25 * (this.correctness + this.maintainer) + 0.1 * this.ramp_up)
    }

    print_scores() {
        //TAs advised to technically not do it like this but whatever its fine
        console.log(`{"URL":"${this.url}", "NET_SCORE":${this.net_score}, "RAMP_UP_SCORE":${this.ramp_up}, "CORRECTNESS_SCORE":${this.correctness}, "BUS_FACTOR_SCORE":${this.bus_factor}, "RESPONSIVE_MAINTAINER_SCORE":${this.maintainer}, "LICENSE_SCORE":${this.license}}`) //Not sure if doing it like this is ok?
    }
}



export default async function get_metric_scores(filename: string) {

    if(filename.charAt(0) != "/") { //Check if the input is an actual filepath
        console.error("Invalid command");
        return;
    }

    //Step 1: Open file
    try {
        var url_file = fs.readFileSync(filename);

    }
    catch (err) { 
        //Step 1.1: Verify file exists, return error if it doesn't
        console.error("Invalid file name, please provide the absolute file path of an ASCII-encoded, newline-delimited URLs");
        return;
    }

    const url_list = (url_file.toString()).split('\n'); //Get each URL as an individual string in an array

    const npm_regex_check = new RegExp("https://www.npmjs.com/package/(?<pkg_name>.+)")   //Matches a correctly formatted npmjs URL

    const github_regex_check = new RegExp("https://github.com/(?<owner>.+)/(?<repo>.+)")  //Matches a correctly formatted GitHub URL


    
    //Step 2: Parse through each line of the file, extract URL information
    for (var i = 0; i < url_list.length; i++) { //Loop through array of URLs

        const url_metrics = new MetricScoreResults(url_list[i]) //Initializes the MetricScoreResults class with the url in question

        const is_npm_link = npm_regex_check.exec(url_metrics.url);
        const is_github_link = github_regex_check.exec(url_metrics.url)
        //Gets the package name from the URL for whichever it matches

        if(is_npm_link != null && is_npm_link.groups !== undefined) { //Need the type guard or TS complains at me
            
            const pkg_name = is_npm_link.groups.pkg_name; //Gets the packagename from the URL
            //console.log(pkg_name)
            
            const github_fields = npm_to_github(pkg_name) //Converts the name of the pkg gotten from the npmjs link to a github link (if we can find one)

            if(github_fields != null) { //If they are null because we couldnt find a repo, just print out 0s and log error

                if(await url_metrics.init_api_caller(github_fields.owner, github_fields.repo)) { //If the API can successfully be contacted
                    
                    try {
                        url_metrics.clone_path = await cloneRepoLocally(url_metrics.repo_obj.clone_url, url_metrics.repo_obj.name) //Clones the repo locally for analysis
                        console.log("Successfully cloned repo locally")
                    }
                    catch (err) {
                        console.error("Failed to clone repo locally")
                        throw err //DO WE STILL WANT TO CLONE THE REPO LOCALLY
                    }

                    const scores = new MetricScores(url_metrics.api_caller, url_metrics.repo_obj, url_metrics.clone_path); //Initializes the class that gets each subscore

                    //Only 2 of these actually need to be async
                    url_metrics.bus_factor = scores.getBusFactor()
                    url_metrics.ramp_up = scores.getRampUp()
                    url_metrics.license = scores.getLicense()
                    url_metrics.maintainer = scores.getResponsiveness();
                    url_metrics.correctness = scores.getCorrectness();
                    
                    //Once all 5 scores are calculated, update net score using our formula
                    //If any errors occur within the subscores, we just set them to 0
                    url_metrics.calc_net_score()
                }
            }
            else {
                console.error("Failed to find GitHub link associated with package name")
                //Don't quit here, we still want to print out every score as 0
            } 
            
        }
        else if (is_github_link != null && is_github_link.groups !== undefined) {

            const owner_name = is_github_link.groups.owner; //Gets owner name from the first URL field
            const repo_name = is_github_link.groups.repo; //Gets repo name from second URL field
            //These are the 2 things you need for a GitHub API call

            if(await url_metrics.init_api_caller(owner_name, repo_name)) { //Essentially the same as above minus a few steps
                try {
                    url_metrics.clone_path = await cloneRepoLocally(url_metrics.repo_obj.clone_url, url_metrics.repo_obj.name)
                }
                catch (err) {
                    throw err
                }
                const scores = new MetricScores(url_metrics.api_caller, url_metrics.repo_obj, url_metrics.clone_path);

                url_metrics.bus_factor = scores.getBusFactor();
                url_metrics.ramp_up = await scores.getRampUp();
                url_metrics.license = await scores.getLicense();
                url_metrics.maintainer = scores.getResponsiveness();
                url_metrics.correctness = scores.getCorrectness();
                url_metrics.calc_net_score()
            } //Error msgs printed in init_api_caller

        }
        else {
            
            console.error("Invalid link, link must be of the form https://www.npmjs.com/package/{name} or https://www.github.com/{repo}/{owner}")
            
        }

        url_metrics.print_scores(); //Prints the NDJSON
        cleanupTempDir(url_metrics.clone_path) //Deletes the cloned directory from the temp folder to prevent clutter
    }

}

function npm_to_github(pkg_name: string) {
    //Takes in a package name and gets the repo link from the package.json file
    
    const npm_command = 'npm view ' + pkg_name + ' repository.url' //npm command to view the repo url using a package name
    try {
        var git_link = execSync(npm_command, { stdio: 'pipe' }) //Not to be confused with the regex exec, this runs the command specified on the command line
        //Stdio pipe prevents error msgs from being printed
        console.log("Successfully retrieved GitHub URL from NPM LINK")
    }
    catch(err) {
        console.error("Package name invalid/not recognized by npm or didn't have a repo link in package.json")
        console.error(err)
        return null;

    }

    const extract_github = new RegExp('github.com/(?<owner>.+)/(?<repo>.+?)(\.git)?\n') //Need this to be less specific than the regex above
    //Varying formats for the repo field in the repo field make a weird regex necessary
    
    const match_github = extract_github.exec(git_link.toString())

    if(match_github != null && match_github.groups != undefined) {

        var repo_owner = match_github.groups.owner;
        var repo_name = match_github.groups.repo;
        // console.log(git_link.toString())
        // console.log(repo_owner)
        // console.log(repo_name + "\n")
        return { owner: repo_owner, repo: repo_name }
    }
    else {
        console.error("Could not find valid GitHub link for source code")
        return null;
    }


}