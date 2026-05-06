import { NextResponse } from "next/server";

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function notFoundResponse(message = "Resource not found") {
  return NextResponse.json({ success: false, error: message }, { status: 404 });
}

export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

export function forbiddenResponse(message = "Forbidden") {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

export function serverErrorResponse(message = "Internal server error") {
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}
