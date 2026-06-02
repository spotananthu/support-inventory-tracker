import { createSwaggerSpec } from "next-swagger-doc";

export function getApiDocs() {
  return createSwaggerSpec({
    apiFolder: "app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Support Ticket & Inventory Issue Tracker API",
        version: "1.0.0",
        description: "Internal support ticket management API for ERP, healthcare, e-commerce, and integration projects.",
      },
      tags: [
        { name: "Tickets", description: "Ticket CRUD operations" },
        { name: "Comments", description: "Ticket comments" },
        { name: "Clients", description: "Client management" },
        { name: "Engineers", description: "Engineer management" },
        { name: "Dashboard", description: "Summary statistics" },
        { name: "Export", description: "CSV export" },
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "next-auth.session-token",
          },
        },
        schemas: {
          Ticket: {
            type: "object",
            properties: {
              id: { type: "string", example: "cmpwd123abc" },
              title: { type: "string", example: "Patient records not syncing after update" },
              description: { type: "string", example: "After the v2.3 update deployed last week..." },
              priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
              status: { type: "string", enum: ["OPEN", "IN_PROGRESS", "WAITING_ON_CLIENT", "RESOLVED", "CLOSED"] },
              module: { type: "string", enum: ["ERP", "HEALTHCARE", "ECOMMERCE", "INTEGRATION", "OTHER"] },
              clientId: { type: "string" },
              assignedTo: { type: "string", nullable: true },
              dueDate: { type: "string", format: "date-time", nullable: true },
              isOverdue: { type: "boolean" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          Comment: {
            type: "object",
            properties: {
              id: { type: "string" },
              message: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
              author: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  role: { type: "string", enum: ["ADMIN", "ENGINEER"] },
                },
              },
            },
          },
          ErrorResponse: {
            type: "object",
            properties: {
              error: { type: "string", example: "Validation failed" },
              details: { type: "object", additionalProperties: { type: "string" } },
            },
          },
          Pagination: {
            type: "object",
            properties: {
              page: { type: "integer", example: 1 },
              limit: { type: "integer", example: 20 },
              total: { type: "integer", example: 83 },
              totalPages: { type: "integer", example: 5 },
            },
          },
        },
      },
      security: [{ cookieAuth: [] }],
      paths: {
        "/api/tickets": {
          get: {
            tags: ["Tickets"],
            summary: "List tickets",
            description: "Returns a paginated, filterable list of tickets.",
            parameters: [
              { name: "page", in: "query", schema: { type: "integer", default: 1 } },
              { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
              { name: "search", in: "query", schema: { type: "string" }, description: "Search title and description" },
              { name: "status", in: "query", schema: { type: "string", enum: ["OPEN", "IN_PROGRESS", "WAITING_ON_CLIENT", "RESOLVED", "CLOSED"] } },
              { name: "priority", in: "query", schema: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] } },
              { name: "clientId", in: "query", schema: { type: "string" } },
              { name: "assignedTo", in: "query", schema: { type: "string" } },
              { name: "overdue", in: "query", schema: { type: "boolean" }, description: "Filter to overdue tickets only" },
              { name: "sortBy", in: "query", schema: { type: "string", enum: ["createdAt", "dueDate", "priority"], default: "createdAt" } },
              { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" } },
            ],
            responses: {
              200: {
                description: "Paginated ticket list",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        data: { type: "array", items: { $ref: "#/components/schemas/Ticket" } },
                        pagination: { $ref: "#/components/schemas/Pagination" },
                      },
                    },
                  },
                },
              },
              401: { description: "Unauthorised" },
            },
          },
          post: {
            tags: ["Tickets"],
            summary: "Create a ticket",
            description: "Admin only. Returns a warning field if priority is CRITICAL.",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["title", "description", "priority", "clientId", "module"],
                    properties: {
                      title: { type: "string", minLength: 5 },
                      description: { type: "string", minLength: 20 },
                      priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
                      clientId: { type: "string" },
                      module: { type: "string", enum: ["ERP", "HEALTHCARE", "ECOMMERCE", "INTEGRATION", "OTHER"] },
                      assignedTo: { type: "string", nullable: true },
                      dueDate: { type: "string", format: "date-time", nullable: true },
                    },
                  },
                },
              },
            },
            responses: {
              201: { description: "Ticket created. Includes warning field if CRITICAL." },
              400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
              401: { description: "Unauthorised" },
              403: { description: "Forbidden — Admin only" },
            },
          },
        },
        "/api/tickets/{id}": {
          get: {
            tags: ["Tickets"],
            summary: "Get ticket by ID",
            description: "Returns full ticket detail including client, engineer, comments, and audit log.",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              200: { description: "Ticket detail with comments and audit log" },
              401: { description: "Unauthorised" },
              404: { description: "Ticket not found" },
            },
          },
          patch: {
            tags: ["Tickets"],
            summary: "Update a ticket",
            description: "Update title, description, status, priority, module, assignedTo, or dueDate. Status changes and field updates are logged to the audit trail. Cannot set status to RESOLVED without at least one comment.",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      title: { type: "string", minLength: 5 },
                      description: { type: "string", minLength: 20 },
                      status: { type: "string", enum: ["OPEN", "IN_PROGRESS", "WAITING_ON_CLIENT", "RESOLVED", "CLOSED"] },
                      priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
                      module: { type: "string", enum: ["ERP", "HEALTHCARE", "ECOMMERCE", "INTEGRATION", "OTHER"] },
                      assignedTo: { type: "string", nullable: true },
                      dueDate: { type: "string", format: "date-time", nullable: true },
                    },
                  },
                },
              },
            },
            responses: {
              200: { description: "Updated ticket" },
              400: { description: "Validation error or business rule violation (e.g. Resolve without comment)" },
              401: { description: "Unauthorised" },
              404: { description: "Ticket not found" },
            },
          },
          delete: {
            tags: ["Tickets"],
            summary: "Soft-delete a ticket",
            description: "Admin only. Sets deletedAt timestamp. Ticket is excluded from all queries but data is preserved.",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              200: { description: "Ticket soft-deleted" },
              401: { description: "Unauthorised" },
              403: { description: "Forbidden — Admin only" },
              404: { description: "Ticket not found" },
            },
          },
        },
        "/api/tickets/{id}/comments": {
          post: {
            tags: ["Comments"],
            summary: "Add a comment to a ticket",
            description: "Any authenticated user can comment. Author is set from the session.",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["message"],
                    properties: {
                      message: { type: "string", minLength: 1 },
                    },
                  },
                },
              },
            },
            responses: {
              201: { description: "Comment created" },
              400: { description: "Empty message" },
              401: { description: "Unauthorised" },
              404: { description: "Ticket not found" },
            },
          },
        },
        "/api/tickets/export": {
          get: {
            tags: ["Export"],
            summary: "Export tickets as CSV",
            description: "Downloads filtered tickets as a CSV file. Accepts the same filter params as GET /api/tickets.",
            parameters: [
              { name: "status", in: "query", schema: { type: "string" } },
              { name: "priority", in: "query", schema: { type: "string" } },
              { name: "clientId", in: "query", schema: { type: "string" } },
              { name: "assignedTo", in: "query", schema: { type: "string" } },
              { name: "overdue", in: "query", schema: { type: "boolean" } },
            ],
            responses: {
              200: { description: "CSV file download", content: { "text/csv": {} } },
              401: { description: "Unauthorised" },
            },
          },
        },
        "/api/clients": {
          get: {
            tags: ["Clients"],
            summary: "List active clients",
            description: "Returns active clients for use in dropdowns and filters.",
            responses: {
              200: {
                description: "List of active clients",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              contactEmail: { type: "string" },
                              status: { type: "string" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              401: { description: "Unauthorised" },
            },
          },
        },
        "/api/engineers": {
          get: {
            tags: ["Engineers"],
            summary: "List all engineers",
            description: "Returns all users for assignment dropdowns.",
            responses: {
              200: { description: "List of engineers/users" },
              401: { description: "Unauthorised" },
            },
          },
        },
        "/api/dashboard": {
          get: {
            tags: ["Dashboard"],
            summary: "Get dashboard statistics",
            description: "Returns ticket counts by status and priority, overdue count, tickets per engineer, and 5 most recent tickets.",
            responses: {
              200: {
                description: "Dashboard statistics",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            byStatus: { type: "object" },
                            byPriority: { type: "object" },
                            overdueCount: { type: "integer" },
                            ticketsPerEngineer: { type: "array" },
                            recentTickets: { type: "array" },
                          },
                        },
                      },
                    },
                  },
                },
              },
              401: { description: "Unauthorised" },
            },
          },
        },
      },
    },
  });
}
