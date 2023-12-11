import fs from 'fs';
import { execSync } from 'child_process'
import logger from '../logger';
import { GithubAPIService } from './metric_calc/git_API_call'
import { cleanupTempDir, cloneRepoLocally } from './metric_calc/local_clone';
import { MetricScores } from './metric_calc/pkg_metric';
import { url } from 'inspector';

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
    pinned_frac: number = 0;
    reviewed_pull_frac: number = 0;
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

            logger.info(`Successfully connected to the GitHub API for ${this.url}`)

            return true
        }
        catch (err: any) {
            logger.error(`Failed to connect to GitHub API for ${this.url}`)

            if(err.status == 401) { //401 is an error code for invalid credentials
                //Specifically want to throw the errer here because
                //If the error is specifically due to a bad github token, we want to exit the entire process
                logger.error("GitHub API denied access due to bad credentials, API token invalid")
                throw err
            }

            return false
        }

    }

    calc_net_score() {
        this.net_score = (this.license) * (0.25*this.bus_factor + 0.17*(this.correctness + this.maintainer) + 0.11*this.ramp_up + 0.15*(this.pinned_frac + this.reviewed_pull_frac))
    }

    print_scores() {
        //TAs advised to technically not do it like this but whatever its fine
        //console.log(`{"URL":"${this.url}", "NET_SCORE":${parseFloat(this.net_score.toFixed(5))}, "RAMP_UP_SCORE":${parseFloat(this.ramp_up.toFixed(5))}, "CORRECTNESS_SCORE":${parseFloat(this.correctness.toFixed(5))}, "BUS_FACTOR_SCORE":${parseFloat(this.bus_factor.toFixed(5))}, "RESPONSIVE_MAINTAINER_SCORE":${parseFloat(this.maintainer.toFixed(5))}, "LICENSE_SCORE":${parseFloat(this.license.toFixed(5))}}`) //Not sure if doing it like this is ok?
    }
}



export default async function get_metric_scores(filename: string) : Promise<any> {

    // if(filename.charAt(0) != "/") { //Check if the input is an actual filepath
    //     throw new Error("Invalid command given, command must be one of ./run (install | test | URL_FILE)")
    // }
    let allScores = [];
    
    //Step 1: Open file
    try {
        var url_file = fs.readFileSync(filename);

    }
    catch (err) { 
        //Step 1.1: Verify file exists, return error if it doesn't
        throw new Error("Invalid file name, please provide the absolute file path of an ASCII-encoded, newline-delimited URLs");

    }

    const url_list = (url_file.toString()).split('\n'); //Get each URL as an individual string in an array
    if(url_list[url_list.length - 1] == '') {
        url_list.pop() //If there's a trailing entry, pop it
    }


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
            logger.debug(`Identified NPMJS package name as ${pkg_name}`)
            
            const github_fields = npm_to_github(pkg_name) //Converts the name of the pkg gotten from the npmjs link to a github link (if we can find one)


            if(github_fields != null) { //If they are null because we couldnt find a repo, just print out 0s and log error

                logger.debug(`Converted npmjs link into GitHub URL https://github.com/${github_fields.owner}/${github_fields.repo}`)
                if(await url_metrics.init_api_caller(github_fields.owner, github_fields.repo)) { //If the API can successfully be contacted
                    
                    try {
                        url_metrics.clone_path = await cloneRepoLocally(url_metrics.repo_obj.clone_url, url_metrics.repo_obj.name) //Clones the repo locally for analysis
                        logger.info(`Successfully cloned repo for ${url_list[i]} locally`)
                        logger.debug(`Repo clone located at ${url_metrics.clone_path}`)

                        
                        const scores = new MetricScores(url_metrics.api_caller, url_metrics.repo_obj, url_metrics.clone_path); //Initializes the class that gets each subscore

                        url_metrics.bus_factor = await scores.getBusFactor()
                        url_metrics.ramp_up = scores.getRampUp()
                        url_metrics.license = scores.getLicense()
                        url_metrics.maintainer = await scores.getResponsiveness();
                        url_metrics.correctness = scores.getCorrectness();
                        url_metrics.pinned_frac = await scores.getPinnedDependenciesFraction();
                        url_metrics.reviewed_pull_frac = await scores.getCodeReviewFraction();
                        
                        //Once all 5 scores are calculated, update net score using our formula
                        //If any errors occur within the subscores, we just set them to 0
                        url_metrics.calc_net_score()
                        logger.debug(`Finished calculating score for ${url_list[i]}`)

                        cleanupTempDir(url_metrics.clone_path) //Deletes the cloned directory from the temp folder to prevent clutter
                    }
                    catch (err) {
                        //If the clone fails, we still want to print all 0s
                        logger.error(`Failed to clone repo for ${url_list[i]} locally`)
                        logger.error(err)
                    }
                }
            }
            else {
                logger.error(`Failed to find GitHub link associated with package name "${pkg_name}"`)

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
                    logger.info(`Successfully cloned repo for ${url_list[i]} locally`)
                    logger.debug(`Repo clone located at ${url_metrics.clone_path}`)

                    const scores = new MetricScores(url_metrics.api_caller, url_metrics.repo_obj, url_metrics.clone_path);

                    url_metrics.bus_factor = await scores.getBusFactor();
                    url_metrics.ramp_up = scores.getRampUp();
                    url_metrics.license = scores.getLicense();
                    url_metrics.maintainer = await scores.getResponsiveness();
                    url_metrics.correctness = scores.getCorrectness();
                    url_metrics.pinned_frac = await scores.getPinnedDependenciesFraction();
                    url_metrics.reviewed_pull_frac = await scores.getCodeReviewFraction();
                    url_metrics.calc_net_score()
                    logger.debug(`Finished calculating score for ${url_list[i]}`)

                    cleanupTempDir(url_metrics.clone_path) //Deletes the cloned directory from the temp folder to prevent clutter
                }
                catch (err) {
                    logger.error(`Failed to clone repo for ${url_list[i]} locally`)
                    logger.error(err)
                }

            } //Error msgs printed in init_api_caller

        }
        else {
            logger.error("Invalid link, link must be of the form https://www.npmjs.com/package/{name} or https://www.github.com/{repo}/{owner}")
        }

        const score = {
            "URL": url_metrics.url,
            "NET_SCORE": parseFloat(url_metrics.net_score.toFixed(5)),
            "RAMP_UP_SCORE": parseFloat(url_metrics.ramp_up.toFixed(5)),
            "CORRECTNESS_SCORE": parseFloat(url_metrics.correctness.toFixed(5)),
            "BUS_FACTOR_SCORE": parseFloat(url_metrics.bus_factor.toFixed(5)),
            "RESPONSIVE_MAINTAINER_SCORE": parseFloat(url_metrics.maintainer.toFixed(5)),
            "LICENSE_SCORE": parseFloat(url_metrics.license.toFixed(5)),
            "PINNED_FRAC_SCORE": parseFloat(url_metrics.pinned_frac.toFixed(5)),
            "REVIEWED_FRAC_SCORE": parseFloat(url_metrics.reviewed_pull_frac.toFixed(5))
        };
        allScores.push(score);

    }
        //url_metrics.print_scores(); //Prints the NDJSON
     return allScores;
}

function npm_to_github(pkg_name: string) {
    //Takes in a package name and gets the repo link from the package.json file
    
    const npm_command = 'npm view ' + pkg_name + ' repository.url' //npm command to view the repo url using a package name
    try {
        var git_link = execSync(npm_command, { stdio: 'pipe' }) //Not to be confused with the regex exec, this runs the command specified on the command line
        //Stdio pipe prevents error msgs from being printed
        logger.debug(`Successfully retrieved GitHub URL ${git_link} for package ${pkg_name}`)
    }
    catch(err) {
        logger.error(`Package name ${pkg_name} not recognized by npm or doesn't have a repo link in package.json`)
        logger.error(err)
        return null;

    }

    const extract_github = new RegExp('github.com/(?<owner>.+)/(?<repo>.+?)(\.git)?\n') //Need this to be less specific than the regex above
    //Varying formats for the repo field in the repo field make a weird regex necessary
    
    const match_github = extract_github.exec(git_link.toString())

    if(match_github != null && match_github.groups != undefined) {

        var repo_owner = match_github.groups.owner;
        var repo_name = match_github.groups.repo;

        logger.debug(`Found repo = ${repo_name} and owner = ${repo_owner} for package ${pkg_name}`)
        return { owner: repo_owner, repo: repo_name }
    }
    else {
        logger.error(`Unable to parse valid GitHub link from package.json for ${pkg_name}`)
        return null;
    }
}
