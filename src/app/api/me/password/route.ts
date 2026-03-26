import { auth } from "@/auth";
import { BadRequest, OK, Unauthorized } from "@/common/response";
import { db } from "@/config/prisma";
import bcrypt from "bcryptjs";
import zod from "zod";

const schema = zod
  .object({
    currentPassword: zod.string().min(1),
    newPassword: zod
      .string()
      .min(8)
      .max(20)
      .regex(/(?=.*[a-z])/, "Must contain a lowercase letter")
      .regex(/(?=.*[A-Z])/, "Must contain an uppercase letter")
      .regex(/(?=.*\d)/, "Must contain a number")
      .regex(/(?=.*[@$!%*?&])/, "Must contain a special character"),
    confirmPassword: zod.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const POST = async (req: Request) => {
  const session = await auth();

  if (!session?.user?.id) {
    return Unauthorized();
  }

  const data = await req.json();
  const result = schema.safeParse(data);

  if (!result.success) {
    return BadRequest(result.error.issues.map((i) => i.message).join(", "));
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });

  if (!user?.password) {
    return BadRequest(
      "Password change is not available for accounts signed in with a provider.",
    );
  }

  const valid = await bcrypt.compare(
    result.data.currentPassword,
    user.password,
  );

  if (!valid) {
    return BadRequest("Current password is incorrect.");
  }

  const hashed = await bcrypt.hash(result.data.newPassword, 12);
  await db.user.update({
    where: { id: session.user.id },
    data: { password: hashed },
  });

  return OK(null);
};

export { POST };
