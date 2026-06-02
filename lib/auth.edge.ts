import NextAuth from "next-auth";

export const { auth } = NextAuth({
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
