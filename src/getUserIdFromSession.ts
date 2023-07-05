import GoogleProvider from 'next-auth/providers/google';
import {
  getServerSession,
  NextAuthOptions,
} from "next-auth";
import { NextApiRequest, NextApiResponse } from "next";

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account && profile) {
        token.accessToken = account.access_token
        token.id = profile.id
      }
      return token
    },
    async session({ session, token, user }) {
      session.user.id = token.id
      return session
    }
  },
}

async function getUserIdFromSession(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user.id) {
    res.status(401).send({ error: "Not logged in!" });
    return null;
  }
  const userId = session.user.id;
  return userId;
}

export { getUserIdFromSession };