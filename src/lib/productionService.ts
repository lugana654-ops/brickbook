import { prisma } from "./prisma";

export interface ProductionRecord {
  id: string;
  brickType: string;
  quantity: number;
  productionDate: string; // YYYY-MM-DD or ISO
  goodDate: string; // productionDate + 13 days
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory store fallback when PostgreSQL DATABASE_URL is not set
let memoryRecords: ProductionRecord[] = [
  {
    id: "demo-1",
    brickType: "4 inch",
    quantity: 400,
    productionDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    goodDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    notes: "Demo batch (Matured)",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-2",
    brickType: "6 inch",
    quantity: 250,
    productionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    goodDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    notes: "Demo batch (In Curing)",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function addProductionRecord(data: {
  brickType: string;
  quantity: number;
  productionDate: string; // YYYY-MM-DD
  notes?: string;
}) {
  const prodDate = new Date(data.productionDate);
  const goodDateObj = new Date(prodDate);
  goodDateObj.setDate(goodDateObj.getDate() + 13);
  const goodDateStr = goodDateObj.toISOString().split("T")[0];

  if (process.env.DATABASE_URL) {
    try {
      const record = await prisma.production.create({
        data: {
          brickType: data.brickType,
          quantity: data.quantity,
          productionDate: prodDate,
          goodDate: goodDateObj,
          notes: data.notes || null,
        },
      });
      return {
        id: record.id,
        brickType: record.brickType,
        quantity: record.quantity,
        productionDate: record.productionDate.toISOString().split("T")[0],
        goodDate: record.goodDate.toISOString().split("T")[0],
        notes: record.notes || undefined,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      };
    } catch (err) {
      console.warn("Prisma DB write failed, falling back to memory store:", err);
    }
  }

  // Fallback memory store
  const newRecord: ProductionRecord = {
    id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    brickType: data.brickType,
    quantity: data.quantity,
    productionDate: data.productionDate,
    goodDate: goodDateStr,
    notes: data.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryRecords.unshift(newRecord);
  return newRecord;
}

export async function getAllProductionRecords() {
  if (process.env.DATABASE_URL) {
    try {
      const records = await prisma.production.findMany({
        orderBy: { productionDate: "desc" },
      });
      return records.map((r: any) => ({
        id: r.id,
        brickType: r.brickType,
        quantity: r.quantity,
        productionDate: r.productionDate.toISOString().split("T")[0],
        goodDate: r.goodDate.toISOString().split("T")[0],
        notes: r.notes || undefined,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }));
    } catch (err) {
      console.warn("Prisma DB read failed, falling back to memory store:", err);
    }
  }

  return memoryRecords;
}

export async function getDashboardStats() {
  const records = await getAllProductionRecords();

  const todayStr = new Date().toISOString().split("T")[0];
  const todayNow = new Date();

  let today4inch = 0;
  let today6inch = 0;
  let total4inch = 0;
  let total6inch = 0;
  let good4inch = 0;
  let good6inch = 0;
  let curingBricksTotal = 0;
  let goodBricksTotal = 0;

  for (const r of records) {
    const isToday = r.productionDate === todayStr;
    const goodDateObj = new Date(r.goodDate);
    const isGood = todayNow >= goodDateObj;

    if (r.brickType === "4 inch") {
      total4inch += r.quantity;
      if (isToday) today4inch += r.quantity;
      if (isGood) good4inch += r.quantity;
    } else if (r.brickType === "6 inch") {
      total6inch += r.quantity;
      if (isToday) today6inch += r.quantity;
      if (isGood) good6inch += r.quantity;
    }

    if (isGood) {
      goodBricksTotal += r.quantity;
    } else {
      curingBricksTotal += r.quantity;
    }
  }

  return {
    today4inch,
    today6inch,
    total4inch,
    total6inch,
    good4inch,
    good6inch,
    goodBricksTotal,
    curingBricksTotal,
    totalRecords: records.length,
  };
}
