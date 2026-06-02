import { TicketStatus } from "@prisma/client";
import { isOverdue, canResolve } from "@/services/ticketService";

describe("isOverdue", () => {
  const pastDate = new Date(Date.now() - 86400000 * 2);
  const futureDate = new Date(Date.now() + 86400000 * 2);

  it("returns true when dueDate is in the past and ticket is OPEN", () => {
    expect(isOverdue({ dueDate: pastDate, status: TicketStatus.OPEN })).toBe(true);
  });

  it("returns true when dueDate is in the past and ticket is IN_PROGRESS", () => {
    expect(isOverdue({ dueDate: pastDate, status: TicketStatus.IN_PROGRESS })).toBe(true);
  });

  it("returns true when dueDate is in the past and ticket is WAITING_ON_CLIENT", () => {
    expect(isOverdue({ dueDate: pastDate, status: TicketStatus.WAITING_ON_CLIENT })).toBe(true);
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

describe("canResolve", () => {
  it("returns false when there are no comments", () => {
    expect(canResolve(0)).toBe(false);
  });

  it("returns true when there is at least one comment", () => {
    expect(canResolve(1)).toBe(true);
  });

  it("returns true when there are multiple comments", () => {
    expect(canResolve(5)).toBe(true);
  });
});
