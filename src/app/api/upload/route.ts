import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return errorResponse("No file provided");
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return errorResponse("Only image files are allowed");
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return errorResponse("File size must be less than 10MB");
    }

    // Generate unique filename
    const ext = path.extname(file.name) || ".jpg";
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(uploadDir, { recursive: true });

    // Write file
    const filePath = path.join(uploadDir, uniqueName);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Return the public URL
    const url = `/uploads/${folder}/${uniqueName}`;

    return successResponse({ url, filename: uniqueName, size: file.size }, 201);
  } catch (error) {
    console.error("Upload error:", error);
    return serverErrorResponse();
  }
}
