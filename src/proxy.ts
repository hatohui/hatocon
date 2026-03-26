import NextAuth from "next-auth";
import { authConfig } from "@/config/auth.config";

const { auth } = NextAuth(authConfig);

export { auth as proxy };

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon\\.ico).*)"],
};
