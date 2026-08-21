import { PrismaClient, Role, WorkOrderStatus, TransferStatus, OrderStatus, Item } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Clearing existing database tables...');
  await prisma.reservation.deleteMany();
  await prisma.customerOrderItem.deleteMany();
  await prisma.customerOrder.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.user.deleteMany();
  await prisma.item.deleteMany();
  await prisma.category.deleteMany();
  await prisma.location.deleteMany();

  console.log('[Seed] Creating Locations...');
  const bangalore = await prisma.location.create({
    data: {
      name: 'Bangalore Warehouse',
      code: 'BLR-WH',
      address: 'Plot 42, Electronic City Phase 1, Bangalore, Karnataka 560100'
    }
  });

  const chennai = await prisma.location.create({
    data: {
      name: 'Chennai Warehouse',
      code: 'MAA-WH',
      address: 'Industrial Estate, Guindy, Chennai, Tamil Nadu 600032'
    }
  });

  console.log('[Seed] Creating Users...');
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin Manager',
      email: 'admin@example.com',
      passwordHash,
      role: Role.ADMIN,
      locationId: bangalore.id
    }
  });

  const opsUser = await prisma.user.create({
    data: {
      name: 'Operations Specialist',
      email: 'operations@example.com',
      passwordHash,
      role: Role.OPERATIONS_USER,
      locationId: chennai.id
    }
  });

  const salesUser = await prisma.user.create({
    data: {
      name: 'Sales Executive',
      email: 'sales@example.com',
      passwordHash,
      role: Role.SALES_USER,
      locationId: bangalore.id
    }
  });

  console.log('[Seed] Creating Categories...');
  const electronicsCat = await prisma.category.create({ data: { name: 'Electronics' } });
  const componentsCat = await prisma.category.create({ data: { name: 'Components' } });
  const rawMaterialsCat = await prisma.category.create({ data: { name: 'Raw Materials' } });
  const packagingCat = await prisma.category.create({ data: { name: 'Packaging' } });
  const accessoriesCat = await prisma.category.create({ data: { name: 'Accessories' } });

  console.log('[Seed] Creating Items...');
  const itemsData = [
    { sku: 'ELEC-001', name: 'Industrial Microcontroller Unit', categoryId: electronicsCat.id, unit: 'PCS' },
    { sku: 'ELEC-002', name: 'IoT Telemetry Module v2', categoryId: electronicsCat.id, unit: 'PCS' },
    { sku: 'COMP-001', name: 'Precision Stepper Motor', categoryId: componentsCat.id, unit: 'PCS' },
    { sku: 'COMP-002', name: 'SMD Power Resistor Pack (1000x)', categoryId: componentsCat.id, unit: 'PACK' },
    { sku: 'RAW-001', name: 'Anodized Aluminum Alloy Extrusion', categoryId: rawMaterialsCat.id, unit: 'METERS' },
    { sku: 'RAW-002', name: 'Industrial Copper Busbar 10mm', categoryId: rawMaterialsCat.id, unit: 'KG' },
    { sku: 'PKG-001', name: 'Anti-Static ESD Protective Foam Box', categoryId: packagingCat.id, unit: 'BOX' },
    { sku: 'PKG-002', name: 'Heavy Duty Corrugated Shipping Carton', categoryId: packagingCat.id, unit: 'PCS' },
    { sku: 'ACC-001', name: 'Shielded USB-C Industrial Cable 2m', categoryId: accessoriesCat.id, unit: 'PCS' },
    { sku: 'ACC-002', name: 'DIN Rail Mounting Bracket Kit', categoryId: accessoriesCat.id, unit: 'SET' }
  ];

  const createdItems: Item[] = [];
  for (const item of itemsData) {
    const created = await prisma.item.create({ data: item });
    createdItems.push(created);
  }

  console.log('[Seed] Creating Initial Inventories...');
  // Item 0: Microcontroller
  await prisma.inventory.create({
    data: { itemId: createdItems[0].id, locationId: bangalore.id, physicalQuantity: 30, reservedQuantity: 0 }
  });
  await prisma.inventory.create({
    data: { itemId: createdItems[0].id, locationId: chennai.id, physicalQuantity: 50, reservedQuantity: 0 }
  });

  // Item 1: IoT Telemetry
  await prisma.inventory.create({
    data: { itemId: createdItems[1].id, locationId: bangalore.id, physicalQuantity: 100, reservedQuantity: 0 }
  });
  await prisma.inventory.create({
    data: { itemId: createdItems[1].id, locationId: chennai.id, physicalQuantity: 75, reservedQuantity: 0 }
  });

  // Item 2: Stepper Motor
  await prisma.inventory.create({
    data: { itemId: createdItems[2].id, locationId: bangalore.id, physicalQuantity: 15, reservedQuantity: 0 }
  });
  await prisma.inventory.create({
    data: { itemId: createdItems[2].id, locationId: chennai.id, physicalQuantity: 40, reservedQuantity: 0 }
  });

  // Create inventories for remaining items
  for (let i = 3; i < createdItems.length; i++) {
    await prisma.inventory.create({
      data: { itemId: createdItems[i].id, locationId: bangalore.id, physicalQuantity: 80, reservedQuantity: 0 }
    });
    await prisma.inventory.create({
      data: { itemId: createdItems[i].id, locationId: chennai.id, physicalQuantity: 60, reservedQuantity: 0 }
    });
  }

  console.log('[Seed] Creating Sample Customer...');
  const customer = await prisma.customer.create({
    data: {
      name: 'Acme Robotics Systems',
      phone: '+91 9876543210',
      email: 'procurement@acmerobotics.com',
      companyName: 'Acme Robotics Pvt Ltd'
    }
  });

  console.log('[Seed] Creating Sample Work Order...');
  await prisma.workOrder.create({
    data: {
      workOrderNumber: 'WO-1001',
      locationId: bangalore.id,
      itemId: createdItems[0].id,
      requiredQuantity: 50, // Available is 30 -> shortage is 20!
      assignedUserId: opsUser.id,
      status: WorkOrderStatus.ASSIGNED,
      createdBy: adminUser.email
    }
  });

  console.log('[Seed] Creating Sample Transfer...');
  await prisma.transfer.create({
    data: {
      transferNumber: 'TRF-1001',
      sourceLocationId: chennai.id,
      destinationLocationId: bangalore.id,
      itemId: createdItems[0].id,
      quantity: 20,
      status: TransferStatus.REQUESTED,
      createdBy: opsUser.email
    }
  });

  console.log('[Seed] Creating Sample Customer Order...');
  await prisma.customerOrder.create({
    data: {
      orderNumber: 'ORD-1001',
      customerId: customer.id,
      status: OrderStatus.DRAFT,
      createdBy: salesUser.email,
      items: {
        create: [
          {
            itemId: createdItems[1].id,
            quantity: 10,
            unitPrice: 2500.0
          }
        ]
      }
    }
  });

  console.log('[Seed] Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('[Seed Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
