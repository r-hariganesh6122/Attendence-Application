import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        mobile: { label: "Mobile", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.mobile || !credentials?.password) {
          throw new Error("Missing mobile or password");
        }

        const user = await prisma.user.findFirst({
          where: { mobile: credentials.mobile },
        });

        if (!user) {
          throw new Error("User not found");
        }

        // Only allow admin/teacher login
        if (user.role !== "admin" && user.role !== "teacher") {
          throw new Error("Login not allowed for your role");
        }

        // Check password using bcrypt (supports both hashed and plaintext for migration)
        let passwordMatch = false;

        // Try hashed password first (after migration)
        if (user.passwordHash) {
          passwordMatch = await bcrypt.compare(
            credentials.password,
            user.passwordHash,
          );
        } else if (user.password) {
          // Fallback to plaintext comparison (during migration)
          passwordMatch = user.password === credentials.password;

          // If plaintext match succeeds, hash it immediately
          if (passwordMatch) {
            const hashedPassword = await bcrypt.hash(credentials.password, 10);
            await prisma.user.update({
              where: { id: user.id },
              data: { passwordHash: hashedPassword },
            });
          }
        }

        if (!passwordMatch) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id.toString(),
          email: user.mobile,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.name = token.name;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
