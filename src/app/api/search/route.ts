import prisma from "@/lib/db";
import { successResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = (searchParams.get("q") || "").trim();

    if (!query) {
      return successResponse({ events: [], users: [], certificates: [] });
    }

    const caller = await getSupabaseUser();
    const isAuthenticated = !!caller;

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
      isAuthenticated
        ? prisma.user.findMany({
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
          })
        : Promise.resolve([]),
      isAuthenticated
        ? prisma.certificate.findMany({
            where: {
              certificateCode: { contains: query },
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
          })
        : Promise.resolve([]),
    ]);


    return successResponse({ events, users, certificates });
  } catch {
    return serverErrorResponse();
  }
}
