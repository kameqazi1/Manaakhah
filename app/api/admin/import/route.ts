import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";
import { importFromCSV, importFromJSON } from "@/lib/scraper/scraper";
import { CSVImportRow, JSONImportData } from "@/lib/scraper/types";

// Force dynamic rendering - prevents static analysis during build
export const dynamic = "force-dynamic";

// POST /api/admin/import - Import businesses from CSV or JSON
export async function POST(req: Request) {
  try {
    let userId: string | null = null;
    let userRole: string | null = null;

    if (isMockMode()) {
      userId = req.headers.get("x-user-id");
      userRole = req.headers.get("x-user-role");
    }

    // Check admin authorization
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { format, data, options } = body;

    if (!format || !data) {
      return NextResponse.json(
        { error: "Format and data are required" },
        { status: 400 }
      );
    }

    // Parse options
    const importOptions = {
      skipDuplicates: options?.skipDuplicates !== false,
      validateData: options?.validateData !== false,
      updateExisting: options?.updateExisting || false,
      city: options?.city || "Fremont",
      state: options?.state || "CA",
    };

    let result;

    if (format === "csv") {
      // Parse CSV data
      const rows = parseCSV(data);
      if (rows.length === 0) {
        return NextResponse.json(
          { error: "No valid rows found in CSV data" },
          { status: 400 }
        );
      }

      result = await importFromCSV(rows, importOptions);
    } else if (format === "json") {
      // Parse JSON data
      let jsonData: JSONImportData;
      try {
        jsonData = typeof data === "string" ? JSON.parse(data) : data;
      } catch (e) {
        return NextResponse.json(
          { error: "Invalid JSON format" },
          { status: 400 }
        );
      }

      if (!jsonData.businesses || !Array.isArray(jsonData.businesses)) {
        return NextResponse.json(
          { error: "JSON must contain a 'businesses' array" },
          { status: 400 }
        );
      }

      result = await importFromJSON(jsonData, importOptions);
    } else {
      return NextResponse.json(
        { error: "Unsupported format. Use 'csv' or 'json'" },
        { status: 400 }
      );
    }

    // Save imported businesses to database
    const savedBusinesses = [];
    const saveErrors: string[] = [];

    for (const business of result.businesses) {
      try {
        // Check for duplicates if enabled
        if (importOptions.skipDuplicates) {
          const existing = await db.scrapedBusiness.findFirst({
            where: {
              OR: [
                { name: business.name, address: business.address },
                business.phone ? { phone: business.phone } : {},
              ].filter(obj => Object.keys(obj).length > 0),
            },
          });

          if (existing) {
            if (importOptions.updateExisting) {
              // Update existing record
              const updated = await db.scrapedBusiness.update({
                where: { id: existing.id },
                data: {
                  category: business.category,
                  city: business.city,
                  state: business.state,
                  zipCode: business.zipCode,
                  latitude: business.latitude,
                  longitude: business.longitude,
                  phone: business.phone,
                  email: business.email,
                  website: business.website,
                  description: business.description,
                  metadata: {
                    ...((existing.metadata as object) || {}),
                    confidence: business.confidence,
                    tags: business.tags,
                    signals: business.signals,
                    verificationLevel: business.verificationLevel,
                    updatedAt: new Date().toISOString(),
                  },
                },
              });
              savedBusinesses.push(updated);
            } else {
              saveErrors.push(`Duplicate: ${business.name} already exists`);
            }
            continue;
          }
        }

        // Create new record
        const saved = await db.scrapedBusiness.create({
          data: {
            name: business.name,
            category: business.category,
            address: business.address,
            city: business.city,
            state: business.state,
            zipCode: business.zipCode,
            latitude: business.latitude || null,
            longitude: business.longitude || null,
            phone: business.phone || null,
            email: business.email || null,
            website: business.website || null,
            description: business.description || null,
            sourceUrl: business.sourceUrl || `import_${format}`,
            scrapedAt: new Date(),
            claimStatus: "PENDING_REVIEW",
            metadata: {
              source: business.source,
              confidence: business.confidence,
              tags: business.tags,
              signals: business.signals,
              verificationLevel: business.verificationLevel,
              importedAt: new Date().toISOString(),
            },
          },
        });

        savedBusinesses.push(saved);
      } catch (error) {
        saveErrors.push(`Failed to save ${business.name}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${format.toUpperCase()} import`,
      recordsProcessed: result.businesses.length,
      recordsImported: savedBusinesses.length,
      duplicatesSkipped: result.businesses.length - savedBusinesses.length,
      errors: [
        ...result.errors.map(e => e.message),
        ...saveErrors,
      ],
      stats: result.stats,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to process import" },
      { status: 500 }
    );
  }
}

/**
 * Parse CSV string into array of row objects
 */
function parseCSV(csvString: string): CSVImportRow[] {
  const lines = csvString.trim().split("\n");
  if (lines.length < 2) return [];

  // Parse header row
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());

  // Required fields
  const requiredFields = ["name", "address", "city", "state", "zipcode"];
  const hasRequiredFields = requiredFields.every(field =>
    headers.some(h => h === field || h === field.replace("_", ""))
  );

  if (!hasRequiredFields) {
    throw new Error(`CSV must contain headers: ${requiredFields.join(", ")}`);
  }

  // Parse data rows
  const rows: CSVImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[normalizeHeader(header)] = values[idx]?.trim() || "";
    });

    // Only include rows with required fields
    if (row.name && row.address && row.city && row.state) {
      rows.push(row as CSVImportRow);
    }
  }

  return rows;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

/**
 * Normalize header names to match expected fields
 */
function normalizeHeader(header: string): string {
  const mapping: Record<string, string> = {
    "zip": "zipCode",
    "zip_code": "zipCode",
    "zipcode": "zipCode",
    "postal_code": "zipCode",
    "phone_number": "phone",
    "telephone": "phone",
    "email_address": "email",
    "web": "website",
    "url": "website",
    "site": "website",
    "desc": "description",
    "about": "description",
    "type": "category",
    "business_type": "category",
    "tag": "tags",
    "label": "tags",
  };

  return mapping[header] || header;
}

// GET /api/admin/import/template - Get CSV template
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "businesses";

  const templates: Record<string, string> = {
    businesses: `name,address,city,state,zipCode,phone,email,website,category,description,tags
"Al-Noor Restaurant","123 Main St","Fremont","CA","94536","(510) 555-1234","info@alnoor.com","https://alnoor.com","RESTAURANT","Authentic halal Mediterranean cuisine","HALAL_VERIFIED,MUSLIM_OWNED"
"Barakah Market","456 Mission Blvd","Fremont","CA","94536","(510) 555-5678","shop@barakah.com","https://barakah.com","HALAL_FOOD","Fresh zabiha halal meat and groceries","ZABIHA_CERTIFIED,FAMILY_OWNED"`,
  };

  const template = templates[type] || templates.businesses;

  return new NextResponse(template, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${type}_template.csv"`,
    },
  });
}
