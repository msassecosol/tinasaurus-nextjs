import type { GitProvider } from '@tinacms/graphql'
import simpleGit, { SimpleGit } from 'simple-git'
import * as fs from 'fs'
import * as path from 'path'

export interface MyGitProviderOptions {
  rootPath?: string
  commitMessage?: string
  branch?: string
}

export class MyGitProvider implements GitProvider {
  private git: SimpleGit
  private commitMessage: string
  private branch: string
  private rootPath: string

  constructor(options: MyGitProviderOptions = {}) {
    this.rootPath = options.rootPath || process.cwd()
    console.log('MyGitProvider constructor called with rootPath:', this.rootPath)
    this.commitMessage = options.commitMessage || 'Edited with TinaCMS'
    this.branch = options.branch || 'main'
    this.git = simpleGit(this.rootPath)
  }

  async onPut(key: string, value: string) {
    console.log('MyGitProvider onPut called for key:', key)
    
    // Ensure we're on the correct branch
    await this.git.checkout(this.branch)
    
    // Write the file content to disk (TinaCMS passes the content in value)
    const filePath = path.join(this.rootPath, key)
    const dirPath = path.dirname(filePath)
    
    // Ensure directory exists
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
    
    // Write the file
    fs.writeFileSync(filePath, value, 'utf-8')
    console.log('File written to:', filePath)
    
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
    
    // Delete the file from filesystem
    const filePath = path.join(this.rootPath, key)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    
    // Remove the file from git
    await this.git.add(key) // Stage the deletion
    
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