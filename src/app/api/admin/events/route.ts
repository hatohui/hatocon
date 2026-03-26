import { auth } from "@/auth";
import { Forbidden, OK, Unauthorized } from "@/common/response";
import eventRepository from "@/repositories/event_repository";
import type { NextRequest } from "next/server";

const GET = async (req: NextRequest) => {
  const session = await auth();

  if (!session?.user?.id) return Unauthorized();
  if (!session.user.isAdmin) return Forbidden();

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const approvedParam = searchParams.get("approved");
  const approved =
    approvedParam === "true"
      ? true
      : approvedParam === "false"
        ? false
        : undefined;

  const events = await eventRepository.getAllAdmin({ q, approved });

  return OK(events);
};

export { GET };
