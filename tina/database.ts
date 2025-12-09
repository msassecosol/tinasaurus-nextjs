
import { createDatabase, createLocalDatabase } from '@tinacms/datalayer'
import { MongodbLevel } from 'mongodb-level'
import { MyGitProvider } from './MyGitProvider'

const branch = (process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main")

const isLocal = false;// process.env.TINA_PUBLIC_IS_LOCAL === 'true'

export default isLocal
  ? createLocalDatabase()
  : createDatabase({
      gitProvider: new MyGitProvider({
          branch: 'main',
          commitMessage: 'Edited with TinaCMS',
        }),
      databaseAdapter: new MongodbLevel({
          collectionName: 'tinacms',
          dbName: 'tinacms',
          mongoUri: 'mongodb://admin:admin@localhost:27017/',
        }),
      namespace: branch,
    })
