import path from 'path'
import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node'
import fs from 'fs'

export async function cloneRepoLocally(clone_url: string) {
    const dir = path.join(process.cwd(), 'cloned_repos')
    console.log(clone_url)

    //git.clone({ fs, http, dir, url: clone_url, noCheckout: true }).then(console.log)
    //Can't figure this out, for now just manually copied a repo into there and will set up lic with that

    //Assume this value would be the path to where the git repo now exists, which would require replacing "pokemon" with the actual package name
    const repo_path = path.join(dir, 'pokemon')
}