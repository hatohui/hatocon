import { auth } from "@/auth";
import { BadRequest, OK, Unauthorized } from "@/common/response";
import { r2 } from "@/config/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 200 * 1024;

const POST = async (req: Request) => {
  const session = await auth();

  if (!session?.user?.id) {
    return Unauthorized();
  }

  const { contentType, contentLength } = await req.json();

  if (!ALLOWED_TYPES.includes(contentType)) {
    return BadRequest("Unsupported file type. Use JPEG, PNG, or WebP.");
  }

  if (contentLength && contentLength > MAX_BYTES) {
    return BadRequest("File too large. Maximum avatar size is 200 KB.");
  }

  const ext = contentType.split("/")[1];
  const key = `avatars/${session.user.id}/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  return OK({ uploadUrl, publicUrl });
};

export { POST };
