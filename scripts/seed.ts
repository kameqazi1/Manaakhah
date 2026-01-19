import { PrismaClient, BusinessTag } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...\n");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@manakhaah.com" },
    update: {},
    create: {
      email: "admin@manakhaah.com",
      name: "Admin User",
      password: adminPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  console.log("✅ Created admin user:", admin.email);

  // Create demo business owner
  const ownerPassword = await bcrypt.hash("owner123456", 12);
  const businessOwner = await prisma.user.upsert({
    where: { email: "owner@demo.com" },
    update: {},
    create: {
      email: "owner@demo.com",
      name: "Demo Business Owner",
      password: ownerPassword,
      role: "BUSINESS_OWNER",
      emailVerified: new Date(),
    },
  });
  console.log("✅ Created business owner:", businessOwner.email);

  // Create demo consumer
  const consumerPassword = await bcrypt.hash("consumer123456", 12);
  const consumer = await prisma.user.upsert({
    where: { email: "user@demo.com" },
    update: {},
    create: {
      email: "user@demo.com",
      name: "Demo User",
      password: consumerPassword,
      role: "CONSUMER",
      emailVerified: new Date(),
    },
  });
  console.log("✅ Created consumer:", consumer.email);

  // Create sample businesses
  const businesses = [
    {
      name: "Al-Noor Halal Kitchen",
      slug: "al-noor-halal-kitchen",
      description: "Authentic Middle Eastern cuisine with fresh halal ingredients. Family-owned restaurant serving the Bay Area community since 2015.",
      shortDescription: "Authentic Middle Eastern halal cuisine",
      category: "HALAL_FOOD" as const,
      address: "35900 Fremont Blvd",
      city: "Fremont",
      state: "CA",
      zipCode: "94536",
      latitude: 37.5585,
      longitude: -121.9833,
      phone: "(510) 555-0101",
      email: "info@alnoorhalal.com",
      website: "https://alnoorhalal.com",
      status: "PUBLISHED" as const,
      verificationStatus: "APPROVED" as const,
      priceRange: "MODERATE" as const,
      averageRating: 4.8,
      totalReviews: 127,
    },
    {
      name: "Bay Area Islamic Center",
      slug: "bay-area-islamic-center",
      description: "Community masjid offering daily prayers, Jummah services, weekend Islamic school, and various community programs.",
      shortDescription: "Community masjid with daily prayers",
      category: "MASJID" as const,
      address: "1375 N. Milpitas Blvd",
      city: "Milpitas",
      state: "CA",
      zipCode: "95035",
      latitude: 37.4419,
      longitude: -121.8969,
      phone: "(408) 555-0102",
      email: "info@baic.org",
      website: "https://baic.org",
      status: "PUBLISHED" as const,
      verificationStatus: "APPROVED" as const,
      priceRange: null,
      averageRating: 4.9,
      totalReviews: 89,
      jummahTime: "1:15 PM",
    },
    {
      name: "Reliable Auto Care",
      slug: "reliable-auto-care",
      description: "Trusted Muslim-owned auto repair shop serving the community with honest and reliable service. Specializing in all makes and models.",
      shortDescription: "Honest auto repair services",
      category: "AUTO_REPAIR" as const,
      address: "42000 Osgood Rd",
      city: "Fremont",
      state: "CA",
      zipCode: "94539",
      latitude: 37.5155,
      longitude: -121.9289,
      phone: "(510) 555-0103",
      email: "service@reliableautocare.com",
      status: "PUBLISHED" as const,
      verificationStatus: "APPROVED" as const,
      priceRange: "MODERATE" as const,
      averageRating: 4.7,
      totalReviews: 64,
    },
    {
      name: "Quran Academy",
      slug: "quran-academy",
      description: "Professional Quran memorization and Islamic studies tutoring for all ages. Experienced teachers with personalized learning plans.",
      shortDescription: "Quran and Islamic studies tutoring",
      category: "TUTORING" as const,
      address: "34567 Alvarado Niles Rd",
      city: "Union City",
      state: "CA",
      zipCode: "94587",
      latitude: 37.5934,
      longitude: -122.0438,
      phone: "(510) 555-0104",
      email: "info@quranacademy.com",
      website: "https://quranacademy.com",
      status: "PUBLISHED" as const,
      verificationStatus: "APPROVED" as const,
      priceRange: "MODERATE" as const,
      averageRating: 4.9,
      totalReviews: 156,
    },
    {
      name: "Halal Wellness Clinic",
      slug: "halal-wellness-clinic",
      description: "Female-friendly health services in a comfortable environment. Services include general checkups, women's health, and preventive care.",
      shortDescription: "Female-friendly health services",
      category: "HEALTH_WELLNESS" as const,
      address: "36000 Cedar Blvd",
      city: "Newark",
      state: "CA",
      zipCode: "94560",
      latitude: 37.5297,
      longitude: -122.0403,
      phone: "(510) 555-0105",
      email: "info@halalwellness.com",
      status: "PUBLISHED" as const,
      verificationStatus: "APPROVED" as const,
      priceRange: "PREMIUM" as const,
      averageRating: 4.6,
      totalReviews: 42,
    },
    {
      name: "Amanah Legal Services",
      slug: "amanah-legal-services",
      description: "Full-service law firm specializing in immigration, family law, and business legal services. Serving the Muslim community with integrity.",
      shortDescription: "Immigration and family law",
      category: "LEGAL_SERVICES" as const,
      address: "39876 Fremont Hub",
      city: "Fremont",
      state: "CA",
      zipCode: "94538",
      latitude: 37.5483,
      longitude: -121.9886,
      phone: "(510) 555-0106",
      email: "contact@amanahlegal.com",
      website: "https://amanahlegal.com",
      status: "PUBLISHED" as const,
      verificationStatus: "APPROVED" as const,
      priceRange: "PREMIUM" as const,
      averageRating: 4.8,
      totalReviews: 91,
    },
  ];

  for (const businessData of businesses) {
    const business = await prisma.business.upsert({
      where: { slug: businessData.slug },
      update: {},
      create: {
        ...businessData,
        ownerId: businessOwner.id,
        services: [],
        aidServices: [],
      },
    });

    // Add tags for each business
    const tags: BusinessTag[] = [BusinessTag.MUSLIM_OWNED];
    if (businessData.category === "HALAL_FOOD") {
      tags.push(BusinessTag.HALAL_VERIFIED);
    }
    if (businessData.category === "HEALTH_WELLNESS") {
      tags.push(BusinessTag.SISTERS_FRIENDLY);
    }

    for (const tag of tags) {
      await prisma.businessTagRelation.upsert({
        where: {
          businessId_tag: {
            businessId: business.id,
            tag,
          },
        },
        update: {},
        create: {
          businessId: business.id,
          tag,
        },
      });
    }

    console.log(`✅ Created business: ${business.name}`);
  }

  // Create sample reviews
  const sampleBusinesses = await prisma.business.findMany({ take: 3 });

  for (const business of sampleBusinesses) {
    // Check if review already exists
    const existingReview = await prisma.review.findFirst({
      where: {
        businessId: business.id,
        userId: consumer.id,
      },
    });

    if (!existingReview) {
      await prisma.review.create({
        data: {
          businessId: business.id,
          userId: consumer.id,
          rating: 5,
          title: "Excellent service!",
          content: "Had a wonderful experience. Highly recommend to the community!",
          status: "PUBLISHED",
          isVerified: true,
          verifiedAt: new Date(),
        },
      });
    }
  }
  console.log("✅ Created sample reviews");

  // Create sample community posts
  await prisma.communityPost.upsert({
    where: { id: "seed-post-1" },
    update: {},
    create: {
      id: "seed-post-1",
      authorId: admin.id,
      title: "Welcome to Manakhaah Community!",
      content: "We're excited to launch our community platform. Share your experiences, discover local businesses, and help strengthen our community.",
      postType: "ANNOUNCEMENT",
      status: "PUBLISHED",
      isPinned: true,
      tags: ["welcome", "community"],
    },
  });
  console.log("✅ Created community posts");

  console.log("\n🎉 Database seed completed successfully!\n");
  console.log("Demo accounts created:");
  console.log("  Admin: admin@manakhaah.com / admin123456");
  console.log("  Business Owner: owner@demo.com / owner123456");
  console.log("  Consumer: user@demo.com / consumer123456");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
