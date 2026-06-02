import { Badge } from "@/components/ui/badge";

const statusStyles: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800 border-blue-200",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800 border-yellow-200",
  WAITING_ON_CLIENT: "bg-purple-100 text-purple-800 border-purple-200",
  RESOLVED: "bg-green-100 text-green-800 border-green-200",
  CLOSED: "bg-gray-100 text-gray-700 border-gray-200",
};

const statusLabels: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  WAITING_ON_CLIENT: "Waiting on Client",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const priorityStyles: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700 border-gray-200",
  MEDIUM: "bg-blue-100 text-blue-800 border-blue-200",
  HIGH: "bg-orange-100 text-orange-800 border-orange-200",
  CRITICAL: "bg-red-100 text-red-800 border-red-200",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
        statusStyles[status] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
        priorityStyles[priority] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </span>
  );
}
