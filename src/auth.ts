import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/config/prisma";
import { authConfig } from "@/config/auth.config";

const adapter = {
  ...PrismaAdapter(db),
  createUser: async (
    user: Parameters<ReturnType<typeof PrismaAdapter>["createUser"] & {}>[0],
  ) => {
    const emailBase = user.email
      .split("@")[0]
      .replace(/[^a-z0-9_]/gi, "")
      .toLowerCase();
    return db.user.create({
      data: {
        name: user.name ?? emailBase,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        username: `${emailBase}_${Math.random().toString(36).slice(2, 6)}`,
      },
    });
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter,
  session: { strategy: "jwt" },
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return user;
      },
    }),
  ],
});
