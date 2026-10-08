import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}

function HeaderSkeleton() {
  return (
    <div className="mb-7">
      <Skeleton className="h-8 w-56 max-w-full" />
      <Skeleton className="mt-3 h-4 w-72 max-w-full" />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 sm:p-5">
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="mt-4 h-6 w-32" />
      <Skeleton className="mt-2 h-3 w-24" />
    </div>
  );
}

function RowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-line/70 rounded-2xl border border-line bg-white">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="h-9 w-9 rounded-[10px]" />
          <div className="flex-1">
            <Skeleton className="h-4 w-48 max-w-full" />
            <Skeleton className="mt-2 h-3 w-28" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
      <HeaderSkeleton />
      <div className="space-y-5">
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-7">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-5 h-10 w-60 max-w-full sm:h-11 sm:w-72" />
          <Skeleton className="mt-3 h-3 w-48 max-w-full" />
          <div className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:gap-4 min-[1100px]:grid-cols-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <Skeleton className="mt-3 h-6 w-48" />
        <RowsSkeleton />
      </div>
    </div>
  );
}

export function TransactionsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading transactions">
      <HeaderSkeleton />
      <div className="mb-4 rounded-2xl border border-line bg-white p-4 sm:p-5">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-[10px]" />
          ))}
        </div>
      </div>
      <Skeleton className="mb-3 h-4 w-40" />
      <RowsSkeleton rows={8} />
    </div>
  );
}

export function AccountSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading account" className="max-w-4xl">
      <HeaderSkeleton />
      <div className="rounded-2xl border border-line bg-white p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="mt-2 h-4 w-60 max-w-full" />
          </div>
        </div>
        <div className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-4 w-40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard management">
      <HeaderSkeleton />
      <div className="space-y-5">
        <div className="rounded-2xl border border-line bg-white p-6">
          <div className="grid gap-6 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-2 h-4 w-40 max-w-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-white p-6">
          <Skeleton className="mb-5 h-4 w-56" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 min-[1360px]:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminFormSkeleton({ sections = 3 }: { sections?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading editor" className="max-w-4xl">
      <HeaderSkeleton />
      <div className="space-y-5">
        {Array.from({ length: sections }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-white p-5 sm:p-6">
            <Skeleton className="h-4 w-40" />
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <Skeleton className="h-3 w-32" />
                <Skeleton className="mt-2 h-12 w-full rounded-xl" />
              </div>
              <div>
                <Skeleton className="h-3 w-32" />
                <Skeleton className="mt-2 h-12 w-full rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminUsersSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading users">
      <HeaderSkeleton />
      <div className="mb-4 rounded-2xl border border-line bg-white p-4 sm:p-5">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="mt-4 flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-full" />
          ))}
        </div>
      </div>
      <RowsSkeleton rows={6} />
    </div>
  );
}
