import prisma from "@/lib/db";
import { successResponse, notFoundResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const certificate = await prisma.certificate.findUnique({
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

    const isValid = ["VALID", "AUTHORIZED", "GENERATED", "DOWNLOADED"].includes(certificate.status);

    return successResponse({
      certificate,
      valid: isValid,
      message: isValid
        ? "Certificate is valid and verified."
        : certificate.status === "REVOKED"
        ? "Certificate has been revoked."
        : `Certificate is in '${certificate.status.toLowerCase()}' stage (pending generation/authorization).`,
    });
  } catch {
    return serverErrorResponse();
  }
}
