import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";
import { mockRegister } from "@/lib/mock-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  role: z.enum(["CONSUMER", "BUSINESS_OWNER"]).default("CONSUMER"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    // MOCK MODE: Use simplified mock auth
    if (isMockMode()) {
      try {
        const user = mockRegister({
          email: validatedData.email,
          password: validatedData.password,
          name: validatedData.name,
          phone: validatedData.phone,
          role: validatedData.role,
        });

        return NextResponse.json(
          {
            message: "User created successfully (mock mode)",
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              createdAt: user.createdAt,
            },
          },
          { status: 201 }
        );
      } catch (err: any) {
        return NextResponse.json(
          { error: err.message || "User already exists" },
          { status: 400 }
        );
      }
    }

    // REAL MODE: Use Prisma with password hashing
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user (always use the role from validated data, never auto-assign admin)
    const user = await db.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        phone: validatedData.phone,
        role: validatedData.role, // Only CONSUMER or BUSINESS_OWNER allowed from schema
        emailVerificationToken,
        emailVerificationExpires,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.name || "User", emailVerificationToken);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail registration if email fails, user can request resend
    }

    return NextResponse.json(
      {
        message: "User created successfully. Please check your email to verify your account.",
        user,
        requiresVerification: true,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
