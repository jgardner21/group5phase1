import path from 'path'
import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node'
import fs from 'fs'

export async function cloneRepoLocally(clone_url: string) {
    const dir = path.join(process.cwd(), 'cloned_repos')
    console.log(clone_url)
    git.clone({ fs, http, dir, url: clone_url }).then(console.log)
}