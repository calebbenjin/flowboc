// Streams a neutral shell while the instructor + classes queries run, so a
// visitor sees the page taking shape instead of a blank tab.
export default function PublicPageLoading() {
  return (
    <div className="min-h-screen bg-sand/10" aria-busy="true" aria-label="Loading page">
      <div className="mx-auto max-w-3xl animate-pulse px-4 pt-14 pb-6 lg:px-0">
        <div className="flex flex-col items-center gap-4 px-2 sm:flex-row">
          <div className="size-38 shrink-0 rounded-full bg-foreground/10 sm:size-48" />
          <div className="flex w-full flex-col items-center gap-3 sm:items-start">
            <div className="h-8 w-48 rounded-md bg-foreground/10" />
            <div className="h-4 w-64 max-w-full rounded-md bg-foreground/10" />
            <div className="h-4 w-40 rounded-md bg-foreground/10" />
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-foreground/10" />
          ))}
        </div>
      </div>
    </div>
  );
}
