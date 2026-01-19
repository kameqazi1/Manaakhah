import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
}

export async function uploadImage(
  base64Data: string,
  folder: string = "manakhaah"
): Promise<UploadResult> {
  const result = await cloudinary.uploader.upload(base64Data, {
    folder,
    resource_type: "image",
    transformation: [
      { width: 1200, crop: "limit" }, // Max width
      { quality: "auto" }, // Auto quality
      { fetch_format: "auto" }, // Auto format (webp when supported)
    ],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
  };
}

export async function uploadBusinessImage(
  base64Data: string,
  businessId: string
): Promise<UploadResult> {
  return uploadImage(base64Data, `manakhaah/businesses/${businessId}`);
}

export async function uploadProfileImage(
  base64Data: string,
  userId: string
): Promise<UploadResult> {
  const result = await cloudinary.uploader.upload(base64Data, {
    folder: `manakhaah/profiles/${userId}`,
    resource_type: "image",
    transformation: [
      { width: 400, height: 400, crop: "fill", gravity: "face" },
      { quality: "auto" },
      { fetch_format: "auto" },
    ],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
  };
}

export async function uploadReviewImage(
  base64Data: string,
  reviewId: string
): Promise<UploadResult> {
  return uploadImage(base64Data, `manakhaah/reviews/${reviewId}`);
}

export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error("Error deleting image:", error);
    return false;
  }
}

export { cloudinary };
