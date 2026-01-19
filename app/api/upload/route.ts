import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadImage, uploadBusinessImage, uploadProfileImage, uploadReviewImage } from "@/lib/cloudinary";
import { isMockMode } from "@/lib/db";
import { z } from "zod";

const uploadSchema = z.object({
  image: z.string().min(1, "Image data is required"),
  type: z.enum(["general", "business", "profile", "review"]).default("general"),
  entityId: z.string().optional(), // businessId, userId, or reviewId depending on type
});

// Max file size: 10MB (base64 is ~33% larger than binary)
const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1.33;

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user && !isMockMode()) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { image, type, entityId } = uploadSchema.parse(body);

    // Validate base64 image
    if (!image.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Invalid image format. Must be a base64-encoded image." },
        { status: 400 }
      );
    }

    // Check file size
    const base64Size = image.length * 0.75; // Approximate binary size
    if (base64Size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image file size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Mock mode response
    if (isMockMode()) {
      return NextResponse.json({
        url: `https://via.placeholder.com/800x600?text=Uploaded+Image`,
        publicId: `mock_${Date.now()}`,
        width: 800,
        height: 600,
        format: "jpg",
      });
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      return NextResponse.json(
        { error: "Image upload service is not configured" },
        { status: 503 }
      );
    }

    // Upload based on type
    let result;
    switch (type) {
      case "business":
        if (!entityId) {
          return NextResponse.json(
            { error: "Business ID is required for business images" },
            { status: 400 }
          );
        }
        result = await uploadBusinessImage(image, entityId);
        break;

      case "profile":
        const userId = entityId || session?.user?.id;
        if (!userId) {
          return NextResponse.json(
            { error: "User ID is required for profile images" },
            { status: 400 }
          );
        }
        result = await uploadProfileImage(image, userId);
        break;

      case "review":
        if (!entityId) {
          return NextResponse.json(
            { error: "Review ID is required for review images" },
            { status: 400 }
          );
        }
        result = await uploadReviewImage(image, entityId);
        break;

      default:
        result = await uploadImage(image);
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "An error occurred while uploading the image" },
      { status: 500 }
    );
  }
}
