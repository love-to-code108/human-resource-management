'use client';

import { useState, useEffect, useMemo } from 'react';
import { getTeamLeaveHistory } from '@/app/actions/userManagement';
import { Loader2, Search, History, CheckCircle2, XCircle, Clock, Calendar, ArrowRight, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeaveStatusTracker } from './LeaveStatusTracker';

export function TeamLeaveArchive() {
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [employeeFilter, setEmployeeFilter] = useState('ALL');

  // Dialog State
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    setIsLoading(true);
    const res = await getTeamLeaveHistory();
    if (res.success) {
      setLeaves(res.leaves);
    } else {
      toast.error(res.error || 'Failed to load team leave history');
    }
    setIsLoading(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="w-3 h-3 mr-1"/> Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1"/> Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="w-3 h-3 mr-1"/> Rejected</Badge>;
      case 'NEGOTIATING':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Clock className="w-3 h-3 mr-1"/> Negotiating</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Derive unique employees for the filter dropdown
  const uniqueEmployees = useMemo(() => {
    const map = new Map();
    leaves.forEach(l => {
      if (!map.has(l.applicant.id)) {
        map.set(l.applicant.id, l.applicant.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [leaves]);

  // Apply filters
  const filteredLeaves = useMemo(() => {
    return leaves.filter(leave => {
      const matchesSearch = leave.subject?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            leave.applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            leave.leaveType.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || leave.status === statusFilter;
      
      const matchesEmployee = employeeFilter === 'ALL' || leave.applicant.id === employeeFilter;

      return matchesSearch && matchesStatus && matchesEmployee;
    });
  }, [leaves, searchQuery, statusFilter, employeeFilter]);

  const openLeaveDetails = (leave) => {
    setSelectedLeave(leave);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex-1 p-6 lg:p-10 animate-in fade-in duration-500 h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8 pt-4 pb-16">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight">Team Leave History</h2>
          <p className="text-muted-foreground">Search and review past and present leave applications from your subordinates.</p>
        </div>

        {/* Filters Section */}
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, subject, or leave type..."
              className="pl-9 bg-background shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="w-full sm:w-[200px] bg-background">
                <SelectValue>
                  {employeeFilter === 'ALL' 
                    ? 'All Employees' 
                    : (uniqueEmployees.find(e => e.id === employeeFilter)?.name || 'All Employees')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Employees</SelectItem>
                {uniqueEmployees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px] bg-background">
                <SelectValue>
                  {statusFilter === 'ALL' ? 'All Statuses' : 
                   statusFilter === 'APPROVED' ? 'Approved' :
                   statusFilter === 'PENDING' ? 'Pending' :
                   statusFilter === 'REJECTED' ? 'Rejected' :
                   statusFilter === 'NEGOTIATING' ? 'Negotiating' : 'All Statuses'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="NEGOTIATING">Negotiating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table Section */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No leave records found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/50 hover:bg-transparent">
                  <TableHead className="w-[300px] text-xs uppercase tracking-wider font-semibold text-muted-foreground">Applicant</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Type</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Dates</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Applied On</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeaves.map((leave) => (
                  <TableRow 
                    key={leave.id} 
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => openLeaveDetails(leave)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border">
                          {leave.applicant.avatar ? (
                            <AvatarImage src={leave.applicant.avatar} alt={leave.applicant.name} />
                          ) : (
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                              {leave.applicant.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{leave.applicant.name}</span>
                          <span className="text-xs text-muted-foreground">{leave.applicant.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{leave.leaveType.name}</span>
                    </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span>{format(new Date(leave.fromDate), 'MMM d')}</span>
                          <ArrowRight className="w-3 h-3" />
                          <span>{format(new Date(leave.toDate), 'MMM d, yy')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(leave.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(leave.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          )}
        </div>

        {/* Leave Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[700px] border-border/50 shadow-md bg-card dark:bg-zinc-900/90 backdrop-blur-sm max-h-[90vh] overflow-y-auto">
            {selectedLeave && (
              <>
                <DialogHeader className="pb-4 border-b">
                  <div className="flex items-center justify-between pr-4">
                    <DialogTitle className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border">
                        {selectedLeave.applicant.avatar && <AvatarImage src={selectedLeave.applicant.avatar} alt={selectedLeave.applicant.name} />}
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                          {selectedLeave.applicant.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col text-left">
                        <div className="text-xl font-semibold tracking-tight">{selectedLeave.applicant.name}</div>
                        <div className="text-sm font-normal text-muted-foreground">
                          {selectedLeave.applicant.designation?.name} • {selectedLeave.applicant.department?.name}
                        </div>
                      </div>
                    </DialogTitle>
                    <div>
                      {getStatusBadge(selectedLeave.status)}
                    </div>
                  </div>
                </DialogHeader>

                <div className="py-4 space-y-6">
                  <div className="space-y-6">
                    {/* Requested Dates */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Requested Dates</h4>
                      <div className="flex items-center gap-2 text-base">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="font-medium">{format(new Date(selectedLeave.fromDate), 'MMM d, yyyy')}</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground mx-2" />
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="font-medium">{format(new Date(selectedLeave.toDate), 'MMM d, yyyy')}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {Math.ceil((new Date(selectedLeave.toDate) - new Date(selectedLeave.fromDate)) / (1000 * 60 * 60 * 24)) + 1} Days Requested
                      </p>
                    </div>

                    {/* Subject */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Subject</h4>
                      <p className="text-base font-semibold">{selectedLeave.subject || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Reason provided</h4>
                    <div 
                      className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground/90 bg-muted/20 p-4 rounded-lg border border-border/50"
                      dangerouslySetInnerHTML={{ __html: selectedLeave.reason }} 
                    />
                  </div>

                  {/* Status Tracker */}
                  <div className="space-y-4 pt-2">
                    <h4 className="font-medium text-sm border-b pb-2">Approval Status</h4>
                    <LeaveStatusTracker leave={selectedLeave} approvalChain={selectedLeave.approvalChain} />
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
