"use client";

import { cn } from "./constants";

export type ElanParentSkeletonVariant = "prof" | "student" | "generic";

type ElanParentSkeletonProps = {
  variant?: ElanParentSkeletonVariant;
  minHeight?: number;
  className?: string;
};

function Pulse({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/80", className)}
      aria-hidden
    />
  );
}

function ProfSkeleton() {
  return (
    <div className="flex min-h-full w-full">
      <div className="hidden w-16 shrink-0 flex-col items-center gap-3 border-r border-border px-2 py-4 lg:flex">
        <Pulse className="h-10 w-10 rounded-full" />
        <Pulse className="h-8 w-8 rounded-xl" />
        <Pulse className="h-8 w-8 rounded-xl" />
        <Pulse className="h-8 w-8 rounded-xl" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-4 px-4 py-5 sm:px-6 lg:p-10">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <Pulse className="h-7 w-[min(18rem,72%)] max-w-md" />
            <Pulse className="h-4 w-[min(14rem,55%)]" />
          </div>
          <Pulse className="h-11 w-11 shrink-0 rounded-full" />
        </div>
        <Pulse className="h-24 w-full rounded-2xl" />
        <Pulse className="h-32 w-full rounded-2xl" />
      </div>
    </div>
  );
}

function StudentSkeleton() {
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <Pulse className="h-11 w-11 shrink-0 rounded-full" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Pulse className="h-4 w-[55%]" />
          <Pulse className="h-3 w-[40%]" />
        </div>
        <Pulse className="h-9 w-9 shrink-0 rounded-full" />
      </div>
      <Pulse className="h-28 w-full rounded-2xl" />
      <Pulse className="h-20 w-full rounded-2xl" />
      <Pulse className="h-20 w-full rounded-2xl" />
    </div>
  );
}

function GenericSkeleton() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center gap-4 px-6 py-8">
      <Pulse className="h-8 w-40" />
      <Pulse className="h-4 w-56" />
      <Pulse className="mt-4 h-10 w-full rounded-lg" />
      <Pulse className="h-10 w-full rounded-lg" />
      <Pulse className="h-10 w-full rounded-lg" />
    </div>
  );
}

/** Visible on the parent page while the proxied iframe loads (single loader). */
export function ElanParentSkeleton({
  variant = "generic",
  minHeight = 400,
  className,
}: ElanParentSkeletonProps) {
  const body =
    variant === "student" ? (
      <StudentSkeleton />
    ) : variant === "prof" ? (
      <ProfSkeleton />
    ) : (
      <GenericSkeleton />
    );

  return (
    <div
      className={cn(
        "absolute inset-0 z-10 overflow-auto bg-background",
        className,
      )}
      style={{ minHeight }}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Chargement"
    >
      {body}
      <p className="sr-only">Chargement…</p>
    </div>
  );
}

export function skeletonVariantFromSnapshot(
  role: string | undefined,
  landingPath: string | undefined,
): ElanParentSkeletonVariant {
  if (role === "student" || landingPath === "/eleve") return "student";
  if (role === "professor" || role === "admin" || landingPath === "/prof" || landingPath === "/admin") {
    return "prof";
  }
  return "generic";
}
