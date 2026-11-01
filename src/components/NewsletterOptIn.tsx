export function NewsletterOptIn() {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-sand/30 p-3 text-sm leading-relaxed">
      <input
        type="checkbox"
        name="newsletterOptIn"
        defaultChecked={false}
        className="mt-1 size-4 shrink-0 accent-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
      />
      <span>
        Send me class updates and news from this instructor.
        <span className="mt-1 block text-xs text-muted-foreground">
          Optional. Unsubscribe at any time.
        </span>
      </span>
    </label>
  );
}
