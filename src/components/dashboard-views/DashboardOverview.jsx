import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, Building2, Briefcase, CalendarClock, ArrowUpRight, Activity } from "lucide-react"

export function DashboardOverview() {
  return (
    <div className="flex-1 space-y-8 p-8 xl:p-12 animate-in fade-in duration-500">
      <div className="flex flex-col space-y-2 lg:flex-row lg:items-end lg:justify-between lg:space-y-0">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-muted-foreground text-sm font-medium">
            Monitor institutional leave metrics and organizational structure.
          </p>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Metric Card 1 */}
        <Card className="border-border/50 shadow-sm transition-all hover:shadow-md hover:border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-emerald-500 font-medium flex items-center mt-1">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              +4 this week
            </p>
          </CardContent>
        </Card>

        {/* Metric Card 2 */}
        <Card className="border-border/50 shadow-sm transition-all hover:shadow-md hover:border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Departments
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground font-medium mt-1">
              Active structural units
            </p>
          </CardContent>
        </Card>

        {/* Metric Card 3 */}
        <Card className="border-border/50 shadow-sm transition-all hover:shadow-md hover:border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Approvals
            </CardTitle>
            <CalendarClock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground font-medium mt-1">
              Requires immediate action
            </p>
          </CardContent>
        </Card>

        {/* Metric Card 4 */}
        <Card className="border-border/50 shadow-sm transition-all hover:shadow-md hover:border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              System Health
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-emerald-500 font-medium flex items-center mt-1">
              Hierarchy engine stable
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-border/50 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Recent Leave Activity</CardTitle>
            <CardDescription>
              Overview of the most recent applications across all departments.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
             <div className="flex-1 min-h-[250px] w-full flex items-center justify-center rounded-md border border-dashed border-border/60 bg-muted/20">
               <span className="text-sm text-muted-foreground font-medium tracking-wide">Activity Chart Area (Pending Data)</span>
             </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">System Status</CardTitle>
            <CardDescription>
              Current state of the hierarchy engine and routing.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-6">
                <div className="flex items-center">
                   <span className="relative flex h-2.5 w-2.5 mr-4">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                   </span>
                   <div className="space-y-1">
                     <p className="text-sm font-medium leading-none">Database Connection</p>
                     <p className="text-xs text-muted-foreground">Prisma client connected and synced.</p>
                   </div>
                   <div className="ml-auto font-medium text-sm text-emerald-500">Active</div>
                </div>

                <div className="flex items-center">
                   <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 mr-4" />
                   <div className="space-y-1">
                     <p className="text-sm font-medium leading-none">Hierarchy Routing</p>
                     <p className="text-xs text-muted-foreground">Approval chains are fully mapped.</p>
                   </div>
                   <div className="ml-auto font-medium text-sm text-emerald-500">Stable</div>
                </div>

                <div className="flex items-center">
                   <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 mr-4" />
                   <div className="space-y-1">
                     <p className="text-sm font-medium leading-none">Authentication</p>
                     <p className="text-xs text-muted-foreground">Secure session handling active.</p>
                   </div>
                   <div className="ml-auto font-medium text-sm text-emerald-500">Secure</div>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
