'use client';

import { useState, useEffect } from 'react';
import { getMyLeaves, acceptNegotiation, withdrawLeave } from '@/app/actions/leave';
import { Loader2, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Trash2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
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

export function MyApplicationsStatus() {
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [withdrawConfirmId, setWithdrawConfirmId] = useState(null);

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    setIsLoading(true);
    const res = await getMyLeaves();
    if (res.success) {
      setLeaves(res.leaves);
    } else {
      toast.error(res.error);
    }
    setIsLoading(false);
  };

  const handleAccept = async (id) => {
    setProcessingId(id);
    const res = await acceptNegotiation(id);
    if (res.success) {
      toast.success("Accepted proposed dates. Application sent back to manager for final approval.");
      await loadLeaves();
    } else {
      toast.error(res.error);
    }
    setProcessingId(null);
  };

  const handleWithdraw = async (id) => {
    setProcessingId(id);
    const res = await withdrawLeave(id);
    if (res.success) {
      toast.success("Application withdrawn.");
      await loadLeaves();
    } else {
      toast.error(res.error);
    }
    setProcessingId(null);
    setWithdrawConfirmId(null);
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
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 animate-pulse"><AlertCircle className="w-3 h-3 mr-1"/> Action Required</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-10 animate-in fade-in duration-500 h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-12 pb-16 pt-4">
        
        {/* Main Page Header */}
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight">My Applications</h2>
          <p className="text-muted-foreground">
            Track the status of your leave applications and respond to manager proposals.
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
              <Calendar className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-medium">No applications found</h3>
              <p className="text-sm text-muted-foreground">You haven't submitted any leave applications yet.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {leaves.map((leave, index) => (
              <div key={leave.id} className="space-y-8">
                {/* Application Block */}
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-medium flex items-center gap-3">
                        {leave.leaveType.name}
                        {getStatusBadge(leave.status)}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Applied on {format(new Date(leave.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-sm font-medium text-muted-foreground">Pending At</p>
                      <p className="text-sm">
                        {leave.pendingAtNode ? 
                          `${leave.pendingAtNode.designation.name}, ${leave.pendingAtNode.department.name}` 
                          : 'System (Auto)'}
                      </p>
                    </div>
                  </div>

                  {/* Requested Dates */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Requested Dates</h4>
                    <div className="flex items-center gap-2 text-base">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className={leave.status === 'NEGOTIATING' ? 'line-through opacity-60' : 'font-medium'}>
                        {format(new Date(leave.fromDate), 'MMM d, yyyy')}
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground mx-2" />
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className={leave.status === 'NEGOTIATING' ? 'line-through opacity-60' : 'font-medium'}>
                        {format(new Date(leave.toDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>

                  {/* Negotiation Block */}
                  {leave.status === 'NEGOTIATING' && leave.managerSuggestedFromDate && leave.managerSuggestedToDate && (
                    <div className="border-l-2 border-blue-500 pl-4 py-1 space-y-3">
                      <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400">Manager Proposed Alternative Dates</h4>
                      <div className="flex items-center gap-2 text-base font-semibold">
                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>{format(new Date(leave.managerSuggestedFromDate), 'MMM d, yyyy')}</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground mx-2" />
                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>{format(new Date(leave.managerSuggestedToDate), 'MMM d, yyyy')}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Your manager cannot approve your original dates. Please review the alternative dates above.
                      </p>
                    </div>
                  )}

                  {/* Reason */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Justification</h4>
                    <div 
                      className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground/90"
                      dangerouslySetInnerHTML={{ __html: leave.reason }} 
                    />
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex gap-3">
                    {leave.status === 'NEGOTIATING' ? (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={() => setWithdrawConfirmId(leave.id)}
                          disabled={processingId === leave.id}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Withdraw
                        </Button>
                        <Button 
                          onClick={() => handleAccept(leave.id)}
                          disabled={processingId === leave.id}
                        >
                          {processingId === leave.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Accept Proposed Dates
                        </Button>
                      </>
                    ) : leave.status === 'PENDING' ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setWithdrawConfirmId(leave.id)}
                        disabled={processingId === leave.id}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {processingId === leave.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                        Withdraw Request
                      </Button>
                    ) : null}
                  </div>
                </div>

                {/* Divider for next item (except last) */}
                {index < leaves.length - 1 && (
                  <div className="border-b border-border" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!withdrawConfirmId} onOpenChange={(open) => !open && setWithdrawConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to withdraw this application? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleWithdraw(withdrawConfirmId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Withdraw
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
