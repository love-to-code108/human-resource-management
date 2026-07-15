'use client';

import { useState, useEffect } from 'react';
import { getManagerApprovals, approveLeave, rejectLeave, proposeNewDates } from '@/app/actions/leave';
import { Loader2, Calendar, Check, X, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LeaveStatusTracker } from './LeaveStatusTracker';

export function LeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Propose Dates State
  const [isProposeOpen, setIsProposeOpen] = useState(false);
  const [proposingFor, setProposingFor] = useState(null);
  const [newFromDate, setNewFromDate] = useState('');
  const [newToDate, setNewToDate] = useState('');

  // Confirmation States
  const [approveConfirmId, setApproveConfirmId] = useState(null);
  const [rejectConfirmId, setRejectConfirmId] = useState(null);

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    setIsLoading(true);
    const res = await getManagerApprovals();
    if (res.success) {
      setLeaves(res.leaves);
    } else {
      toast.error(res.error);
    }
    setIsLoading(false);
  };

  const handleApprove = async (id) => {
    setProcessingId(id);
    const res = await approveLeave(id);
    if (res.success) {
      toast.success("Leave approved successfully.");
      await loadLeaves();
    } else {
      toast.error(res.error);
    }
    setProcessingId(null);
    setApproveConfirmId(null);
  };

  const handleReject = async (id) => {
    setProcessingId(id);
    const res = await rejectLeave(id);
    if (res.success) {
      toast.success("Leave rejected.");
      await loadLeaves();
    } else {
      toast.error(res.error);
    }
    setProcessingId(null);
    setRejectConfirmId(null);
  };

  const handleProposeSubmit = async (e) => {
    e.preventDefault();
    if (!newFromDate || !newToDate) {
      toast.error("Please select both dates.");
      return;
    }
    
    if (new Date(newFromDate) > new Date(newToDate)) {
      toast.error("From Date cannot be after To Date.");
      return;
    }

    setProcessingId(proposingFor.id);
    const res = await proposeNewDates(proposingFor.id, newFromDate, newToDate);
    if (res.success) {
      toast.success("Alternative dates proposed to applicant.");
      setIsProposeOpen(false);
      setProposingFor(null);
      setNewFromDate('');
      setNewToDate('');
      await loadLeaves();
    } else {
      toast.error(res.error);
    }
    setProcessingId(null);
  };

  const openProposeDialog = (leave) => {
    setProposingFor(leave);
    setNewFromDate(format(new Date(leave.fromDate), 'yyyy-MM-dd'));
    setNewToDate(format(new Date(leave.toDate), 'yyyy-MM-dd'));
    setIsProposeOpen(true);
  };

  return (
    <div className="flex-1 p-6 lg:p-10 animate-in fade-in duration-500 h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-12 pb-16 pt-4">
        
        {/* Main Page Header */}
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight">Leave Approvals</h2>
          <p className="text-muted-foreground">
            Review, approve, or negotiate leave applications pending your approval.
          </p>
        </div>
        
        <div className="border-b border-border" />

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
          </div>
        ) : leaves.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto bg-muted/50 text-muted-foreground">
              <Check className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-medium">You're all caught up!</h3>
              <p className="text-sm text-muted-foreground">There are no leave applications pending your approval right now.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {leaves.map((leave, index) => (
              <div key={leave.id} className="space-y-8">
                {/* Application Block */}
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border">
                        {leave.applicant.avatar && <AvatarImage src={leave.applicant.avatar} alt={leave.applicant.name} />}
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {leave.applicant.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-medium flex items-center gap-3">
                          {leave.applicant.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {leave.applicant.designation?.name} • {leave.applicant.department?.name}
                        </p>
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                        {leave.leaveType.name}
                      </span>
                      <p className="text-xs text-muted-foreground mt-2">
                        Applied on {format(new Date(leave.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Requested Dates */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Requested Dates</h4>
                      <div className="flex items-center gap-2 text-base">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="font-medium">{format(new Date(leave.fromDate), 'MMM d, yyyy')}</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground mx-2" />
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="font-medium">{format(new Date(leave.toDate), 'MMM d, yyyy')}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {Math.ceil((new Date(leave.toDate) - new Date(leave.fromDate)) / (1000 * 60 * 60 * 24)) + 1} Days Requested
                      </p>
                    </div>

                    {/* Subject */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Subject</h4>
                      <p className="text-base font-semibold">{leave.subject || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Reason provided</h4>
                    <div 
                      className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground/90"
                      dangerouslySetInnerHTML={{ __html: leave.reason }} 
                    />
                  </div>

                  {/* Status Tracker */}
                  <div className="space-y-4 pt-2">
                    <h4 className="font-medium text-sm border-b pb-2">Approval Status</h4>
                    <LeaveStatusTracker leave={leave} approvalChain={leave.approvalChain} />
                  </div>

                  <div className="pt-4 mt-2 flex flex-wrap items-center justify-end gap-3 border-t border-border/50 border-dashed">
                    <Button 
                      variant="outline"
                      onClick={() => openProposeDialog(leave)}
                      disabled={processingId === leave.id}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Propose Dates
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => setRejectConfirmId(leave.id)}
                      disabled={processingId === leave.id}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button 
                      onClick={() => setApproveConfirmId(leave.id)}
                      disabled={processingId === leave.id}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white"
                    >
                      {processingId === leave.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                      Approve
                    </Button>
                  </div>
                </div>

                {/* Divider for next item */}
                {index < leaves.length - 1 && (
                  <div className="border-b border-border" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Propose Dates Dialog */}
        <Dialog open={isProposeOpen} onOpenChange={setIsProposeOpen}>
          <DialogContent className="sm:max-w-[425px] border-border/50 shadow-md bg-card dark:bg-zinc-900/90 backdrop-blur-sm" showCloseButton={false}>
            <form onSubmit={handleProposeSubmit}>
              <DialogHeader>
                <DialogTitle>Propose Alternative Dates</DialogTitle>
                <DialogDescription>
                  Suggest different dates for {proposingFor?.applicant.name}'s leave application. 
                  They will be able to review and accept or withdraw their application.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-6">
                <div className="grid gap-2">
                  <Label htmlFor="fromDate">Suggested Start Date</Label>
                  <Input 
                    id="fromDate" 
                    type="date" 
                    value={newFromDate}
                    onChange={(e) => setNewFromDate(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="toDate">Suggested End Date</Label>
                  <Input 
                    id="toDate" 
                    type="date" 
                    value={newToDate}
                    onChange={(e) => setNewToDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsProposeOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={processingId === proposingFor?.id}>
                  {processingId === proposingFor?.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Send Proposal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      </div>

      <AlertDialog open={!!approveConfirmId} onOpenChange={(open) => !open && setApproveConfirmId(null)}>
        <AlertDialogContent className="border-border/50 shadow-md bg-card dark:bg-zinc-900/90 backdrop-blur-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Leave</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this leave application? This action will notify the employee.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleApprove(approveConfirmId)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!rejectConfirmId} onOpenChange={(open) => !open && setRejectConfirmId(null)}>
        <AlertDialogContent className="border-border/50 shadow-md bg-card dark:bg-zinc-900/90 backdrop-blur-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Leave</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this leave application? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleReject(rejectConfirmId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
