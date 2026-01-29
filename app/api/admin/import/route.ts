import { NextResponse } from "next/server";
import {
  importFromCSV,
  importFromJSON,
  parseCSV,
  validateCSVData,
} from "@/lib/scraper/scraper";
import type { CSVImportRow, JSONImportData } from "@/lib/scraper/import";
import { isAdmin } from "@/lib/admin-auth";

// Force dynamic rendering - prevents static analysis during build
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/import - Import businesses from CSV or JSON
 *
 * Imports business data and saves to ScrapedBusiness table for admin review.
 */
export async function POST(req: Request) {
  try {
    if (!(await isAdmin(req))) {
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
    const importConfig = {
      skipGeocoding: options?.skipGeocoding ?? false,
      skipDuplicateCheck: options?.skipDuplicates === false,
      verbose: options?.verbose ?? false,
    };

    if (format === "csv") {
      // Parse CSV data
      const rows = parseCSV(data);

      if (rows.length === 0) {
        return NextResponse.json(
          { error: "No valid rows found in CSV data" },
          { status: 400 }
        );
      }

      // Validate if requested
      if (options?.validateData !== false) {
        const { valid, errors } = validateCSVData(rows);

        if (errors.length > 0 && valid.length === 0) {
          return NextResponse.json(
            {
              error: "Validation failed",
              validationErrors: errors,
            },
            { status: 400 }
          );
        }

        // Use only valid rows
        const result = await importFromCSV(valid, importConfig);

        return NextResponse.json({
          success: result.success,
          message: `Processed ${rows.length} rows from CSV`,
          stats: {
            totalRows: rows.length,
            validRows: valid.length,
            imported: result.stats.imported,
            skipped: result.stats.skipped,
            errors: result.stats.errors,
            geocoded: result.stats.geocoded,
            duration: result.duration,
          },
          validationErrors: errors.length > 0 ? errors : undefined,
          importErrors: result.errors.map((e) => e.message),
        });
      }

      // Import without validation
      const result = await importFromCSV(rows, importConfig);

      return NextResponse.json({
        success: result.success,
        message: `Processed ${rows.length} rows from CSV`,
        stats: {
          totalRows: rows.length,
          imported: result.stats.imported,
          skipped: result.stats.skipped,
          errors: result.stats.errors,
          geocoded: result.stats.geocoded,
          duration: result.duration,
        },
        importErrors: result.errors.map((e) => e.message),
      });
    }

    if (format === "json") {
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

      const result = await importFromJSON(jsonData, importConfig);

      return NextResponse.json({
        success: result.success,
        message: `Processed ${jsonData.businesses.length} businesses from JSON`,
        stats: {
          totalBusinesses: jsonData.businesses.length,
          imported: result.stats.imported,
          skipped: result.stats.skipped,
          errors: result.stats.errors,
          geocoded: result.stats.geocoded,
          duration: result.duration,
        },
        importErrors: result.errors.map((e) => e.message),
      });
    }

    return NextResponse.json(
      { error: "Unsupported format. Use 'csv' or 'json'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      {
        error: "Failed to process import",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/import/template - Get CSV template
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "businesses";

  const templates: Record<string, string> = {
    businesses: `name,address,city,state,zipCode,phone,email,website,category,description,tags
"Al-Noor Restaurant","123 Main St","Fremont","CA","94536","(510) 555-1234","info@alnoor.com","https://alnoor.com","restaurant","Authentic halal Mediterranean cuisine","halal,zabiha"
"Barakah Market","456 Mission Blvd","Fremont","CA","94536","(510) 555-5678","shop@barakah.com","https://barakah.com","grocery","Fresh zabiha halal meat and groceries","halal,butcher"`,
  };

  const template = templates[type] || templates.businesses;

  return new NextResponse(template, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${type}_template.csv"`,
    },
  });
}
