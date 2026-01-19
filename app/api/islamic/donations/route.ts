import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const campaignSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(50).max(5000),
  goalAmount: z.number().min(100),
  currency: z.string().default("USD"),
  isZakatEligible: z.boolean().optional(),
  isSadaqah: z.boolean().optional(),
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z.string().optional().nullable().transform((s) => s ? new Date(s) : null),
  coverImage: z.string().url().optional().nullable(),
});

const donationSchema = z.object({
  campaignId: z.string(),
  amount: z.number().min(1),
  currency: z.string().default("USD"),
  isAnonymous: z.boolean().optional(),
  message: z.string().max(500).optional(),
});

// GET /api/islamic/donations - List campaigns or get specific campaign
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("campaignId");
    const businessId = searchParams.get("businessId");
    const type = searchParams.get("type"); // zakat, sadaqah, all
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    if (campaignId) {
      // Get specific campaign
      const campaign = await prisma.fundraisingCampaign.findUnique({
        where: { id: campaignId },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoImage: true,
              verificationStatus: true,
            },
          },
          donations: {
            where: { isAnonymous: false },
            select: {
              id: true,
              amount: true,
              message: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          _count: {
            select: { donations: true },
          },
        },
      });

      if (!campaign) {
        return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
      }

      return NextResponse.json({
        campaign: {
          ...campaign,
          donorCount: campaign._count.donations,
          progress: (campaign.currentAmount / campaign.goalAmount) * 100,
        },
      });
    }

    // List campaigns
    const where: any = { isActive: true };

    if (businessId) {
      where.businessId = businessId;
    }

    if (type === "zakat") {
      where.isZakatEligible = true;
    } else if (type === "sadaqah") {
      where.isSadaqah = true;
    }

    const [campaigns, total] = await Promise.all([
      prisma.fundraisingCampaign.findMany({
        where,
        include: {
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoImage: true,
            },
          },
          _count: {
            select: { donations: true },
          },
        },
        orderBy: [
          { currentAmount: "desc" },
          { createdAt: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.fundraisingCampaign.count({ where }),
    ]);

    return NextResponse.json({
      campaigns: campaigns.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description?.slice(0, 200) + (c.description?.length > 200 ? "..." : ""),
        goalAmount: c.goalAmount,
        currentAmount: c.currentAmount,
        progress: (c.currentAmount / c.goalAmount) * 100,
        currency: c.currency,
        isZakatEligible: c.isZakatEligible,
        isSadaqah: c.isSadaqah,
        coverImage: c.coverImage,
        donorCount: c._count.donations,
        business: c.business,
        startDate: c.startDate,
        endDate: c.endDate,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get campaigns error:", error);
    return NextResponse.json(
      { error: "Failed to get campaigns" },
      { status: 500 }
    );
  }
}

// POST /api/islamic/donations - Create campaign or make donation
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type } = body; // "campaign" or "donation"

    if (type === "campaign") {
      const validationResult = campaignSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Invalid input", details: validationResult.error.issues },
          { status: 400 }
        );
      }

      const { businessId } = body;

      // Verify user owns the business or is admin
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { ownerId: true, category: true },
      });

      if (!business) {
        return NextResponse.json({ error: "Business not found" }, { status: 404 });
      }

      if (business.ownerId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      // Only masjids and community aid can create zakat-eligible campaigns
      const canBeZakatEligible =
        business.category === "MASJID" || business.category === "COMMUNITY_AID";

      if (validationResult.data.isZakatEligible && !canBeZakatEligible) {
        return NextResponse.json(
          { error: "Only masjids and registered charities can create zakat-eligible campaigns" },
          { status: 400 }
        );
      }

      const campaign = await prisma.fundraisingCampaign.create({
        data: {
          businessId,
          title: validationResult.data.title,
          description: validationResult.data.description,
          goalAmount: validationResult.data.goalAmount,
          currency: validationResult.data.currency,
          isZakatEligible: validationResult.data.isZakatEligible && canBeZakatEligible,
          isSadaqah: validationResult.data.isSadaqah ?? true,
          startDate: validationResult.data.startDate,
          endDate: validationResult.data.endDate,
          coverImage: validationResult.data.coverImage,
        },
      });

      return NextResponse.json({ success: true, campaign });
    } else if (type === "donation") {
      const validationResult = donationSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Invalid input", details: validationResult.error.issues },
          { status: 400 }
        );
      }

      // Verify campaign exists and is active
      const campaign = await prisma.fundraisingCampaign.findUnique({
        where: { id: validationResult.data.campaignId },
        select: {
          id: true,
          isActive: true,
          businessId: true,
          title: true,
          currentAmount: true,
        },
      });

      if (!campaign) {
        return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
      }

      if (!campaign.isActive) {
        return NextResponse.json(
          { error: "This campaign is no longer accepting donations" },
          { status: 400 }
        );
      }

      // Create donation record
      const donation = await prisma.donation.create({
        data: {
          campaignId: validationResult.data.campaignId,
          donorId: session.user.id,
          amount: validationResult.data.amount,
          currency: validationResult.data.currency,
          isAnonymous: validationResult.data.isAnonymous ?? false,
          message: validationResult.data.message,
          // paymentId would be set after payment processing
        },
      });

      // Update campaign total
      await prisma.fundraisingCampaign.update({
        where: { id: validationResult.data.campaignId },
        data: {
          currentAmount: { increment: validationResult.data.amount },
        },
      });

      // Award karma points
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          karmaPoints: { increment: Math.min(Math.floor(validationResult.data.amount / 10), 50) },
        },
      });

      return NextResponse.json({
        success: true,
        donation: {
          id: donation.id,
          amount: donation.amount,
          message: "JazakAllah Khair for your donation!",
        },
      });
    }

    return NextResponse.json(
      { error: "Type must be 'campaign' or 'donation'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Create campaign/donation error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

// PUT /api/islamic/donations - Update campaign
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { campaignId, ...data } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const campaign = await prisma.fundraisingCampaign.findUnique({
      where: { id: campaignId },
      include: {
        business: { select: { ownerId: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.business.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updatedCampaign = await prisma.fundraisingCampaign.update({
      where: { id: campaignId },
      data: {
        title: data.title,
        description: data.description,
        goalAmount: data.goalAmount,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        coverImage: data.coverImage,
        isActive: data.isActive,
      },
    });

    return NextResponse.json({ success: true, campaign: updatedCampaign });
  } catch (error) {
    console.error("Update campaign error:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}
