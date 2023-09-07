const fs = require('fs');

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

    const npm_regex_check = new RegExp("^https://www.npmjs.com/package/(?<pkgname>[a-z\-]+)")   //Matches a correctly formatted npmjs URL
    const github_regex_check = new RegExp("^https://www.github.com/(?<owner>[a-z\-]+)/(?<repo>[a-z\-]+)")  //Matches a correctly formatted GitHub URL
    //CAN WE ASSUME ALL CORRECT LINKS WILL BE OF THESE FORMS


    
    //Step 2: Parse through each line of the file, extract URL information
    for (var i = 0; i < url_list.length; i++) { //Loop through array of URLs

        console.log(url_list[i]);

        const is_npm_link = npm_regex_check.exec(url_list[i]); //Gets the package name from the URL
        const is_github_link = github_regex_check.exec(url_list[i])

        if(is_npm_link != null) {
            const pkg_name = is_npm_link[1]; //Gets the packagename from the URL
            npm_to_github(pkg_name)
        }
        else if (is_github_link != null) {
            const owner_name = is_github_link[1]; //Gets owner name from the first URL field
            const repo_name = is_github_link[2]; //Gets repo name from second URL field
            //These are the 2 things you need for a GitHub API call

            //metric_scoring_function(owner_name, repo_name)
            //Not defined yet, but will recieve the owner name and repo name as parameters
        }
        else {
            console.log("Invalid link")
        }

    }


        //Step 2.1: Return error if file has improper formatting

        //****Do we want to fully quit execution if a non-npmjs or GitHub link is in the file****

        //Step 2.2: Determine if link is npmjs or GitHub

            //Step 2.2.1: If GitHub, just pass along owner and repo fields to metric_calc function

            //Step 2.2.2: If npmjs, need to try at get GitHub link. If we can, proceed to 2.2.1, otherwise return the abbreviated scores and an error msg

}

function npm_to_github(pkg_name: string) {

}