import prisma from "@/lib/db";
import { hash } from "crypto";

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo users for each role
  const users = [
    {
      email: "admin@cybersecclub.com",
      name: "System Admin",
      password: "admin123",
      role: "PLATFORM_ADMIN",
      membershipStatus: "ACTIVE",
      department: "IT",
    },
    {
      email: "president@cybersecclub.com",
      name: "Sarah Chen",
      password: "president123",
      role: "PRESIDENT",
      membershipStatus: "ACTIVE",
      department: "Computer Science",
      studentId: "CS2024001",
    },
    {
      email: "vp@cybersecclub.com",
      name: "Marcus Johnson",
      password: "vp123",
      role: "VP",
      membershipStatus: "ACTIVE",
      department: "Information Security",
      studentId: "IS2024015",
    },
    {
      email: "gs@cybersecclub.com",
      name: "Emily Rodriguez",
      password: "gs123",
      role: "GS",
      membershipStatus: "ACTIVE",
      department: "Cybersecurity",
      studentId: "CY2024022",
    },
    {
      email: "treasurer@cybersecclub.com",
      name: "David Kim",
      password: "treasurer123",
      role: "TREASURER",
      membershipStatus: "ACTIVE",
      department: "Finance & IT",
      studentId: "FI2024008",
    },
    {
      email: "media@cybersecclub.com",
      name: "Aisha Patel",
      password: "media123",
      role: "MEDIA",
      membershipStatus: "ACTIVE",
      department: "Digital Media",
      studentId: "DM2024031",
    },
    {
      email: "verifier@cybersecclub.com",
      name: "James Wilson",
      password: "verifier123",
      role: "VERIFIER",
      membershipStatus: "ACTIVE",
      department: "Network Security",
      studentId: "NS2024012",
    },
    {
      email: "member1@university.edu",
      name: "Alex Thompson",
      password: "member123",
      role: "MEMBER",
      membershipStatus: "ACTIVE",
      department: "Computer Science",
      studentId: "CS2024045",
    },
    {
      email: "member2@university.edu",
      name: "Priya Sharma",
      password: "member123",
      role: "MEMBER",
      membershipStatus: "ACTIVE",
      department: "Information Technology",
      studentId: "IT2024067",
    },
    {
      email: "pending@university.edu",
      name: "New Applicant",
      password: "pending123",
      role: "GUEST",
      membershipStatus: "PENDING",
      department: "Software Engineering",
      studentId: "SE2024089",
      transactionId: "TXN-2025-001",
    },
    {
      email: "guest@university.edu",
      name: "Guest User",
      password: "guest123",
      role: "GUEST",
      membershipStatus: "NON_MEMBER",
      department: "Electrical Engineering",
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        password: u.password, // In production, this would be hashed
        role: u.role,
        membershipStatus: u.membershipStatus,
        department: u.department,
        studentId: u.studentId || null,
        transactionId: u.transactionId || null,
      },
    });
  }

  console.log("✅ Users seeded");

  // Create demo events
  const mediaUser = await prisma.user.findUnique({ where: { email: "media@cybersecclub.com" } });
  const verifierUser = await prisma.user.findUnique({ where: { email: "verifier@cybersecclub.com" } });
  const presidentUser = await prisma.user.findUnique({ where: { email: "president@cybersecclub.com" } });

  if (mediaUser && verifierUser) {
    const events = [
      {
        title: "Intro to Ethical Hacking",
        description: "Learn the fundamentals of ethical hacking and penetration testing. This hands-on workshop covers reconnaissance, vulnerability scanning, and basic exploitation techniques using industry-standard tools.",
        type: "PUBLIC",
        category: "WORKSHOP",
        startDate: new Date("2025-08-15T10:00:00Z"),
        endDate: new Date("2025-08-15T16:00:00Z"),
        venue: "Lab 301, CS Building",
        fee: 0,
        maxSeats: 50,
        currentSeats: 32,
        status: "UPCOMING",
        requiresAssessment: true,
        passingScore: 60,
        verifierId: verifierUser.id,
        createdBy: mediaUser.id,
      },
      {
        title: "CTF Challenge: Capture the Flag",
        description: "Test your cybersecurity skills in our Capture The Flag competition! Solve challenges across web exploitation, cryptography, reverse engineering, and forensics to earn points and climb the leaderboard.",
        type: "MEMBER_ONLY",
        category: "CTF",
        startDate: new Date("2025-09-01T09:00:00Z"),
        endDate: new Date("2025-09-01T18:00:00Z"),
        venue: "Virtual (Discord)",
        fee: 0,
        maxSeats: 100,
        currentSeats: 45,
        status: "UPCOMING",
        requiresAssessment: false,
        verifierId: verifierUser.id,
        createdBy: mediaUser.id,
      },
      {
        title: "Network Security Masterclass",
        description: "An advanced training session on network security fundamentals including firewall configuration, IDS/IPS setup, VPN tunneling, and network monitoring with SIEM tools.",
        type: "PAID",
        category: "TRAINING",
        startDate: new Date("2025-09-20T10:00:00Z"),
        endDate: new Date("2025-09-22T17:00:00Z"),
        venue: "Auditorium A, IT Building",
        fee: 500,
        maxSeats: 30,
        currentSeats: 18,
        status: "UPCOMING",
        requiresAssessment: true,
        passingScore: 70,
        verifierId: verifierUser.id,
        createdBy: mediaUser.id,
      },
      {
        title: "Cybersecurity Career Panel",
        description: "Join industry professionals as they share insights about careers in cybersecurity. Learn about different career paths, required certifications, and how to break into the field.",
        type: "PUBLIC",
        category: "SEMINAR",
        startDate: new Date("2025-07-20T14:00:00Z"),
        endDate: new Date("2025-07-20T17:00:00Z"),
        venue: "Main Hall",
        fee: 0,
        maxSeats: 200,
        currentSeats: 156,
        status: "COMPLETED",
        requiresAssessment: false,
        verifierId: verifierUser.id,
        createdBy: mediaUser.id,
      },
      {
        title: "Monthly Meetup: Threat Intelligence",
        description: "Our monthly meetup focusing on threat intelligence sharing, recent CVEs, and community discussions on emerging cyber threats. Open to all members.",
        type: "MEMBER_ONLY",
        category: "MEETUP",
        startDate: new Date("2025-08-05T18:00:00Z"),
        endDate: new Date("2025-08-05T20:00:00Z"),
        venue: "Student Lounge",
        fee: 0,
        maxSeats: 40,
        currentSeats: 22,
        status: "UPCOMING",
        requiresAssessment: false,
        verifierId: verifierUser.id,
        createdBy: mediaUser.id,
      },
    ];

    for (const e of events) {
      const existing = await prisma.event.findFirst({ where: { title: e.title } });
      if (!existing) {
        await prisma.event.create({ data: e });
      }
    }
    console.log("✅ Events seeded");
  }

  // Create demo payments
  const member1 = await prisma.user.findUnique({ where: { email: "member1@university.edu" } });
  const member2 = await prisma.user.findUnique({ where: { email: "member2@university.edu" } });
  const pendingUser = await prisma.user.findUnique({ where: { email: "pending@university.edu" } });
  const treasurerUser = await prisma.user.findUnique({ where: { email: "treasurer@cybersecclub.com" } });

  if (member1 && member2 && pendingUser && treasurerUser) {
    // Membership payments
    const payments = [
      {
        userId: member1.id,
        amount: 500,
        type: "MEMBERSHIP",
        status: "VERIFIED",
        transactionId: "TXN-MEM-001",
        verifiedBy: treasurerUser.id,
      },
      {
        userId: member2.id,
        amount: 500,
        type: "MEMBERSHIP",
        status: "VERIFIED",
        transactionId: "TXN-MEM-002",
        verifiedBy: treasurerUser.id,
      },
      {
        userId: pendingUser.id,
        amount: 500,
        type: "MEMBERSHIP",
        status: "PENDING",
        transactionId: "TXN-2025-001",
      },
    ];

    for (const p of payments) {
      const existing = await prisma.payment.findFirst({ where: { transactionId: p.transactionId } });
      if (!existing) {
        await prisma.payment.create({ data: p });
      }
    }

    // Event payments
    const networkEvent = await prisma.event.findFirst({ where: { title: "Network Security Masterclass" } });
    if (networkEvent) {
      const eventPayments = [
        {
          userId: member1.id,
          amount: 500,
          type: "EVENT",
          status: "VERIFIED",
          transactionId: "TXN-EVT-001",
          eventId: networkEvent.id,
          verifiedBy: treasurerUser.id,
        },
        {
          userId: member2.id,
          amount: 500,
          type: "EVENT",
          status: "PENDING",
          transactionId: "TXN-EVT-002",
          eventId: networkEvent.id,
        },
      ];

      for (const p of eventPayments) {
        const existing = await prisma.payment.findFirst({ where: { transactionId: p.transactionId } });
        if (!existing) {
          await prisma.payment.create({ data: p });
        }
      }
    }
    console.log("✅ Payments seeded");
  }

  // Create demo budgets and expenses
  if (treasurerUser && presidentUser) {
    const budget = await prisma.budget.upsert({
      where: { id: "budget-2025-q3" },
      update: {},
      create: {
        id: "budget-2025-q3",
        title: "Q3 2025 Operations Budget",
        amount: 50000,
        category: "OPERATIONS",
        period: "2025-Q3",
        createdBy: treasurerUser.id,
      },
    });

    const expenses = [
      {
        title: "Workshop Materials",
        amount: 3500,
        category: "MATERIALS",
        description: "Printed handouts, USB drives, and practice lab setup materials",
        status: "APPROVED",
        budgetId: budget.id,
        createdBy: treasurerUser.id,
        approvedBy: presidentUser.id,
      },
      {
        title: "CTF Platform License",
        amount: 8000,
        category: "SOFTWARE",
        description: "Annual license for CTF competition platform",
        status: "APPROVED",
        budgetId: budget.id,
        createdBy: treasurerUser.id,
        approvedBy: presidentUser.id,
      },
      {
        title: "Guest Speaker Honorarium",
        amount: 5000,
        category: "EVENTS",
        description: "Honorarium for cybersecurity industry guest speaker",
        status: "PENDING",
        budgetId: budget.id,
        createdBy: treasurerUser.id,
      },
      {
        title: "Network Equipment",
        amount: 12000,
        category: "EQUIPMENT",
        description: "Routers, switches, and cables for network security lab",
        status: "PENDING",
        budgetId: budget.id,
        createdBy: treasurerUser.id,
      },
    ];

    for (const e of expenses) {
      const existing = await prisma.expense.findFirst({ where: { title: e.title, budgetId: e.budgetId } });
      if (!existing) {
        await prisma.expense.create({ data: e });
      }
    }
    console.log("✅ Budgets & Expenses seeded");
  }

  // Create demo certificates
  if (member1 && member2) {
    const careerPanel = await prisma.event.findFirst({ where: { title: "Cybersecurity Career Panel" } });
    if (careerPanel) {
      const certificates = [
        {
          certificateCode: "CSC-2025-00001",
          userId: member1.id,
          eventId: careerPanel.id,
          type: "PARTICIPATION",
          status: "VALID",
          issuedAt: new Date("2025-07-21T10:00:00Z"),
        },
        {
          certificateCode: "CSC-2025-00002",
          userId: member2.id,
          eventId: careerPanel.id,
          type: "PARTICIPATION",
          status: "VALID",
          issuedAt: new Date("2025-07-21T10:00:00Z"),
        },
      ];

      for (const c of certificates) {
        const existing = await prisma.certificate.findFirst({ where: { certificateCode: c.certificateCode } });
        if (!existing) {
          await prisma.certificate.create({ data: c });
        }
      }
    }
    console.log("✅ Certificates seeded");
  }

  // Create demo notifications
  if (member1) {
    const notifs = [
      {
        userId: member1.id,
        title: "Event Registration Confirmed",
        message: "Your registration for 'Intro to Ethical Hacking' has been confirmed!",
        type: "SUCCESS",
        read: false,
      },
      {
        userId: member1.id,
        title: "New Event Available",
        message: "A new CTF Challenge event has been posted. Register now!",
        type: "INFO",
        read: false,
      },
      {
        userId: member1.id,
        title: "Certificate Ready",
        message: "Your participation certificate for 'Cybersecurity Career Panel' is now available.",
        type: "SUCCESS",
        read: true,
      },
    ];

    for (const n of notifs) {
      await prisma.notification.create({ data: n });
    }
    console.log("✅ Notifications seeded");
  }

  // Create demo announcements
  if (presidentUser) {
    const announcements = [
      {
        title: "Welcome to Fall 2025 Semester!",
        content: "We're excited to kick off another semester of cybersecurity learning. Check out our upcoming events and workshops!",
        type: "GENERAL",
        createdBy: presidentUser.id,
      },
      {
        title: "CTF Competition Registration Open",
        content: "Registration for our annual CTF competition is now open. Limited spots available - register today!",
        type: "EVENT",
        createdBy: presidentUser.id,
      },
    ];

    for (const a of announcements) {
      const existing = await prisma.announcement.findFirst({ where: { title: a.title } });
      if (!existing) {
        await prisma.announcement.create({ data: a });
      }
    }
    console.log("✅ Announcements seeded");
  }

  // Create demo audit logs
  const adminUser = await prisma.user.findUnique({ where: { email: "admin@cybersecclub.com" } });
  if (adminUser && treasurerUser && presidentUser) {
    const logs = [
      {
        userId: treasurerUser.id,
        action: "PAYMENT_VERIFIED",
        details: "Verified membership payment for Alex Thompson (TXN-MEM-001)",
      },
      {
        userId: presidentUser.id,
        action: "EXPENSE_APPROVED",
        details: "Approved expense: Workshop Materials (₹3,500)",
      },
      {
        userId: adminUser.id,
        action: "ROLE_ASSIGNED",
        details: "Assigned TREASURER role to David Kim",
      },
      {
        userId: treasurerUser.id,
        action: "BUDGET_CREATED",
        details: "Created Q3 2025 Operations Budget (₹50,000)",
      },
    ];

    for (const l of logs) {
      await prisma.auditLog.create({ data: l });
    }
    console.log("✅ Audit Logs seeded");
  }

  // Create demo event registrations
  if (member1 && member2) {
    const ethicalHacking = await prisma.event.findFirst({ where: { title: "Intro to Ethical Hacking" } });
    const ctf = await prisma.event.findFirst({ where: { title: "CTF Challenge: Capture the Flag" } });
    const meetup = await prisma.event.findFirst({ where: { title: "Monthly Meetup: Threat Intelligence" } });

    if (ethicalHacking && ctf && meetup) {
      const registrations = [
        { userId: member1.id, eventId: ethicalHacking.id, status: "APPROVED" },
        { userId: member2.id, eventId: ethicalHacking.id, status: "PENDING" },
        { userId: member1.id, eventId: ctf.id, status: "APPROVED" },
        { userId: member2.id, eventId: ctf.id, status: "APPROVED" },
        { userId: member1.id, eventId: meetup.id, status: "APPROVED" },
      ];

      for (const r of registrations) {
        const existing = await prisma.eventRegistration.findFirst({
          where: { userId: r.userId, eventId: r.eventId },
        });
        if (!existing) {
          await prisma.eventRegistration.create({ data: r });
        }
      }
      console.log("✅ Event Registrations seeded");
    }
  }

  // Create demo attendance
  if (member1 && member2) {
    const careerPanel = await prisma.event.findFirst({ where: { title: "Cybersecurity Career Panel" } });
    if (careerPanel) {
      const attendanceRecords = [
        { userId: member1.id, eventId: careerPanel.id, status: "PRESENT" },
        { userId: member2.id, eventId: careerPanel.id, status: "PRESENT" },
      ];

      for (const a of attendanceRecords) {
        const existing = await prisma.attendance.findFirst({
          where: { userId: a.userId, eventId: a.eventId },
        });
        if (!existing) {
          await prisma.attendance.create({ data: a });
        }
      }
      console.log("✅ Attendance seeded");
    }
  }

  // Create demo committee members
  const presidentUser2 = await prisma.user.findUnique({ where: { email: "president@cybersecclub.com" } });
  const vpUser2 = await prisma.user.findUnique({ where: { email: "vp@cybersecclub.com" } });
  const gsUser2 = await prisma.user.findUnique({ where: { email: "gs@cybersecclub.com" } });
  const treasurerUser2 = await prisma.user.findUnique({ where: { email: "treasurer@cybersecclub.com" } });
  const mediaUser2 = await prisma.user.findUnique({ where: { email: "media@cybersecclub.com" } });

  const committeeMembers = [
    {
      name: "Sarah Chen",
      role: "President",
      description: "Leading the club's strategic vision and partnerships. Passionate about making cybersecurity accessible to all students.",
      department: "Computer Science",
      email: "president@cybersecclub.com",
      socialLinks: JSON.stringify({ linkedin: "https://linkedin.com/in/sarahchen", github: "https://github.com/sarahchen" }),
      order: 1,
      isActive: true,
    },
    {
      name: "Marcus Johnson",
      role: "Vice President",
      description: "Driving innovation and cross-team collaboration. Expert in penetration testing and security research.",
      department: "Information Security",
      email: "vp@cybersecclub.com",
      socialLinks: JSON.stringify({ linkedin: "https://linkedin.com/in/marcusjohnson", github: "https://github.com/marcusjohnson" }),
      order: 2,
      isActive: true,
    },
    {
      name: "Emily Rodriguez",
      role: "General Secretary",
      description: "Managing operations and member engagement. Keeping the club organized and running smoothly.",
      department: "Cybersecurity",
      email: "gs@cybersecclub.com",
      socialLinks: JSON.stringify({ linkedin: "https://linkedin.com/in/emilyrodriguez", twitter: "https://twitter.com/emilyrsec" }),
      order: 3,
      isActive: true,
    },
    {
      name: "David Kim",
      role: "Treasurer",
      description: "Overseeing financial governance and budgets. Ensuring transparent and responsible use of club resources.",
      department: "Finance & IT",
      email: "treasurer@cybersecclub.com",
      socialLinks: JSON.stringify({ linkedin: "https://linkedin.com/in/davidkim" }),
      order: 4,
      isActive: true,
    },
    {
      name: "Aisha Patel",
      role: "Media Lead",
      description: "Creating compelling content and social presence. Bringing the club's stories to life through visual media.",
      department: "Digital Media",
      email: "media@cybersecclub.com",
      socialLinks: JSON.stringify({ linkedin: "https://linkedin.com/in/aishapatel", twitter: "https://twitter.com/aishamedia", github: "https://github.com/aishapatel" }),
      order: 5,
      isActive: true,
    },
  ];

  for (const m of committeeMembers) {
    const existing = await prisma.committeeMember.findFirst({ where: { name: m.name, role: m.role } });
    if (!existing) {
      await prisma.committeeMember.create({ data: m });
    }
  }
  console.log("✅ Committee Members seeded");

  // Create demo gallery images
  if (mediaUser2) {
    const galleryImages = [
      {
        title: "Ethical Hacking Workshop 2024",
        description: "Students learning reconnaissance and vulnerability scanning techniques in our popular hands-on workshop.",
        imageUrl: "/uploads/gallery/placeholder-workshop-1.jpg",
        category: "WORKSHOP",
        uploadedBy: mediaUser2.id,
      },
      {
        title: "CTF Competition Finals",
        description: "Teams competing in the final round of our annual Capture The Flag competition.",
        imageUrl: "/uploads/gallery/placeholder-ctf-1.jpg",
        category: "CTF",
        uploadedBy: mediaUser2.id,
      },
      {
        title: "Career Panel Discussion",
        description: "Industry professionals sharing insights about cybersecurity careers and certifications.",
        imageUrl: "/uploads/gallery/placeholder-seminar-1.jpg",
        category: "SEMINAR",
        uploadedBy: mediaUser2.id,
      },
      {
        title: "Monthly Meetup - Threat Intel",
        description: "Community discussion on emerging threats and recent CVEs at our monthly meetup.",
        imageUrl: "/uploads/gallery/placeholder-meetup-1.jpg",
        category: "MEETUP",
        uploadedBy: mediaUser2.id,
      },
      {
        title: "Network Security Lab Setup",
        description: "Our new network security lab with enterprise-grade equipment for hands-on training.",
        imageUrl: "/uploads/gallery/placeholder-training-1.jpg",
        category: "EVENT",
        uploadedBy: mediaUser2.id,
      },
      {
        title: "Club Annual Gathering 2024",
        description: "The whole CyberSec Club community coming together for our annual celebration.",
        imageUrl: "/uploads/gallery/placeholder-general-1.jpg",
        category: "GENERAL",
        uploadedBy: mediaUser2.id,
      },
    ];

    for (const g of galleryImages) {
      const existing = await prisma.galleryImage.findFirst({ where: { title: g.title } });
      if (!existing) {
        await prisma.galleryImage.create({ data: g });
      }
    }
    console.log("✅ Gallery Images seeded");
  }

  // Create demo achievements
  if (presidentUser2 && mediaUser2) {
    const achievements = [
      {
        title: "National CTF Championship 2024",
        description: "Our team won first place in the National Capture The Flag competition, defeating 50+ teams from across the country.",
        category: "COMPETITION",
        achievedBy: "CyberSec CTF Team",
        achievedDate: new Date("2024-11-15"),
        status: "APPROVED",
        submittedBy: mediaUser2.id,
        approvedBy: presidentUser2.id,
      },
      {
        title: "Best Cybersecurity Club Award",
        description: "Recognized as the Best Cybersecurity Club at the National Student Organizations Conference 2024.",
        category: "ACADEMIC",
        achievedBy: "CyberSec Club",
        achievedDate: new Date("2024-09-20"),
        status: "APPROVED",
        submittedBy: mediaUser2.id,
        approvedBy: presidentUser2.id,
      },
      {
        title: "500+ Active Members Milestone",
        description: "Reached the milestone of 500+ active members, making us the largest cybersecurity student community in the region.",
        category: "COMMUNITY",
        achievedBy: "CyberSec Club",
        achievedDate: new Date("2024-06-01"),
        status: "APPROVED",
        submittedBy: mediaUser2.id,
        approvedBy: presidentUser2.id,
      },
      {
        title: "Industry Partnership with SecureTech",
        description: "Established a partnership with SecureTech Inc. for providing internship opportunities and workshop resources.",
        category: "INDUSTRY",
        achievedBy: "Partnership Team",
        achievedDate: new Date("2025-01-10"),
        status: "PENDING",
        submittedBy: mediaUser2.id,
      },
      {
        title: "100+ CompTIA Security+ Certified",
        description: "Over 100 club members have earned CompTIA Security+ certification through our study groups and training programs.",
        category: "CERTIFICATION",
        achievedBy: "Training Committee",
        achievedDate: new Date("2025-02-28"),
        status: "PENDING",
        submittedBy: mediaUser2.id,
      },
      {
        title: "Regional Hackathon Winners",
        description: "Our team secured first place in the Regional Cybersecurity Hackathon, solving real-world security challenges in record time.",
        category: "COMPETITION",
        achievedBy: "Hackathon Squad",
        achievedDate: new Date("2025-03-15"),
        status: "PENDING",
        submittedBy: mediaUser2.id,
      },
    ];

    for (const a of achievements) {
      const existing = await prisma.achievement.findFirst({ where: { title: a.title } });
      if (!existing) {
        await prisma.achievement.create({ data: a });
      }
    }
    console.log("✅ Achievements seeded");
  }

  console.log("🎉 Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
