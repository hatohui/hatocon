import { auth } from "@/auth";
import userRepository from "@/repositories/user_repository";
import { NextResponse } from "next/server";

const GET = async () => {
  const session = await auth();
  const user = await userRepository.getUserById(session?.user.id || "");

  return NextResponse.json(
    {
      message: "OK",
      user,
    },
    { status: 200 },
  );
};

export { GET };
