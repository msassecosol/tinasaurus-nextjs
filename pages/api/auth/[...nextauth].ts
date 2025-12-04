import NextAuth from "next-auth";
import { TinaUserCollection, authOptions } from "tinacms-authjs/dist/tinacms";

export const UserCollection = TinaUserCollection;

export default NextAuth(authOptions);
