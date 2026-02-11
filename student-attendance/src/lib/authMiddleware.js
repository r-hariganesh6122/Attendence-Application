import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

/**
 * Authenticate request by verifying JWT token from Authorization header
 * Returns user object if valid, null if invalid
 */
export async function authenticateRequest(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Middleware to verify authentication on a request
 * Returns error response if not authenticated, otherwise passes through
 */
export async function withAuth(handler) {
  return async (request) => {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Invalid or missing token" },
        { status: 401 },
      );
    }

    // Attach user to request for use in handler
    request.user = user;
    return handler(request);
  };
}

/**
 * Middleware to verify user has required role(s)
 * Usage: withRole(["admin", "teacher"])(handler)
 */
export function withRole(allowedRoles) {
  return (handler) => {
    return async (request) => {
      const user = await authenticateRequest(request);
      if (!user) {
        return NextResponse.json(
          {
            success: false,
            message: "Unauthorized - Invalid or missing token",
          },
          { status: 401 },
        );
      }

      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(
          {
            success: false,
            message: `Forbidden - Required role: ${allowedRoles.join(" or ")}`,
          },
          { status: 403 },
        );
      }

      // Attach user to request for use in handler
      request.user = user;
      return handler(request);
    };
  };
}

/**
 * Create JWT token for user
 */
export function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      name: user.name,
      mobile: user.mobile,
    },
    JWT_SECRET,
    { expiresIn: "24h" },
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
