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
  private branch: string

  constructor(options: MyGitProviderOptions = {}) {
    const rootPath = options.rootPath || process.cwd()
    console.log('MyGitProvider constructor called with rootPath:', rootPath)
    this.commitMessage = options.commitMessage || 'Edited with TinaCMS'
    this.branch = 'main'
    this.git = simpleGit(rootPath)
  }

  async onPut(key: string, value: string) {
    console.log('MyGitProvider onPut called for key:', key)
    
    // Ensure we're on the correct branch
    await this.git.checkout(this.branch)
    
    // Stage the file
    await this.git.add(key)
    
    // Check if there are staged changes before committing
    const status = await this.git.status()
    if (status.staged.length > 0) {
      const result = await this.git.commit(this.commitMessage, [key])
      console.log('Commit result:', result)
    } else {
      console.log('No changes to commit for key:', key)
    }
  }

  async onDelete(key: string) {
    console.log('MyGitProvider onDelete called for key:', key)
    
    // Ensure we're on the correct branch
    await this.git.checkout(this.branch)
    
    // Remove the file from git
    await this.git.rm(key)
    
    // Check if there are staged changes before committing
    const status = await this.git.status()
    if (status.staged.length > 0) {
      const result = await this.git.commit(this.commitMessage, [key])
      console.log('Commit result:', result)
    } else {
      console.log('No changes to commit for key:', key)
    }
  }
}