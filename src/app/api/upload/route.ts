import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-utils";

/**
 * POST /api/upload
 * Uploads a file to Supabase Storage (bucket: "uploads").
 * Works on Vercel — no local filesystem writes.
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Fall back to publishable key if no service role key is set
    const supabaseKey = serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return errorResponse("Storage not configured", 503);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return errorResponse("No file provided");
    }

    if (!file.type.startsWith("image/")) {
      return errorResponse("Only image files are allowed");
    }

    if (file.size > 10 * 1024 * 1024) {
      return errorResponse("File size must be less than 10MB");
    }

    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const storagePath = `${folder}/${filename}`;

    const bytes = await file.arrayBuffer();

    const { error } = await supabase.storage
      .from("uploads")
      .upload(storagePath, Buffer.from(bytes), {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase Storage upload error:", error.message);
      return errorResponse(`Upload failed: ${error.message}`, 500);
    }

    const { data } = supabase.storage.from("uploads").getPublicUrl(storagePath);
    const url = data.publicUrl;

    return successResponse({ url, filename, size: file.size }, 201);
  } catch (error) {
    console.error("Upload error:", error);
    return serverErrorResponse();
  }
}
