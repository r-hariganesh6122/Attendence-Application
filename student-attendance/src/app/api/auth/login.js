import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const { identifier, password, role } = req.body;
  if (!identifier || !password || !role) {
    return res
      .status(400)
      .json({ success: false, message: "Missing credentials" });
  }

  // Find user by email or mobile and role
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { mobile: identifier }],
      role,
    },
  });

  if (!user || user.password !== password) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid email/mobile or password" });
  }

  // Remove password before sending user object
  const { password: _, ...userSafe } = user;
  return res.status(200).json({ success: true, user: userSafe });
}

export const config = {
  api: {
    bodyParser: true,
  },
};
