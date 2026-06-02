import { z } from "zod";

export const createTicketSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  clientId: z.string().min(1, "Client is required"),
  assignedTo: z.string().optional().nullable(),
  module: z.enum(["ERP", "HEALTHCARE", "ECOMMERCE", "INTEGRATION", "OTHER"]),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
});

export const updateTicketSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").optional(),
  description: z.string().min(20, "Description must be at least 20 characters").optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_ON_CLIENT", "RESOLVED", "CLOSED"]).optional(),
  module: z.enum(["ERP", "HEALTHCARE", "ECOMMERCE", "INTEGRATION", "OTHER"]).optional(),
  assignedTo: z.string().optional().nullable(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
});

export const createCommentSchema = z.object({
  message: z.string().min(1, "Comment cannot be empty"),
  authorId: z.string().min(1, "Author is required"),
});

export const ticketFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_ON_CLIENT", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  clientId: z.string().optional(),
  assignedTo: z.string().optional(),
  sortBy: z.enum(["createdAt", "dueDate", "priority"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type TicketFilters = z.infer<typeof ticketFiltersSchema>;
