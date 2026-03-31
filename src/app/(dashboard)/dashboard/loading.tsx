export default function DashboardLoading() {
  return (
    <div className="animate-in fade-in duration-150 flex flex-col gap-4">
      <div className="h-8 w-48 rounded-md bg-muted" />
      <div className="h-4 w-full max-w-xl rounded bg-muted/80" />
      <div className="h-4 w-full max-w-lg rounded bg-muted/60" />
    </div>
  );
}
