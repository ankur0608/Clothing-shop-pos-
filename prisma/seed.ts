import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "admin@pos.com";
  const rawPassword = "Admin@12345";
  const name = "Store Administrator";
  const role = "SUPER_ADMIN";

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(rawPassword, salt);

  // 1. Seed Admin
  const admin = await prisma.admin.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      isActive: true,
    },
    create: {
      name,
      email,
      password: hashedPassword,
      role,
      isActive: true,
      isOnline: false,
    },
  });

  // 2. Seed Sample Product
  const sampleProduct = await prisma.product.upsert({
    where: { sku: "TSH-COT-BLK-01" },
    update: {},
    create: {
      name: "Classic Cotton Crewneck T-Shirt",
      sku: "TSH-COT-BLK-01",
      barcode: "890123456789",
      category: "Men",
      price: 24.99,
      costPrice: 9.5,
      size: "L",
      color: "Black",
      stock: 45,
      isActive: true,
    },
  });

  // 3. Seed Sample Coupon
  const sampleCoupon = await prisma.coupon.upsert({
    where: { code: "WELCOME20" },
    update: {},
    create: {
      code: "WELCOME20",
      description: "20% off for first-time store shoppers",
      discountType: "PERCENTAGE",
      discountValue: 20,
      minOrderAmount: 40,
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days validity
      usageLimit: 200,
      usedCount: 14,
      isActive: true,
    },
  });

  console.log("\n=========================================");
  console.log(" Database Seeded Successfully!");
  console.log("=========================================");
  console.log(` Admin:     ${admin.email} (Password: ${rawPassword})`);
  console.log(` Product:   ${sampleProduct.name} (${sampleProduct.sku})`);
  console.log(` Coupon:    ${sampleCoupon.code} (20% OFF, Used: ${sampleCoupon.usedCount}/${sampleCoupon.usageLimit})`);
  console.log("=========================================\n");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
