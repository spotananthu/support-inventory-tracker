import {
  createTicketSchema,
  updateTicketSchema,
  createCommentSchema,
} from "@/lib/validations";

const validTicket = {
  title: "Login page broken",
  description: "Users cannot log in after the latest deployment to production.",
  priority: "HIGH",
  clientId: "client-001",
  module: "ERP",
};

describe("createTicketSchema", () => {
  it("passes with valid input", () => {
    const result = createTicketSchema.safeParse(validTicket);
    expect(result.success).toBe(true);
  });

  it("fails when title is shorter than 5 characters", () => {
    const result = createTicketSchema.safeParse({ ...validTicket, title: "Bug" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("title");
    }
  });

  it("fails when description is shorter than 20 characters", () => {
    const result = createTicketSchema.safeParse({ ...validTicket, description: "Too short" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("description");
    }
  });

  it("fails when clientId is missing", () => {
    const { clientId, ...rest } = validTicket;
    const result = createTicketSchema.safeParse(rest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("clientId");
    }
  });

  it("fails when priority is an invalid value", () => {
    const result = createTicketSchema.safeParse({ ...validTicket, priority: "URGENT" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("priority");
    }
  });

  it("accepts all valid priority values", () => {
    for (const priority of ["LOW", "MEDIUM", "HIGH", "CRITICAL"]) {
      const result = createTicketSchema.safeParse({ ...validTicket, priority });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all valid status values in update schema", () => {
    for (const status of ["OPEN", "IN_PROGRESS", "WAITING_ON_CLIENT", "RESOLVED", "CLOSED"]) {
      const result = updateTicketSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it("accepts optional fields as null or undefined", () => {
    const result = createTicketSchema.safeParse({ ...validTicket, assignedTo: null, dueDate: null });
    expect(result.success).toBe(true);
  });
});

describe("createCommentSchema", () => {
  it("passes with a valid message", () => {
    const result = createCommentSchema.safeParse({ message: "Fixed the issue.", authorId: "user-1" });
    expect(result.success).toBe(true);
  });

  it("fails when message is empty", () => {
    const result = createCommentSchema.safeParse({ message: "", authorId: "user-1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("message");
    }
  });

  it("fails when authorId is missing", () => {
    const result = createCommentSchema.safeParse({ message: "A valid comment" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("authorId");
    }
  });
});

describe("updateTicketSchema", () => {
  it("passes with partial fields — all fields are optional", () => {
    const result = updateTicketSchema.safeParse({ status: "IN_PROGRESS" });
    expect(result.success).toBe(true);
  });

  it("fails if status is an invalid enum value", () => {
    const result = updateTicketSchema.safeParse({ status: "PENDING" });
    expect(result.success).toBe(false);
  });

  it("passes with an empty object — no fields required", () => {
    const result = updateTicketSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
