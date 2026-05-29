import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

if (!process.env.NEXTAUTH_SECRET && process.env.AUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = process.env.AUTH_SECRET;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'E-posta', type: 'email', placeholder: 'admin@ersurer.com' },
        password: { label: 'Şifre', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
        const allowedEmails = adminEmailsEnv
          .split(',')
          .map(email => email.trim().toLowerCase());

        const emailLower = credentials.email.toLowerCase();
        const isAllowedEmail = allowedEmails.includes(emailLower);

        const passwordHash = process.env.ADMIN_PASSWORD_HASH;

        if (!isAllowedEmail || !passwordHash) {
          return null;
        }

        // Compare using bcrypt
        const isValidPassword = bcrypt.compareSync(credentials.password, passwordHash);

        if (isValidPassword) {
          return {
            id: 'admin-id',
            name: 'Resul Ersürer Admin',
            email: emailLower,
          };
        }

        return null;
      }
    })
  ],
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 1 day session
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-dev-only'
};
