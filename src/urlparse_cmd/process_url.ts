const fs = require('fs');
const { execSync } = require('child_process')

import { GithubAPIService } from './metric_calc/git_API_call'
import { cleanupTempDir, cloneRepoLocally } from './metric_calc/local_clone';
import { MetricScores } from './metric_calc/pkg_metric';
//REALLY NEED TO MAKE THESE CONSISTANT BETWEEN IMPORT AND REQUIRE



class MetricScoreResults {
    url: string;
    api_caller!: GithubAPIService; //Exclamation mark means we guarantee the api caller is initialized at some point when it needs to be
    repo_obj!: any; //No way around it
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
            //console.log(this.repo_obj)
            return true
        }
        catch (err) {
            return false
        }

    }

    calc_net_score() {
        this.net_score = (this.license) * (this.bus_factor * 0.45 + 0.275 * (this.correctness + this.maintainer))
    }

    print_scores() {
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
    //What are naming limitations on npm packages?
    const github_regex_check = new RegExp("https://github.com/(?<owner>.+)/(?<repo>.+)")  //Matches a correctly formatted GitHub URL
    //CAN WE ASSUME ALL CORRECT LINKS WILL BE OF THESE FORMS


    
    //Step 2: Parse through each line of the file, extract URL information
    for (var i = 0; i < url_list.length; i++) { //Loop through array of URLs

        const url_metrics = new MetricScoreResults(url_list[i])

        const is_npm_link = npm_regex_check.exec(url_metrics.url); //Gets the package name from the URL
        const is_github_link = github_regex_check.exec(url_metrics.url)

        if(is_npm_link != null && is_npm_link.groups !== undefined) { //Need the type guard or TS complains at me
            
            const pkg_name = is_npm_link.groups.pkg_name; //Gets the packagename from the URL
            console.log(pkg_name)
            
            const github_fields = npm_to_github(pkg_name)

            if(github_fields != null) { //If they are null, just print out 0s and log error
                if(await url_metrics.init_api_caller(github_fields.owner, github_fields.repo)) {
                    try {
                        url_metrics.clone_path = await cloneRepoLocally(url_metrics.repo_obj.clone_url, url_metrics.repo_obj.name)
                    }
                    catch (err) {
                        throw err
                    }
                    const scores = new MetricScores(url_metrics.api_caller, url_metrics.repo_obj, url_metrics.clone_path);

                    url_metrics.bus_factor = scores.getBusFactor()
                    url_metrics.ramp_up = await scores.getRampUp()
                    url_metrics.license = await scores.getLicense()
                    url_metrics.maintainer = scores.getResponsiveness();
                    url_metrics.correctness = scores.getCorrectness();
                    url_metrics.calc_net_score()
                }
                //If statement to validate repo existance

            }        
            
        }
        else if (is_github_link != null && is_github_link.groups !== undefined) {
            const owner_name = is_github_link.groups.owner; //Gets owner name from the first URL field
            const repo_name = is_github_link.groups.repo; //Gets repo name from second URL field
            //These are the 2 things you need for a GitHub API call

            if(await url_metrics.init_api_caller(owner_name, repo_name)) {
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
            }
            //If statement to check if repo exists

        }
        else {
            
            console.log("Invalid link");
            
            //****Do we want to fully quit execution if an invalid link is in the file****
        }

        url_metrics.print_scores();
        cleanupTempDir(url_metrics.clone_path)
    }

}

function npm_to_github(pkg_name: string) {

    const npm_command = 'npm view ' + pkg_name + ' repository.url'
    try {
        var git_link = execSync(npm_command, { stdio: 'pipe' }) //Not to be confused with the regex exec, this runs the command specified on the command line
        //Stdio pipe prevents error msgs from being printed 
    }
    catch(err) {
        //console.log("npmjs package name invalid\n")
        return null;
        //If a package name is invalid, do we want to just move on to the next link?
        //What do we do if there is no GitHub repo linked
    }

    const extract_github = new RegExp('github.com/(?<owner>.+)/(?<repo>.+?)(\.git)?\n') //Need this to be less specific than the regex above

    //If its possible for reponame to not end in .git, this won't work (need to ask abt that)
    
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
        console.log("Could not find valid GitHub link for source code")
        return null;
    }


}