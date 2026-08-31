export default function ProfileLoading() {
  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 animate-pulse rounded-[6px] bg-mist" />
        <div className="flex-1 space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-mist" />
          <div className="h-4 w-32 animate-pulse rounded bg-mist" />
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-mist/80" />
        ))}
      </div>
    </div>
  );
}
