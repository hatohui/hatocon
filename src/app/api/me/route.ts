import { auth } from "@/auth";
import { BadRequest, OK, Unauthorized } from "@/common/response";
import { db } from "@/config/prisma";
import userRepository from "@/repositories/user_repository";
import zod from "zod";

const profileUpdateSchema = zod.object({
  name: zod.string().min(1).optional(),
  username: zod
    .string()
    .regex(/^[a-zA-Z0-9_]+$/)
    .min(3)
    .max(20)
    .optional(),
  image: zod.string().url().nullable().optional(),
  country: zod.enum(["VN", "SG"]).optional(),
});

const GET = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    return Unauthorized();
  }

  const user = await userRepository.getUserById(session.user.id);
  const withPassword = await db.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });

  return OK({ ...user, hasPassword: !!withPassword?.password });
};

const PUT = async (req: Request) => {
  const session = await auth();

  if (!session?.user?.id) {
    return Unauthorized();
  }

  const data = await req.json();
  const result = profileUpdateSchema.safeParse(data);

  if (!result.success) {
    return BadRequest(result.error.issues.map((i) => i.message).join(", "));
  }

  if (result.data.username) {
    const taken = await db.user.findFirst({
      where: { username: result.data.username, NOT: { id: session.user.id } },
    });
    if (taken) {
      return BadRequest("Username is already taken.");
    }
  }

  const updated = await userRepository.updateUser(session.user.id, result.data);

  return OK(updated);
};

export { GET, PUT };
