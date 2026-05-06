import { db } from "@/lib/db";
import { successResponse, notFoundResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const certificate = await db.certificate.findUnique({
      where: { certificateCode: code },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            category: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!certificate) {
      return notFoundResponse("Certificate not found");
    }

    const isValid = certificate.status === "VALID";

    return successResponse({
      certificate,
      valid: isValid,
      message: isValid
        ? "Certificate is valid and verified."
        : "Certificate has been revoked.",
    });
  } catch {
    return serverErrorResponse();
  }
}
