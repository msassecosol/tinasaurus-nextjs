import type { GitProvider } from '@tinacms/graphql'
import simpleGit, { SimpleGit } from 'simple-git'

export interface MyGitProviderOptions {
  rootPath?: string
  commitMessage?: string
  branch?: string
}

export class MyGitProvider implements GitProvider {
  private git: SimpleGit
  private commitMessage: string

  constructor(options: MyGitProviderOptions = {}) {
    const rootPath = options.rootPath || process.cwd()
    this.commitMessage = options.commitMessage || 'Edited with TinaCMS'
    this.git = simpleGit(rootPath)
  }

  async onPut(key: string, value: string) {
    // Stage and commit the file (file is already written by TinaCMS)
    await this.git.add(key)
    await this.git.commit(this.commitMessage, [key])
  }

  async onDelete(key: string) {
    // Remove the file from git and commit
    await this.git.rm(key)
    await this.git.commit(this.commitMessage, [key])
  }
}