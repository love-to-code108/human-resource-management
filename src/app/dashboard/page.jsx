export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Leaveflow</h1>
        <p className="text-muted-foreground">
          Select an option from the sidebar to manage leave requests, configure the approval hierarchy, or view system analytics.
        </p>
      </div>
    </div>
  );
}
