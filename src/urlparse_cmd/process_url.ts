const fs = require('fs');
const { execSync } = require('child_process')
//REALLY NEED TO MAKE THESE CONSISTANT BETWEEN IMPORT AND REQUIRE

export default function get_metric_scores(filename: string) {

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

    const npm_regex_check = new RegExp("https://www.npmjs.com/package/(?<pkg_name>[a-z\-]+)")   //Matches a correctly formatted npmjs URL
    //What are naming limitations on npm packages?
    const github_regex_check = new RegExp("https://github.com/(?<owner>.+)/(?<repo>.+)")  //Matches a correctly formatted GitHub URL
    //CAN WE ASSUME ALL CORRECT LINKS WILL BE OF THESE FORMS


    
    //Step 2: Parse through each line of the file, extract URL information
    for (var i = 0; i < url_list.length; i++) { //Loop through array of URLs

        console.log(url_list[i]);

        const is_npm_link = npm_regex_check.exec(url_list[i]); //Gets the package name from the URL
        const is_github_link = github_regex_check.exec(url_list[i])

        if(is_npm_link != null && is_npm_link.groups !== undefined) { //Need the type guard or TS complains at me
            
            const pkg_name = is_npm_link.groups.pkg_name; //Gets the packagename from the URL
            console.log(pkg_name)
            
            const github_fields = npm_to_github(pkg_name)

            // if(github_fields != null) {
            //     //metric_scoring_function(github_fields.owner, github_fields.repo)
            // }
        }
        else if (is_github_link != null && is_github_link.groups !== undefined) {
            const owner_name = is_github_link.groups.owner; //Gets owner name from the first URL field
            const repo_name = is_github_link.groups.repo; //Gets repo name from second URL field
            //These are the 2 things you need for a GitHub API call

            console.log(owner_name);
            console.log(repo_name);
            //metric_scoring_function(owner_name, repo_name)
            //Not defined yet, but will recieve the owner name and repo name as parameters

            //SHOULD WE BE PRINTING IN HERE OR WITHIN THE METRIC SCORING FUNCTION

            //SHOULD WE BE VALIDATING THE PACKAGES EXISTANCE IN HERE?
        }
        else {
            
            console.log("Invalid link")
            
            //****Do we want to fully quit execution if an invalid link is in the file****
        }

    }


}

function npm_to_github(pkg_name: string) {

    const npm_command = 'npm view ' + pkg_name + ' repository.url'
    try {
        var git_link = execSync(npm_command, { stdio: 'pipe' }) //Not to be confused with the regex exec, this runs the command specified on the command line
        //Stdio pipe prevents error msgs from being printed 
    }
    catch(err) {
        console.log("npmjs package name invalid\n")
        return null;
        //If a package name is invalid, do we want to just move on to the next link?
        //What do we do if there is no GitHub repo linked
    }

    const extract_github = new RegExp('github.com/(?<owner>.+)/(?<repo>.+?)(.git)?\n') //Need this to be less specific than the regex above

    //If its possible for reponame to not end in .git, this won't work (need to ask abt that)
    
    const match_github = extract_github.exec(git_link.toString())

    if(match_github != null && match_github.groups != undefined) {

        var repo_owner = match_github.groups.owner;
        var repo_name = match_github.groups.repo;
        console.log(git_link.toString())
        console.log(repo_owner)
        console.log(repo_name + "\n")
        return { owner: repo_owner, repo: repo_name }
    }
    else {
        console.log("Could not find valid GitHub link for source code")
        return null;
    }


}