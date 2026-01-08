import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";
import { mockRegister } from "@/lib/mock-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

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
          password: validatedData.password, // Mock mode: no hashing needed
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
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Check if email contains "admin" for auto-admin role
    const isAdmin = validatedData.email.toLowerCase().includes("admin");

    // Create user
    const user = await db.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        phone: validatedData.phone,
        role: isAdmin ? "ADMIN" : validatedData.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user,
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
