import prisma from "@/lib/db";

async function main() {
  console.log("🌱 Initializing system configurations (zero demo fixtures)...");

  // Ensure baseline system configurations exist if not already set by administrators
  const defaultConfigs = [
    { key: "membership_fee", value: "200" },
    { key: "membership_registration_enabled", value: "true" },
    { key: "default_cert_primary_color", value: "#10b981" },
    { key: "default_cert_secondary_color", value: "#06b6d4" },
  ];

  for (const cfg of defaultConfigs) {
    const existing = await prisma.systemConfig.findUnique({
      where: { key: cfg.key },
    });
    if (!existing) {
      await prisma.systemConfig.create({
        data: { key: cfg.key, value: cfg.value },
      });
    }
  }

  console.log("✅ System configurations initialized.");
  console.log("🎉 Seeding complete: Zero demo users, zero mock committee members, zero fake data.");
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
