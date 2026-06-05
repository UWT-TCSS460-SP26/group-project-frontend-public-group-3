export default function SkeletonGrid({ columns = 3, rows = 2 }: Readonly<{ columns?: number; rows?: number }>) {
  const count = Math.max(1, columns * rows);
  const items = Array.from({ length: count }, (_, i) => `skeleton-${i + 1}`);
  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-3">
      {items.map((key) => (
        <div key={key} className="rounded-2xl bg-card p-4 shadow-sm">
          <div className="h-40 w-full animate-pulse rounded-md bg-mint-soft" />
          <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-mint-soft" />
        </div>
      ))}
    </div>
  );
}
