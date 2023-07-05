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
    session: async ({ session, token, user }) => {
      if (session?.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
}

async function getUserIdFromSession(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    res.status(401).send({ error: "Not logged in!" });
    return null;
  }
  const userId = session.user.id;
  return userId;
}

export { getUserIdFromSession };