import prisma from "@/lib/db";
import { successResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    if (!query.trim()) {
      return successResponse({ events: [], users: [], certificates: [] });
    }

    const [events, users, certificates] = await Promise.all([
      prisma.event.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
            { venue: { contains: query } },
          ],
        },
        take: 5,
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          startDate: true,
          venue: true,
        },
        orderBy: { startDate: "desc" },
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
            { department: { contains: query } },
          ],
        },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          avatar: true,
        },
      }),
      prisma.certificate.findMany({
        where: {
          OR: [
            { certificateCode: { contains: query } },
          ],
        },
        take: 5,
        select: {
          id: true,
          certificateCode: true,
          type: true,
          status: true,
          issuedAt: true,
          event: { select: { id: true, title: true } },
        },
      }),
    ]);

    return successResponse({ events, users, certificates });
  } catch {
    return serverErrorResponse();
  }
}
