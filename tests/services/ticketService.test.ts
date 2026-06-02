import { TicketStatus } from "@prisma/client";
import { isOverdue } from "@/services/ticketService";

describe("isOverdue", () => {
  const pastDate = new Date(Date.now() - 86400000 * 2);
  const futureDate = new Date(Date.now() + 86400000 * 2);

  it("returns true when dueDate is in the past and ticket is OPEN", () => {
    expect(isOverdue({ dueDate: pastDate, status: TicketStatus.OPEN })).toBe(true);
  });

  it("returns true when dueDate is in the past and ticket is IN_PROGRESS", () => {
    expect(isOverdue({ dueDate: pastDate, status: TicketStatus.IN_PROGRESS })).toBe(true);
  });

  it("returns false when dueDate is in the past but ticket is RESOLVED", () => {
    expect(isOverdue({ dueDate: pastDate, status: TicketStatus.RESOLVED })).toBe(false);
  });

  it("returns false when dueDate is in the past but ticket is CLOSED", () => {
    expect(isOverdue({ dueDate: pastDate, status: TicketStatus.CLOSED })).toBe(false);
  });

  it("returns false when dueDate is in the future", () => {
    expect(isOverdue({ dueDate: futureDate, status: TicketStatus.OPEN })).toBe(false);
  });

  it("returns false when dueDate is null", () => {
    expect(isOverdue({ dueDate: null, status: TicketStatus.OPEN })).toBe(false);
  });
});
