-- Add unique constraint on Client.contactEmail
ALTER TABLE "clients" ADD CONSTRAINT "clients_contactEmail_key" UNIQUE ("contactEmail");

-- Add onDelete rules to existing foreign keys
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_clientId_fkey";
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "tickets" DROP CONSTRAINT "tickets_assignedTo_fkey";
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignedTo_fkey"
  FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "comments" DROP CONSTRAINT "comments_authorId_fkey";
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add indexes for common filter queries
CREATE INDEX "tickets_clientId_idx" ON "tickets"("clientId");
CREATE INDEX "tickets_assignedTo_idx" ON "tickets"("assignedTo");
CREATE INDEX "tickets_status_deletedAt_idx" ON "tickets"("status", "deletedAt");
CREATE INDEX "tickets_priority_deletedAt_idx" ON "tickets"("priority", "deletedAt");
