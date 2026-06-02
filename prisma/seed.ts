import { PrismaClient, Role, ClientStatus, Priority, TicketStatus, Module } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Users — 2 admins, 3 engineers
  const passwordHash = await bcrypt.hash("password123", 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "suresh.kumar@support.com" },
      update: {},
      create: { name: "Suresh Kumar", email: "suresh.kumar@support.com", passwordHash, role: Role.ADMIN },
    }),
    prisma.user.upsert({
      where: { email: "divya.nair@support.com" },
      update: {},
      create: { name: "Divya Nair", email: "divya.nair@support.com", passwordHash, role: Role.ADMIN },
    }),
    prisma.user.upsert({
      where: { email: "arjun.menon@support.com" },
      update: {},
      create: { name: "Arjun Menon", email: "arjun.menon@support.com", passwordHash, role: Role.ENGINEER },
    }),
    prisma.user.upsert({
      where: { email: "kavya.reddy@support.com" },
      update: {},
      create: { name: "Kavya Reddy", email: "kavya.reddy@support.com", passwordHash, role: Role.ENGINEER },
    }),
    prisma.user.upsert({
      where: { email: "venkat.raman@support.com" },
      update: {},
      create: { name: "Venkat Raman", email: "venkat.raman@support.com", passwordHash, role: Role.ENGINEER },
    }),
  ]);

  const [suresh, divya, arjun, kavya, venkat] = users;

  // Clients — 5 clients, mix of active/inactive
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { id: "client-001" },
      update: {},
      create: { id: "client-001", name: "MedCore Health Systems", contactEmail: "ops@medcore.in", status: ClientStatus.ACTIVE },
    }),
    prisma.client.upsert({
      where: { id: "client-002" },
      update: {},
      create: { id: "client-002", name: "RetailEdge Solutions", contactEmail: "tech@retailedge.com", status: ClientStatus.ACTIVE },
    }),
    prisma.client.upsert({
      where: { id: "client-003" },
      update: {},
      create: { id: "client-003", name: "Sakthi Enterprises ERP", contactEmail: "erp@sakthi.co.in", status: ClientStatus.ACTIVE },
    }),
    prisma.client.upsert({
      where: { id: "client-004" },
      update: {},
      create: { id: "client-004", name: "ConnectBridge Integrations", contactEmail: "support@connectbridge.io", status: ClientStatus.INACTIVE },
    }),
    prisma.client.upsert({
      where: { id: "client-005" },
      update: {},
      create: { id: "client-005", name: "Vimal Pharma Ltd", contactEmail: "it@vimalpharma.com", status: ClientStatus.ACTIVE },
    }),
  ]);

  const [medcore, retailedge, sakthi, connectbridge, vimalpharma] = clients;

  // Tickets — 20 tickets spread across statuses, priorities, some overdue
  const now = new Date();
  const pastDate = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000);
  const futureDate = (daysAhead: number) => new Date(now.getTime() + daysAhead * 86400000);

  const tickets = await Promise.all([
    // 1 - Critical, Open, overdue
    prisma.ticket.create({
      data: {
        title: "Patient records not syncing after update",
        description: "After the v2.3 update deployed last week, patient records from ward B are not syncing to the central database. Affecting 3 departments.",
        priority: Priority.CRITICAL,
        status: TicketStatus.OPEN,
        module: Module.HEALTHCARE,
        clientId: medcore.id,
        assignedTo: arjun.id,
        dueDate: pastDate(3),
      },
    }),
    // 2 - High, In Progress
    prisma.ticket.create({
      data: {
        title: "Inventory count mismatch on checkout",
        description: "Stock levels shown on the POS do not match actual warehouse inventory. Issue appears on high-volume SKUs during peak hours.",
        priority: Priority.HIGH,
        status: TicketStatus.IN_PROGRESS,
        module: Module.ECOMMERCE,
        clientId: retailedge.id,
        assignedTo: kavya.id,
        dueDate: futureDate(2),
      },
    }),
    // 3 - Medium, Waiting on Client
    prisma.ticket.create({
      data: {
        title: "GST report export showing incorrect tax slabs",
        description: "The monthly GST export is grouping 12% and 18% items together in a single row. Finance team cannot submit returns without this fix.",
        priority: Priority.MEDIUM,
        status: TicketStatus.WAITING_ON_CLIENT,
        module: Module.ERP,
        clientId: sakthi.id,
        assignedTo: venkat.id,
        dueDate: futureDate(5),
      },
    }),
    // 4 - High, Resolved (has comment)
    prisma.ticket.create({
      data: {
        title: "API webhook not firing on order completion",
        description: "The post-order webhook configured for third-party logistics is not being triggered when orders move to completed status in the system.",
        priority: Priority.HIGH,
        status: TicketStatus.RESOLVED,
        module: Module.INTEGRATION,
        clientId: connectbridge.id,
        assignedTo: arjun.id,
        dueDate: pastDate(1),
      },
    }),
    // 5 - Low, Closed
    prisma.ticket.create({
      data: {
        title: "Dashboard date filter not persisting on refresh",
        description: "Users report that the selected date range on the analytics dashboard resets to default every time the page is refreshed. Minor UX issue.",
        priority: Priority.LOW,
        status: TicketStatus.CLOSED,
        module: Module.ERP,
        clientId: sakthi.id,
        assignedTo: kavya.id,
        dueDate: pastDate(10),
      },
    }),
    // 6 - Critical, In Progress, overdue
    prisma.ticket.create({
      data: {
        title: "Billing module throwing 500 error on invoice generation",
        description: "Invoices cannot be generated for any client since yesterday afternoon. The billing module returns a 500 internal server error on submission. All billing operations are halted.",
        priority: Priority.CRITICAL,
        status: TicketStatus.IN_PROGRESS,
        module: Module.HEALTHCARE,
        clientId: vimalpharma.id,
        assignedTo: venkat.id,
        dueDate: pastDate(1),
      },
    }),
    // 7 - Medium, Open, unassigned
    prisma.ticket.create({
      data: {
        title: "Search results not returning partial matches",
        description: "Product search only returns exact matches. Customers typing partial product names get zero results. Needs fuzzy search or LIKE query fix.",
        priority: Priority.MEDIUM,
        status: TicketStatus.OPEN,
        module: Module.ECOMMERCE,
        clientId: retailedge.id,
        assignedTo: null,
        dueDate: futureDate(7),
      },
    }),
    // 8 - High, Open, overdue
    prisma.ticket.create({
      data: {
        title: "Payroll integration failing for new joiners",
        description: "Employees who joined after April 1st are not appearing in the payroll integration feed. HR is manually entering data as a workaround.",
        priority: Priority.HIGH,
        status: TicketStatus.OPEN,
        module: Module.ERP,
        clientId: sakthi.id,
        assignedTo: arjun.id,
        dueDate: pastDate(5),
      },
    }),
    // 9 - Low, Open
    prisma.ticket.create({
      data: {
        title: "Email notification template has wrong company logo",
        description: "The automated email notifications sent to patients are still showing the old company logo. Branding team has requested this be updated to the new logo.",
        priority: Priority.LOW,
        status: TicketStatus.OPEN,
        module: Module.HEALTHCARE,
        clientId: medcore.id,
        assignedTo: kavya.id,
        dueDate: futureDate(14),
      },
    }),
    // 10 - Medium, In Progress
    prisma.ticket.create({
      data: {
        title: "Third-party courier API timeout on bulk shipments",
        description: "When processing more than 50 shipments in a batch, the courier API integration times out at 30 seconds. Need to implement async processing or increase timeout threshold.",
        priority: Priority.MEDIUM,
        status: TicketStatus.IN_PROGRESS,
        module: Module.INTEGRATION,
        clientId: connectbridge.id,
        assignedTo: venkat.id,
        dueDate: futureDate(3),
      },
    }),
    // 11 - Critical, Open, overdue, unassigned
    prisma.ticket.create({
      data: {
        title: "Drug interaction alerts not displaying in prescription module",
        description: "Critical safety feature — the drug interaction alert system is silently failing. Pharmacists are not receiving warnings for contraindicated drug combinations entered in the system.",
        priority: Priority.CRITICAL,
        status: TicketStatus.OPEN,
        module: Module.HEALTHCARE,
        clientId: vimalpharma.id,
        assignedTo: null,
        dueDate: pastDate(2),
      },
    }),
    // 12 - High, Resolved
    prisma.ticket.create({
      data: {
        title: "Discount codes not applying at cart level",
        description: "Promotional discount codes entered during checkout are being accepted but not deducting from the order total. Affects all active campaigns.",
        priority: Priority.HIGH,
        status: TicketStatus.RESOLVED,
        module: Module.ECOMMERCE,
        clientId: retailedge.id,
        assignedTo: kavya.id,
        dueDate: pastDate(4),
      },
    }),
    // 13 - Medium, Waiting on Client
    prisma.ticket.create({
      data: {
        title: "Custom report builder not saving filter configurations",
        description: "Users who create and save custom report filters find that the saved configuration is lost after logging out. The saved reports list shows entries but filters are blank on load.",
        priority: Priority.MEDIUM,
        status: TicketStatus.WAITING_ON_CLIENT,
        module: Module.ERP,
        clientId: sakthi.id,
        assignedTo: arjun.id,
        dueDate: futureDate(6),
      },
    }),
    // 14 - Low, Closed
    prisma.ticket.create({
      data: {
        title: "Pagination breaks on mobile view for order history",
        description: "On screens smaller than 768px, the pagination controls on the order history page overlap with the footer. Cosmetic issue with no functional impact.",
        priority: Priority.LOW,
        status: TicketStatus.CLOSED,
        module: Module.ECOMMERCE,
        clientId: retailedge.id,
        assignedTo: venkat.id,
        dueDate: pastDate(15),
      },
    }),
    // 15 - High, In Progress
    prisma.ticket.create({
      data: {
        title: "SFTP file transfer dropping records intermittently",
        description: "The nightly SFTP job that transfers transaction records to the client's data warehouse is dropping approximately 2-3% of records on each run. Issue is non-deterministic.",
        priority: Priority.HIGH,
        status: TicketStatus.IN_PROGRESS,
        module: Module.INTEGRATION,
        clientId: connectbridge.id,
        assignedTo: arjun.id,
        dueDate: futureDate(1),
      },
    }),
    // 16 - Medium, Open
    prisma.ticket.create({
      data: {
        title: "Appointment booking showing slots already taken",
        description: "The online appointment booking portal is displaying time slots as available when they are already booked in the internal system. Double-bookings are occurring.",
        priority: Priority.MEDIUM,
        status: TicketStatus.OPEN,
        module: Module.HEALTHCARE,
        clientId: medcore.id,
        assignedTo: venkat.id,
        dueDate: futureDate(4),
      },
    }),
    // 17 - Critical, In Progress
    prisma.ticket.create({
      data: {
        title: "Stock replenishment alerts not triggering",
        description: "Automatic stock replenishment alerts configured for minimum threshold levels are not being sent. Warehouse team discovered three out-of-stock items that should have triggered alerts five days ago.",
        priority: Priority.CRITICAL,
        status: TicketStatus.IN_PROGRESS,
        module: Module.ECOMMERCE,
        clientId: retailedge.id,
        assignedTo: kavya.id,
        dueDate: futureDate(1),
      },
    }),
    // 18 - Low, Open
    prisma.ticket.create({
      data: {
        title: "Audit trail timestamps showing UTC instead of IST",
        description: "All timestamps in the audit trail module are displaying in UTC. Client users are confused as they expect IST. Needs timezone conversion on the frontend display.",
        priority: Priority.LOW,
        status: TicketStatus.OPEN,
        module: Module.OTHER,
        clientId: sakthi.id,
        assignedTo: divya.id,
        dueDate: futureDate(10),
      },
    }),
    // 19 - High, Open, overdue
    prisma.ticket.create({
      data: {
        title: "Purchase order approval workflow stuck at second level",
        description: "Purchase orders above Rs.50,000 require two-level approval. Orders are completing first-level approval but not routing to the second approver. Procurement is blocked.",
        priority: Priority.HIGH,
        status: TicketStatus.OPEN,
        module: Module.ERP,
        clientId: sakthi.id,
        assignedTo: suresh.id,
        dueDate: pastDate(2),
      },
    }),
    // 20 - Medium, Resolved
    prisma.ticket.create({
      data: {
        title: "Lab result PDF attachments not opening on iOS",
        description: "Patients using the mobile portal on iOS devices cannot open PDF lab result attachments. The file opens a blank screen. Android and desktop are unaffected.",
        priority: Priority.MEDIUM,
        status: TicketStatus.RESOLVED,
        module: Module.HEALTHCARE,
        clientId: medcore.id,
        assignedTo: divya.id,
        dueDate: pastDate(7),
      },
    }),
  ]);

  // Comments — 20 comments, all resolved tickets have at least one
  await Promise.all([
    // Ticket 4 (resolved) — resolution comment
    prisma.comment.create({
      data: {
        ticketId: tickets[3].id,
        authorId: arjun.id,
        message: "Root cause identified — the webhook handler had a null check on order.metadata that was failing silently. Fixed by adding a default empty object fallback. Deployed to production and confirmed webhooks are firing correctly for 10 consecutive test orders.",
      },
    }),
    // Ticket 5 (closed) — resolution comment
    prisma.comment.create({
      data: {
        ticketId: tickets[4].id,
        authorId: kavya.id,
        message: "Fixed by persisting the date filter selection to localStorage. The component now reads from localStorage on mount. Tested across Chrome, Firefox and Safari.",
      },
    }),
    // Ticket 12 (resolved) — investigation + resolution
    prisma.comment.create({
      data: {
        ticketId: tickets[11].id,
        authorId: kavya.id,
        message: "Investigated the cart service. The discount application logic was running before tax calculation, causing the tax to be computed on the pre-discount amount but the total to reflect the pre-discount price. Fixed the order of operations in CartService.applyPromotion().",
      },
    }),
    prisma.comment.create({
      data: {
        ticketId: tickets[11].id,
        authorId: suresh.id,
        message: "Verified fix in staging with 5 different promo codes. All applying correctly. Approved for production deployment.",
      },
    }),
    // Ticket 20 (resolved)
    prisma.comment.create({
      data: {
        ticketId: tickets[19].id,
        authorId: divya.id,
        message: "The issue was with the Content-Disposition header — it was set to inline for all file types. iOS Safari requires attachment for PDFs to open correctly. Updated the file serving middleware. Confirmed working on iPhone 14 and iPad.",
      },
    }),
    // Ticket 1 (critical, open)
    prisma.comment.create({
      data: {
        ticketId: tickets[0].id,
        authorId: arjun.id,
        message: "Checked the sync service logs. Seeing repeated connection timeout errors to the ward B database replica. Suspect a network configuration issue post-update. Escalating to infrastructure team.",
      },
    }),
    // Ticket 2 (in progress)
    prisma.comment.create({
      data: {
        ticketId: tickets[1].id,
        authorId: kavya.id,
        message: "Reproduced the issue on staging. The inventory cache is being invalidated correctly on stock updates but the POS reads from a separate read replica with a 5-minute lag. Looking into cache synchronisation strategy.",
      },
    }),
    // Ticket 6 (critical, in progress)
    prisma.comment.create({
      data: {
        ticketId: tickets[5].id,
        authorId: venkat.id,
        message: "Stack trace points to a null reference in InvoiceService when the client billing profile has no default payment method set. Happening after the March data migration moved some records. Preparing hotfix now.",
      },
    }),
    prisma.comment.create({
      data: {
        ticketId: tickets[5].id,
        authorId: suresh.id,
        message: "Hotfix reviewed and approved. Deploying to production in 30 minutes. Will monitor billing queue post-deployment.",
      },
    }),
    // Ticket 8 (high, open, overdue)
    prisma.comment.create({
      data: {
        ticketId: tickets[7].id,
        authorId: arjun.id,
        message: "The payroll integration query filters employees by a join_date field. The April batch used onboarding_date instead due to an HR system schema change. Need to update the field mapping in the integration config.",
      },
    }),
    // Ticket 10 (integration, in progress)
    prisma.comment.create({
      data: {
        ticketId: tickets[9].id,
        authorId: venkat.id,
        message: "Implemented a job queue for bulk shipment processing using a simple async worker. Batches above 20 are now split and processed with a 2-second interval between calls. Testing with 100-shipment batches now.",
      },
    }),
    // Ticket 13 (waiting on client)
    prisma.comment.create({
      data: {
        ticketId: tickets[12].id,
        authorId: arjun.id,
        message: "Cannot reproduce consistently on our end. Asked the client to record a screen capture of the exact steps when saving filters. Waiting on their response before proceeding.",
      },
    }),
    // Ticket 15 (SFTP, in progress)
    prisma.comment.create({
      data: {
        ticketId: tickets[14].id,
        authorId: arjun.id,
        message: "Added detailed logging to the SFTP transfer job. Ran 3 nights of data and the dropped records always occur when file size exceeds 8MB. Suspecting a buffer overflow in the chunked transfer logic.",
      },
    }),
    // Ticket 17 (critical, in progress)
    prisma.comment.create({
      data: {
        ticketId: tickets[16].id,
        authorId: kavya.id,
        message: "Alert scheduler service was not restarted after last week's server maintenance. It was running but its cron config had reset to disabled state. Restarted with correct config. Monitoring for 24 hours to confirm alerts are firing.",
      },
    }),
    // Ticket 19 (PO approval, overdue)
    prisma.comment.create({
      data: {
        ticketId: tickets[18].id,
        authorId: suresh.id,
        message: "Workflow engine config for multi-level approvals has a bug — the second approver routing rule references a deleted user role. Will fix the workflow definition and re-route the stuck approvals manually.",
      },
    }),
    // Ticket 3 (waiting on client)
    prisma.comment.create({
      data: {
        ticketId: tickets[2].id,
        authorId: venkat.id,
        message: "Asked client finance team to share a sample export file showing the incorrect grouping. Also need confirmation of which GST filing period is affected.",
      },
    }),
    // Ticket 16 (appointment double booking)
    prisma.comment.create({
      data: {
        ticketId: tickets[15].id,
        authorId: venkat.id,
        message: "Portal reads slot availability from a cached snapshot updated every 15 minutes. Internal system updates in real time. Will switch the portal to read directly from the primary availability table.",
      },
    }),
    // Ticket 11 (critical, drug alerts)
    prisma.comment.create({
      data: {
        ticketId: tickets[10].id,
        authorId: divya.id,
        message: "Assigning to Arjun as highest priority. Drug interaction service API key expired silently — the service is returning 401 but the prescription module is swallowing the error without displaying an alert. Temporary fix: renewed API key. Permanent fix: add proper error handling and alert fallback.",
      },
    }),
    // Ticket 9 (email logo)
    prisma.comment.create({
      data: {
        ticketId: tickets[8].id,
        authorId: kavya.id,
        message: "Located the email template in /templates/patient-notifications. Logo is hardcoded as a URL to the old CDN path. Will update to the new CDN path and test email rendering.",
      },
    }),
    // Ticket 18 (timestamps)
    prisma.comment.create({
      data: {
        ticketId: tickets[17].id,
        authorId: divya.id,
        message: "Confirmed the API is returning UTC timestamps as ISO strings. Timezone conversion should happen on the frontend. Will add a utility function to convert to IST for all audit trail displays.",
      },
    }),
  ]);

  // Audit logs — pre-seeded to show realistic history
  await Promise.all([
    prisma.auditLog.create({
      data: { ticketId: tickets[3].id, userId: suresh.id, field: "status", oldValue: "OPEN", newValue: "IN_PROGRESS" },
    }),
    prisma.auditLog.create({
      data: { ticketId: tickets[3].id, userId: arjun.id, field: "status", oldValue: "IN_PROGRESS", newValue: "RESOLVED" },
    }),
    prisma.auditLog.create({
      data: { ticketId: tickets[4].id, userId: kavya.id, field: "status", oldValue: "OPEN", newValue: "IN_PROGRESS" },
    }),
    prisma.auditLog.create({
      data: { ticketId: tickets[4].id, userId: kavya.id, field: "status", oldValue: "IN_PROGRESS", newValue: "RESOLVED" },
    }),
    prisma.auditLog.create({
      data: { ticketId: tickets[4].id, userId: suresh.id, field: "status", oldValue: "RESOLVED", newValue: "CLOSED" },
    }),
    prisma.auditLog.create({
      data: { ticketId: tickets[1].id, userId: divya.id, field: "status", oldValue: "OPEN", newValue: "IN_PROGRESS" },
    }),
    prisma.auditLog.create({
      data: { ticketId: tickets[1].id, userId: divya.id, field: "assignedTo", oldValue: "unassigned", newValue: "Kavya Reddy" },
    }),
    prisma.auditLog.create({
      data: { ticketId: tickets[0].id, userId: suresh.id, field: "priority", oldValue: "HIGH", newValue: "CRITICAL" },
    }),
    prisma.auditLog.create({
      data: { ticketId: tickets[11].id, userId: kavya.id, field: "status", oldValue: "OPEN", newValue: "IN_PROGRESS" },
    }),
    prisma.auditLog.create({
      data: { ticketId: tickets[11].id, userId: kavya.id, field: "status", oldValue: "IN_PROGRESS", newValue: "RESOLVED" },
    }),
    prisma.auditLog.create({
      data: { ticketId: tickets[5].id, userId: suresh.id, field: "assignedTo", oldValue: "unassigned", newValue: "Venkat Raman" },
    }),
    prisma.auditLog.create({
      data: { ticketId: tickets[19].id, userId: divya.id, field: "status", oldValue: "OPEN", newValue: "IN_PROGRESS" },
    }),
    prisma.auditLog.create({
      data: { ticketId: tickets[19].id, userId: divya.id, field: "status", oldValue: "IN_PROGRESS", newValue: "RESOLVED" },
    }),
    prisma.auditLog.create({
      data: { ticketId: tickets[2].id, userId: venkat.id, field: "status", oldValue: "OPEN", newValue: "WAITING_ON_CLIENT" },
    }),
    prisma.auditLog.create({
      data: { ticketId: tickets[18].id, userId: suresh.id, field: "priority", oldValue: "MEDIUM", newValue: "HIGH" },
    }),
  ]);

  console.log("Seeding complete.");
  console.log("Login credentials for all users: password123");
  console.log("Admins: suresh.kumar@support.com | divya.nair@support.com");
  console.log("Engineers: arjun.menon@support.com | kavya.reddy@support.com | venkat.raman@support.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
