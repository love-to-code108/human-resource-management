import { Handle, Position } from '@xyflow/react';
import { Briefcase, Building2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RoleNode({ data, selected }) {
  const isGlobal = data.departmentName?.toLowerCase() === 'global' || data.departmentName?.toLowerCase() === 'uem jaipur' || !data.departmentName;

  return (
    <div className={cn(
      "relative min-w-[220px] rounded-xl border bg-background p-4 shadow-sm transition-all duration-200",
      isGlobal ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/50 hover:shadow-md",
      selected && "border-primary shadow-lg ring-1 ring-primary"
    )}>
      {/* Source handle (for outgoing connections / "reports to") - Now at TOP */}
      <Handle 
        type="source" 
        position={Position.Top} 
        className="w-4 h-4 border-2 border-background bg-blue-500"
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-2 rounded-lg flex items-center justify-center",
            isGlobal ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {isGlobal ? <Briefcase className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-none">{data.designationName}</span>
            {!isGlobal && (
              <span className="text-xs text-muted-foreground mt-1">{data.departmentName}</span>
            )}
            {isGlobal && (
              <span className="text-[10px] uppercase tracking-wider text-primary font-bold mt-1">University-wide</span>
            )}
          </div>
        </div>
      </div>

      {/* Target handle (for incoming connections / "manager of") - Now at BOTTOM */}
      <Handle 
        type="target" 
        position={Position.Bottom} 
        className="w-4 h-4 border-2 border-background bg-green-500"
      />
    </div>
  );
}
