import path from 'path'
import git from 'isomorphic-git'
import os from 'os'
import http from 'isomorphic-git/http/node'
import fs from 'fs'

export async function cloneRepoLocally(clone_url: string, git_name: string) {
    const temp_dir = path.join(os.tmpdir(), git_name) //Get temp directory for apps
    console.log(temp_dir)
    //console.log(clone_url)

    await git.clone({ fs, http, dir: temp_dir, url: clone_url, onMessage: console.log })
    const pkg_file = path.join(temp_dir, 'package.json')
    fs.readFile(pkg_file, 'utf8', (err, data) => {
        if(err) {
            return console.error(err)
        }
        else {
            console.log(data)
        }
    })
    //Can't figure this out, for now just manually copied a repo into there and will set up lic with that

    //Assume this value would be the path to where the git repo now exists, which would require replacing "pokemon" with the actual package name
    //const repo_path = path.join(temp_dir, 'pokemon')
}