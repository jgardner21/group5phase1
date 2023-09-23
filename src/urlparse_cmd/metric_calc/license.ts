
export class LicenseCalculator {
    private repo_obj: any;

    constructor(repo_obj: any) {
        this.repo_obj = repo_obj;
    }

    getPkgLicense(packageJSON: any): string {

        //Plan:
        //Check the repo object
        //If its not in there, clone it and check the package.json
        //If that doesn't work either MAYBE try to find a license file in the repo
        //Or just give up
    
        var pkg_license: string;

        if(packageJSON.hasOwnProperty('license')) {
            pkg_license = packageJSON.license
            console.log("Successfully retrieved license from the package.json file")
        }

        else if(this.repo_obj.license != null && this.repo_obj.license.spdx_id != 'NOASSERTION') {
            //GitHub is very inconsistant with actually having licenses
            pkg_license = this.repo_obj.license.spdx_id;
            console.log("Successfully retrieved license from the GitHub API")
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
        //These are based off the following diagram that seemed to be the most commonly cited: https://en.wikipedia.org/wiki/License_compatibility#/media/File:Floss-license-slide-image.svg
        const compatible_licenses = ['MIT', 'BSD-3-Clause', 'Apache-2.0', 'MPL-2.0', 'LGPL-2.1-only', 'LGPL-2.1-or-later']
        
        console.log("Successfully calculated license score")
        if(compatible_licenses.includes(pkg_license)) {
            return 1;
        }
        else {
            return 0;
        }

    }
}
