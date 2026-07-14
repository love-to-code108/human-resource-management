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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
    <div className="flex-1 p-6 lg:p-8 xl:p-12 animate-in fade-in duration-500 bg-muted/10 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Leave Approvals</h2>
          <p className="text-muted-foreground mt-2">Review, approve, or negotiate leave applications pending your approval.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
          </div>
        ) : leaves.length === 0 ? (
          <div className="text-center py-20 bg-background border rounded-2xl shadow-sm">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">You're all caught up!</h3>
            <p className="text-muted-foreground">There are no leave applications pending your approval right now.</p>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            {leaves.map((leave) => (
              <Card key={leave.id} className="overflow-hidden flex flex-col transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-start gap-4 bg-muted/20 pb-4 border-b">
                  <Avatar className="h-12 w-12 border">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {leave.applicant.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{leave.applicant.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {leave.applicant.designation?.name} • {leave.applicant.department?.name}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-background text-muted-foreground">
                      {leave.leaveType.name}
                    </span>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(leave.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6 flex-1">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Requested Dates</h4>
                      <div className="flex items-center gap-2 text-base font-medium">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>{format(new Date(leave.fromDate), 'MMM d, yyyy')}</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground mx-1" />
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>{format(new Date(leave.toDate), 'MMM d, yyyy')}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.ceil((new Date(leave.toDate) - new Date(leave.fromDate)) / (1000 * 60 * 60 * 24)) + 1} Days Requested
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Reason provided</h4>
                      <div 
                        className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground/90 bg-muted/10 p-4 rounded-lg border border-border/50 max-h-32 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: leave.reason }} 
                      />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="bg-muted/10 p-4 border-t flex flex-wrap gap-2 justify-end">
                  <Button 
                    variant="outline"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                    onClick={() => openProposeDialog(leave)}
                    disabled={processingId === leave.id}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Propose Dates
                  </Button>
                  <Button 
                    variant="outline"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setRejectConfirmId(leave.id)}
                    disabled={processingId === leave.id}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => setApproveConfirmId(leave.id)}
                    disabled={processingId === leave.id}
                  >
                    {processingId === leave.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                    Approve
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Propose Dates Dialog */}
        <Dialog open={isProposeOpen} onOpenChange={setIsProposeOpen}>
          <DialogContent className="sm:max-w-[425px]" showCloseButton={false}>
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
        <AlertDialogContent>
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
        <AlertDialogContent>
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
