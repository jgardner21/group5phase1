import { GithubAPIService } from './git_API_call';
//var lcc = require('license-compatibility-checker')

export class LicenseCalculator {
    private githubAPI: GithubAPIService;
    private repo_obj: any;
    private clone_path: string;

    constructor(githubAPI: GithubAPIService, repo_obj: any, clone_path: string) {
        this.githubAPI = githubAPI;
        this.repo_obj = repo_obj;
        this.clone_path = clone_path;
    }

    // fetchLicenseScore(): number {
    //     const licenseScore = this.processLicenseScore(this.githubAPI.fetchLicense());
    //     const overallLicenseScore = this.calculateOverallScore(licenseScore);
    //     return overallLicenseScore;
    // }

    getPkgLicense(packageJSON: any): string {

        //Plan:
        //Check the repo object
        //If its not in there, clone it and check the package.json
        //If that doesn't work either MAYBE try to find a license file in the repo
        //Or just give up
    
        var pkg_license: string;
        //console.log(this.repo_obj.license)
        if(packageJSON.hasOwnProperty('license')) {
            pkg_license = packageJSON.license
        }

        else if(this.repo_obj.license != null && this.repo_obj.license.spdx_id != 'NOASSERTION') {
            pkg_license = this.repo_obj.license.spdx_id;
        }
        else {
            console.log("Failed to find valid license")
            return ''
        }

        console.log(pkg_license)
        return pkg_license;
    }

    checkCompatability(pkg_license: string): number {
        //Checks compability between our license and the pkg license

        //SPDI index for all compatible licenses
        //I THINK this is all of them based on google searching, it said that sometimes apache was compatible but not everywhere said that? It's very confusing
        //These are based off the following diagram that a lot of people cited in various forum posts: https://en.wikipedia.org/wiki/License_compatibility#/media/File:Floss-license-slide-image.svg
        const compatible_licenses = ['MIT', 'BSD-3-Clause', 'Apache-2.0', 'MPL-2.0', 'LGPL-2.1-only', 'LGPL-2.1-or-later']


        
        

        return 1;
    }
}
