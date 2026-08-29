export default function BoardLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="space-y-3">
        <div className="h-3 w-20 animate-pulse rounded bg-mist" />
        <div className="h-9 w-72 max-w-full animate-pulse rounded bg-mist" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-mist" />
      </div>
      <div className="mt-6 flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-mist" />
        ))}
      </div>
      <div className="mt-8 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-mist/80" />
        ))}
      </div>
    </div>
  );
}
