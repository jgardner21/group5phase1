import path from 'path'
import git from 'isomorphic-git'
import os from 'os'
import http from 'isomorphic-git/http/node'
import fs from 'fs'

export async function cloneRepoLocally(clone_url: string, git_name: string) {
    const temp_dir = path.join(os.tmpdir(), git_name) //Get temp directory for apps

    await git.clone({ fs, http, dir: temp_dir, url: clone_url })


    return temp_dir

}

export function getPackageJSONFromClone(filepath: string) {
    const pkg_file = path.join(filepath, 'package.json')
    const pkg_json_str: string = fs.readFileSync(pkg_file, 'utf8')
    return JSON.parse(pkg_json_str)
}

// export function getLicenseFromClone(filepath: string): string {
//     const pkg_file = path.join(filepath, 'package.json')
//     const pkg_json_str: string = fs.readFileSync(pkg_file, 'utf8')
//     const pkg_json = JSON.parse(pkg_json_str)


//     if(pkg_json.hasOwnProperty('license')) {
//         return pkg_json.license
//     }
//     else {
//         return '';
//     }
// }

// export function getMainFromClone(filepath: string): string {
//     const pkg_file = path.join(filepath, 'package.json')
//     const pkg_json_str: string = fs.readFileSync(pkg_file, 'utf8')
//     const pkg_json = JSON.parse(pkg_json_str)


//     if(pkg_json.hasOwnProperty('license')) {
//         return pkg_json.license
//     }
//     else {
//         return '';
//     }

// }

// export function getDependancyCountFromClone(filepath: string): string {

    
// }

export function cleanupTempDir(filepath: string) {
    //Deletes the cloned repo in our temp folder
    try {
        if (fs.existsSync(filepath)) {
            // Remove the directory and its contents recursively
            fs.rmSync(filepath, { recursive: true });
            console.log(`Temporary directory deleted successfully.`);
          } else {
            console.log(`Temporary directory does not exist.`);
          }
    }
    catch (err) {
      console.error(`Error while deleting temporary directory: ${err}`);
    }

}