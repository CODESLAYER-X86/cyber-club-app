export type UserRole =
  | "PLATFORM_ADMIN"
  | "PRESIDENT"
  | "VP"
  | "GS"
  | "TREASURER"
  | "MEDIA"
  | "VERIFIER"
  | "MEMBER"
  | "GUEST";

export type MembershipStatus = "NON_MEMBER" | "PENDING" | "ACTIVE" | "REJECTED";

export type EventType = "PUBLIC" | "MEMBER_ONLY" | "PAID" | "LIMITED";
export type EventCategory = "WORKSHOP" | "SEMINAR" | "TRAINING" | "CTF" | "MEETUP";
export type EventStatus = "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";

export type PaymentType = "MEMBERSHIP" | "EVENT" | "OTHER";
export type PaymentStatus = "PENDING" | "VERIFIED" | "REJECTED";

export type RegistrationStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type CertificateType =
  | "PARTICIPATION"
  | "ACHIEVEMENT"
  | "EXCELLENCE"
  | "WINNER"
  | "FIRST_PLACE"
  | "SECOND_PLACE"
  | "THIRD_PLACE"
  | "ORGANIZER"
  | "VOLUNTEER"
  | "JUDGE"
  | "APPRECIATION"
  | "CUSTOM";
export type CertificateStatus =
  | "REGISTERED"
  | "PRESENT"
  | "ELIGIBLE"
  | "AUTHORIZED"
  | "GENERATED"
  | "DOWNLOADED"
  | "REVOKED";

export type ExpenseStatus = "PENDING" | "APPROVED" | "REJECTED";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

export type NotificationType = "INFO" | "WARNING" | "SUCCESS" | "ERROR";
export type AnnouncementType = "GENERAL" | "EVENT" | "URGENT";

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  role: UserRole;
  membershipStatus: MembershipStatus;
  avatar?: string;
  studentId?: string;
  department?: string;
  phone?: string;
  bio?: string;
  transactionId?: string;
  paymentProof?: string;
  paymentMethod?: string;
  paymentDate?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type: EventType;
  category: EventCategory;
  startDate: string;
  endDate: string;
  venue: string;
  fee: number;
  maxSeats?: number;
  currentSeats: number;
  poster?: string;
  status: EventStatus;
  requiresAssessment: boolean;
  passingScore?: number;
  verifierId?: string;
  certificateLayout?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: User;
  verifier?: User;
}

export interface EventRegistration {
  id: string;
  userId: string;
  eventId: string;
  status: RegistrationStatus;
  preferredName?: string;
  studentId?: string;
  department?: string;
  institution?: string;
  registeredAt: string;
  user?: User;
  event?: Event;
  payment?: {
    id: string;
    amount: number;
    status: string;
    transactionId: string;
    proofUrl?: string | null;
    createdAt: string;
  } | null;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
  transactionId: string;
  paymentMethod?: string;
  proofUrl?: string;
  eventId?: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  event?: Event;
  verifier?: User;
  reconciled?: boolean;
}

export interface Budget {
  id: string;
  title: string;
  amount: number;
  category: string;
  period: string;
  status?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  creator?: User;
  approver?: User;
  expenses?: Expense[];
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  description?: string;
  proofUrl?: string;
  status: ExpenseStatus;
  fundingSource?: string;
  budgetId: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
  budget?: Budget;
  creator?: User;
  approver?: User;
}

export interface Attendance {
  id: string;
  userId: string;
  eventId: string;
  status: AttendanceStatus;
  markedAt: string;
  user?: User;
  event?: Event;
}

export interface Certificate {
  id: string;
  certificateCode: string;
  userId: string;
  eventId: string;
  type: CertificateType;
  score?: number;
  status: CertificateStatus;
  issuedAt: string;
  issuedBy?: string;
  approvedBy?: string;
  revokedBy?: string;
  revokedAt?: string;
  revocationReason?: string;
  eligibilityVerified?: boolean;
  eligibilityDetails?: string;
  user?: User;
  event?: Event;
  issuer?: User;
  approver?: User;
  revoker?: User;
}

export type CertificateAuditAction = 'ISSUED' | 'APPROVED' | 'REVOKED' | 'ELIGIBILITY_CHECKED' | 'VIEWED' | 'SHARED';

export interface CertificateAuditLog {
  id: string;
  certificateId: string;
  action: CertificateAuditAction;
  performedBy: string;
  details: string;
  createdAt: string;
  performer?: User;
}

export interface EligibilityCheck {
  eligible: boolean;
  checks: {
    eventCompleted: boolean;
    registration: boolean;
    attendance: boolean;
    assessment: boolean;
    existingCertificate: boolean;
  };
  event?: { title: string; status: string; requiresAssessment: boolean; passingScore?: number };
}

export interface Assessment {
  id: string;
  eventId: string;
  title: string;
  questions: string;
  maxScore: number;
  passingScore: number;
  createdAt: string;
}

export interface AssessmentSubmission {
  id: string;
  userId: string;
  assessmentId: string;
  answers: string;
  score?: number;
  status: "SUBMITTED" | "GRADED";
  submittedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  createdAt: string;
  user?: User;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  createdBy: string;
  createdAt: string;
}

export type GalleryCategory = "EVENT" | "WORKSHOP" | "CTF" | "SEMINAR" | "MEETUP" | "GENERAL";

export interface GalleryImage {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  category: GalleryCategory;
  eventId?: string;
  uploadedBy: string;
  createdAt: string;
  uploader?: Pick<User, 'id' | 'name' | 'avatar'>;
  event?: Pick<Event, 'id' | 'title'>;
}

export type AchievementCategory = "COMPETITION" | "ACADEMIC" | "COMMUNITY" | "INDUSTRY" | "CERTIFICATION";
export type AchievementStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  category: AchievementCategory;
  achievedBy?: string;
  achievedDate: string;
  status: AchievementStatus;
  submittedBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
  submitter?: Pick<User, 'id' | 'name' | 'avatar'>;
  approver?: Pick<User, 'id' | 'name' | 'avatar'>;
}

export interface CommitteeMember {
  id: string;
  name: string;
  role: string;
  description: string;
  imageUrl?: string;
  department?: string;
  email?: string;
  socialLinks?: string; // JSON string
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AppView =
  | "landing"
  | "login"
  | "register"
  | "apply-membership"
  | "dashboard"
  | "events"
  | "event-detail"
  | "create-event"
  | "members"
  | "member-approval"
  | "finance"
  | "budgets"
  | "expenses"
  | "verify-payments"
  | "certificates"
  | "certificate-verify"
  | "certificate-public"
  | "assessments"
  | "notifications"
  | "audit-logs"
  | "roles"
  | "profile"
  | "announcements"
  | "analytics"
  | "about"
  | "certificate-authority"
  | "settings"
  | "gallery"
  | "certificate-designer"
  | "committee"
  | "achievements";

export interface NavItem {
  label: string;
  view: AppView;
  icon: string;
  badge?: number;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  PLATFORM_ADMIN: "Platform Admin",
  PRESIDENT: "President",
  VP: "Vice President",
  GS: "General Secretary",
  TREASURER: "Treasurer",
  MEDIA: "Media Team",
  VERIFIER: "Event Verifier",
  MEMBER: "Member",
  GUEST: "Guest",
};

export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
  NON_MEMBER: "Non-Member",
  PENDING: "Pending",
  ACTIVE: "Active",
  REJECTED: "Rejected",
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  PUBLIC: "Public",
  MEMBER_ONLY: "Member Only",
  PAID: "Paid",
  LIMITED: "Limited Seats",
};

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  WORKSHOP: "Workshop",
  SEMINAR: "Seminar",
  TRAINING: "Training",
  CTF: "CTF",
  MEETUP: "Meetup",
};

export const CERTIFICATE_TYPE_LABELS: Record<CertificateType, string> = {
  PARTICIPATION: "Participation",
  ACHIEVEMENT: "Achievement",
  EXCELLENCE: "Excellence",
  WINNER: "Winner",
  FIRST_PLACE: "1st Place",
  SECOND_PLACE: "2nd Place",
  THIRD_PLACE: "3rd Place",
  ORGANIZER: "Organizer",
  VOLUNTEER: "Volunteer",
  JUDGE: "Judge",
  APPRECIATION: "Appreciation",
  CUSTOM: "Custom Type",
};
