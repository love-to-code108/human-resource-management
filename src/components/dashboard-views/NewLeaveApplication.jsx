'use client';

import React, { useState, useEffect } from 'react';
import { submitLeaveApplication, getMyLeaveBalances } from '@/app/actions/leave';
import { getApprovalChainForUser } from '@/app/actions/hierarchy';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Send, CalendarIcon, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { format } from 'date-fns';
import { useDashboardStore } from '@/store/dashboardStore';
import { cn } from '@/lib/utils';

export function NewLeaveApplication() {
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedLeaveTypeName, setSelectedLeaveTypeName] = useState('');
  const [fromDate, setFromDate] = useState();
  const [toDate, setToDate] = useState();
  const [subject, setSubject] = useState('');
  const [reason, setReason] = useState('');

  const [approvalChain, setApprovalChain] = useState([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const setActiveView = useDashboardStore((state) => state.setActiveView);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [leaveRes, chainRes] = await Promise.all([
        getMyLeaveBalances(),
        getApprovalChainForUser()
      ]);
      
      if (leaveRes.success) {
        setLeaveBalances(leaveRes.balances || []);
      } else {
        toast.error("Failed to load leave balances.");
      }

      if (chainRes.success) {
        setApprovalChain(chainRes.chain || []);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handlePreSubmit = (e) => {
    e.preventDefault();
    if (!selectedLeaveTypeName || !fromDate || !toDate || !subject || !reason) {
      toast.error("Please fill in all fields and provide a subject and reason.");
      return;
    }
    setIsConfirmDialogOpen(true);
  };

  const handleFinalSubmit = async () => {
    const typeId = leaveBalances.find(b => b.leaveType.name === selectedLeaveTypeName)?.leaveTypeId;
    if (!typeId) {
      toast.error("Invalid leave type selected.");
      return;
    }

    setIsSubmitting(true);
    const res = await submitLeaveApplication({
      leaveTypeId: typeId,
      fromDate: fromDate ? format(fromDate, 'yyyy-MM-dd') : '',
      toDate: toDate ? format(toDate, 'yyyy-MM-dd') : '',
      subject,
      reason,
    });

    setIsSubmitting(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Leave application submitted successfully!");
      setIsConfirmDialogOpen(false);
      setActiveView('my-status');
    }
  };

  const selectedBalance = leaveBalances.find(b => b.leaveType.name === selectedLeaveTypeName);
  const requestedDays = (fromDate && toDate) ? Math.ceil((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24)) + 1 : 0;
  const remainingAfter = selectedBalance ? (selectedBalance.totalDays - selectedBalance.usedDays - requestedDays) : 0;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 lg:p-10 animate-in fade-in duration-500 h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-12 pb-16 pt-4">
        
        {/* Main Page Header */}
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight">New Leave Application</h2>
          <p className="text-muted-foreground">
            Fill out the form below to request time off. Your request will be automatically routed to your manager based on the hierarchy.
          </p>
        </div>
        
        <div className="border-b border-border" />

        <form onSubmit={handlePreSubmit} className="space-y-12">
          
          {/* Section 1: Application Type */}
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium">1. Application Type</h3>
              <p className="text-sm text-muted-foreground">
                Select the category of leave you are requesting.
              </p>
            </div>
            
            <div className="grid gap-2 w-fit">
              <Label htmlFor="leaveType">Leave Type</Label>
              <Select value={selectedLeaveTypeName} onValueChange={setSelectedLeaveTypeName} required>
                <SelectTrigger id="leaveType" className="w-[280px]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveBalances.map((balance) => {
                    const available = balance.totalDays - balance.usedDays;
                    return (
                      <SelectItem key={balance.id} value={balance.leaveType.name} label={balance.leaveType.name}>
                        {balance.leaveType.name} ({available} days available)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-b border-border" />

          {/* Section 2: Duration */}
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium">2. Duration</h3>
              <p className="text-sm text-muted-foreground">
                Specify the start and end dates for your time off.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl">
              <div className="grid gap-2 w-fit">
                <Label htmlFor="fromDate">From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="fromDate"
                      variant={"outline"}
                      className={cn(
                        "w-[280px] justify-start text-left font-normal bg-background border-border/50",
                        !fromDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={setFromDate}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2 w-fit">
                <Label htmlFor="toDate">To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="toDate"
                      variant={"outline"}
                      className={cn(
                        "w-[280px] justify-start text-left font-normal bg-background border-border/50",
                        !toDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toDate ? format(toDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={toDate}
                      onSelect={setToDate}
                      disabled={(date) => {
                        const minDate = fromDate ? new Date(fromDate) : new Date();
                        minDate.setHours(0, 0, 0, 0);
                        return date < minDate;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="border-b border-border" />

          {/* Section 3: Justification */}
          <div className="space-y-6 pt-4">
            <h3 className="text-lg font-medium text-foreground">3. Reason for Leave</h3>
            
            <div className="grid gap-2 max-w-2xl">
              <Label>Subject</Label>
              <Input 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                placeholder="Brief subject of your leave (e.g., Sick Leave for Viral Fever)" 
              />
            </div>

            <div className="grid gap-2 max-w-3xl">
              <Label>Detailed Justification</Label>
              <RichTextEditor 
                content={reason} 
                onChange={setReason}
                placeholder="Provide a detailed reason for your leave application..."
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" size="lg">
              <Send className="w-4 h-4 mr-2" />
              Review Application
            </Button>
          </div>

        </form>

        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent className="sm:max-w-[500px] border-border/50 shadow-md bg-card dark:bg-zinc-900/90 backdrop-blur-sm max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Confirm Leave Application</DialogTitle>
              <DialogDescription>
                Please review the details of your leave application before submitting.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg border">
                <div className="col-span-2">
                  <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider font-semibold">Leave Type</span>
                  <Badge variant="default" className="text-sm px-3 py-1 bg-primary/90 text-primary-foreground shadow-sm">{selectedLeaveTypeName}</Badge>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider font-semibold">Subject</span>
                  <span className="font-medium text-foreground">{subject}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider font-semibold">Requested Dates</span>
                  <div className="font-medium text-foreground flex items-center gap-1">
                    {fromDate ? format(fromDate, 'MMM d') : ''}
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    {toDate ? format(toDate, 'MMM d') : ''}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider font-semibold">Total Days</span>
                  <span className="font-medium text-foreground">{requestedDays} Days</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider font-semibold">Remaining Balance</span>
                  <span className={cn("font-medium", remainingAfter < 0 ? "text-destructive" : "text-emerald-600")}>
                    {remainingAfter} Days (after this leave)
                  </span>
                </div>
              </div>

              {remainingAfter < 0 && (
                <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                  Warning: This application exceeds your available leave balance and may be subject to unpaid leave or automatic rejection.
                </div>
              )}

              <div className="space-y-4 pt-2">
                <h4 className="font-medium text-sm border-b pb-2">Approval Chain</h4>
                {approvalChain.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No approvals required. (Auto-approve)</p>
                ) : (
                  <div className="relative pl-4 space-y-6 before:absolute before:left-[21px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                    {approvalChain.map((level, i) => (
                      <div key={i} className="relative flex items-start gap-4">
                        <div className="relative z-10 w-3 h-3 mt-1.5 rounded-full bg-primary ring-4 ring-background" />
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Level {i + 1}</span>
                          <div className="space-y-1">
                            {level.map((node, j) => (
                              <div key={j} className="text-sm font-medium">
                                {node.designation.name} <span className="text-muted-foreground font-normal">({node.department.name})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setIsConfirmDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleFinalSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Submit Application
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
