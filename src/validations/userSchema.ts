import { messages } from "@/common/messages";
import zod from "zod";

export const userSchema = zod.object({
  name: zod.string().min(1, messages.user.validation.nameRequired),
  email: zod.email(messages.user.validation.emailInvalid),
  password: zod
    .string()
    .min(8, messages.user.validation.passwordMin)
    .max(20, messages.user.validation.passwordMax)
    .regex(/^(?=.*[a-z])+$/, messages.user.validation.passwordLowercase)
    .regex(/^(?=.*[A-Z])+$/, messages.user.validation.passwordUppercase)
    .regex(/^(?=.*\d)+$/, messages.user.validation.passwordNumber)
    .regex(/^(?=.*[@$!%*?&])+$/, messages.user.validation.passwordSpecial),
  isAdmin: zod.boolean().optional(),
  image: zod.url(messages.user.validation.imageUrl).optional(),
  username: zod
    .string()
    .regex(/^[a-zA-Z0-9_]+$/, messages.user.validation.usernameRegex)
    .min(3, messages.user.validation.usernameMin)
    .max(20, messages.user.validation.usernameMax)
    .optional(),
});
