import { Handle, Position } from '@xyflow/react';
import { Briefcase, Building2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RoleNode({ data }) {
  const isGlobal = data.departmentName?.toLowerCase() === 'global' || data.departmentName?.toLowerCase() === 'uem jaipur' || !data.departmentName;

  return (
    <div className={cn(
      "relative min-w-[200px] rounded-xl border-2 bg-background p-4 shadow-sm transition-all hover:shadow-md",
      isGlobal ? "border-primary/50" : "border-border"
    )}>
      {/* Target handle (for incoming connections / "reports to") */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 border-2 border-background bg-muted-foreground"
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-2 rounded-lg",
            isGlobal ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {isGlobal ? <Briefcase className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-none">{data.designationName}</span>
            {!isGlobal && (
              <span className="text-xs text-muted-foreground mt-1">{data.departmentName}</span>
            )}
            {isGlobal && (
              <span className="text-[10px] uppercase tracking-wider text-primary/70 font-bold mt-1">University-wide</span>
            )}
          </div>
        </div>
      </div>

      {/* Source handle (for outgoing connections / "manager of") */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 border-2 border-background bg-primary"
      />
    </div>
  );
}
