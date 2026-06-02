"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
};

export default function Pagination({ page, totalPages, total, limit }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-600">
        Showing {total === 0 ? 0 : from}–{to} of {total} tickets
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => goToPage(page - 1)}
        >
          Previous
        </Button>
        <span className="flex items-center px-3 text-sm text-gray-600">
          Page {page} of {totalPages || 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => goToPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
