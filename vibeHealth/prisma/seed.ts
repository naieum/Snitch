import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create users
  const admin = await prisma.user.upsert({
    where: { email: "admin@vibehealth.io" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@vibehealth.io",
      role: "admin",
      mrn: "MRN-000001",
      phone: "+15551000001",
      emailVerified: true,
      accounts: {
        create: {
          accountId: "admin@vibehealth.io",
          providerId: "credential",
          // password: "admin123" (hashed by better-auth)
          password: "$2a$10$xJ8Kq5K5K5K5K5K5K5K5KuYz7z7z7z7z7z7z7z7z7z7z7z7z7z7",
        },
      },
    },
  });

  const doctor = await prisma.user.upsert({
    where: { email: "dr.smith@vibehealth.io" },
    update: {},
    create: {
      name: "Dr. Sarah Smith",
      email: "dr.smith@vibehealth.io",
      role: "doctor",
      mrn: "MRN-000002",
      phone: "+15551000002",
      emailVerified: true,
      accounts: {
        create: {
          accountId: "dr.smith@vibehealth.io",
          providerId: "credential",
          password: "$2a$10$xJ8Kq5K5K5K5K5K5K5K5KuYz7z7z7z7z7z7z7z7z7z7z7z7z7z7",
        },
      },
    },
  });

  const patient = await prisma.user.upsert({
    where: { email: "patient@example.com" },
    update: {},
    create: {
      name: "John Doe",
      email: "patient@example.com",
      role: "patient",
      mrn: "MRN-100001",
      phone: "+15551000003",
      emailVerified: true,
      accounts: {
        create: {
          accountId: "patient@example.com",
          providerId: "credential",
          password: "$2a$10$xJ8Kq5K5K5K5K5K5K5K5KuYz7z7z7z7z7z7z7z7z7z7z7z7z7z7",
        },
      },
    },
  });

  // Create sample appointment
  await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      status: "scheduled",
      notes: "Annual checkup",
    },
  });

  // Create sample message
  await prisma.message.create({
    data: {
      senderId: patient.id,
      receiverId: doctor.id,
      content: "Hi Dr. Smith, I have a question about my medication.",
    },
  });

  // Create sample prescription
  await prisma.prescription.create({
    data: {
      patientId: patient.id,
      medication: "Amoxicillin",
      dosage: "500mg",
      instructions: "Take twice daily with food",
      doctorNotes: '<strong>Important:</strong> Complete full course <script>alert("xss")</script>',
      status: "active",
    },
  });

  // Create sample symptom check
  await prisma.symptomCheck.create({
    data: {
      userId: patient.id,
      symptoms: "Headache, mild fever, fatigue",
      aiResponse: "Based on your symptoms, this could be a common cold or flu. Rest, stay hydrated, and monitor your temperature. Seek medical attention if fever exceeds 103F.",
    },
  });

  console.log("Seed data created successfully");
  console.log({ admin: admin.email, doctor: doctor.email, patient: patient.email });
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
