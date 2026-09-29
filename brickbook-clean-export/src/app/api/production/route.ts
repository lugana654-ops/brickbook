import { NextResponse } from "next/server";
import {
  addProductionRecord,
  getAllProductionRecords,
  ProductionRecord,
} from "@/lib/productionService";

export async function GET() {
  try {
    const records = await getAllProductionRecords();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const enrichedRecords = records.map((r: ProductionRecord) => {
      const goodDateObj = new Date(r.goodDate);
      goodDateObj.setHours(0, 0, 0, 0);

      const prodDateObj = new Date(r.productionDate);
      prodDateObj.setHours(0, 0, 0, 0);

      const isGood = today >= goodDateObj;
      const diffTime = goodDateObj.getTime() - today.getTime();
      const daysRemaining = Math.max(
        0,
        Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      );

      return {
        ...r,
        isGood,
        status: isGood ? "Good / Ready" : "In Curing",
        daysRemaining,
      };
    });

    return NextResponse.json({ success: true, records: enrichedRecords });
  } catch (error) {
    console.error("Error fetching production records:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch records" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { brickType, quantity, productionDate, notes } = body;

    if (!brickType || !quantity || !productionDate) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newRecord = await addProductionRecord({
      brickType,
      quantity: Number(quantity),
      productionDate,
      notes,
    });

    return NextResponse.json({ success: true, record: newRecord });
  } catch (error) {
    console.error("Error creating production record:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create record" },
      { status: 500 }
    );
  }
}
