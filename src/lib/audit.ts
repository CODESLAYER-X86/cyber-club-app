import prisma from "@/lib/db";

export const CATEGORY_ACTIONS: Record<string, string[]> = {
  MEMBERSHIP: [
    'MEMBERSHIP_APPLICATION',
    'MEMBER_APPROVE',
    'MEMBER_REJECT',
    'USER_REGISTERED',
    'USER_KICKED',
  ],
  ROLES: [
    'ROLE_UPDATE',
    'ROLE_ASSIGNED',
    'COMMITTEE_MEMBER_ADDED',
    'COMMITTEE_MEMBER_UPDATED',
    'COMMITTEE_MEMBER_REMOVED',
  ],
  FINANCE: [
    'PAYMENT_VERIFIED',
    'PAYMENT_REJECTED',
    'PAYMENT_RECONCILED',
    'EXPENSE_CREATED',
    'EXPENSE_APPROVED',
    'EXPENSE_REJECTED',
    'TREASURY_DEPOSIT_CREATED',
    'TREASURY_DEPOSIT_APPROVED',
  ],
  SYSTEM: [
    'EVENT_CREATED',
    'EVENT_UPDATED',
    'EVENT_DELETED',
    'CONFIG_UPDATED',
    'DATA_EXPORTED',
    'ANNOUNCEMENT_CREATED',
    'ANNOUNCEMENT_DELETED',
    'ACHIEVEMENT_SUBMITTED',
    'ACHIEVEMENT_APPROVED',
    'ACHIEVEMENT_REJECTED',
    'ACHIEVEMENT_DELETED',
    'GALLERY_PHOTO_ADDED',
    'GALLERY_PHOTO_DELETED',
    'SPONSOR_CREATED',
    'SPONSOR_UPDATED',
    'SPONSOR_DELETED',
  ],
};

export const MAX_AUDIT_LOGS = 100000;

interface LogAuditParams {
  userId: string;
  action: string;
  details: string;
}

/**
 * Creates an audit log entry.
 * Runs non-blocking pruning check if table exceeds MAX_AUDIT_LOGS.
 */
export async function logAuditEvent({ userId, action, details }: LogAuditParams) {
  try {
    const entry = await prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
      },
    });

    // Run pruning check asynchronously so it never blocks the request
    pruneAuditLogsIfExceeded().catch((err) => {
      console.error("Background audit prune error:", err);
    });

    return entry;
  } catch (error) {
    console.error("Failed to create audit log:", error);
    return null;
  }
}

/**
 * Prunes audit logs older than the 100,000th newest record (FIFO cap).
 * Optimized to run fast via createdAt index without locking active rows.
 */
export async function pruneAuditLogsIfExceeded(maxAllowed = MAX_AUDIT_LOGS): Promise<number> {
  try {
    // 1. Check if a row exists at the limit offset
    const cutoffLog = await prisma.auditLog.findFirst({
      skip: maxAllowed,
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (!cutoffLog) {
      // Table count is <= maxAllowed, no pruning needed
      return 0;
    }

    // 2. Delete all records older than or equal to the cutoff date
    const deleted = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lte: cutoffLog.createdAt,
        },
      },
    });

    return deleted.count;
  } catch (error) {
    console.error("Prune audit logs failed:", error);
    return 0;
  }
}
