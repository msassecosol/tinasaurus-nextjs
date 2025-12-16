import { AsyncLocalStorage } from 'async_hooks';

export const requestContext = new AsyncLocalStorage<{ useInfo: { email: string } }>({ name: 'userInfo' });
