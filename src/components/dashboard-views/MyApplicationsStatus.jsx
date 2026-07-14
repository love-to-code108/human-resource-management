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
    <div className="flex-1 p-6 lg:p-8 xl:p-12 animate-in fade-in duration-500 bg-muted/10 h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Applications</h2>
          <p className="text-muted-foreground mt-2">Track the status of your leave applications and respond to manager proposals.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
          </div>
        ) : leaves.length === 0 ? (
          <div className="text-center py-20 bg-background border rounded-2xl shadow-sm">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No applications found</h3>
            <p className="text-muted-foreground">You haven't submitted any leave applications yet.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {leaves.map((leave) => (
              <Card key={leave.id} className={`overflow-hidden transition-all ${leave.status === 'NEGOTIATING' ? 'border-blue-500/50 shadow-md shadow-blue-500/10' : ''}`}>
                <CardHeader className="flex flex-row items-start justify-between bg-muted/20 pb-4 border-b">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-3">
                      {leave.leaveType.name}
                      {getStatusBadge(leave.status)}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Applied on {format(new Date(leave.createdAt), 'MMM d, yyyy')}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground">Pending At</p>
                    <p className="text-sm">
                      {leave.pendingAtNode ? 
                        `${leave.pendingAtNode.designation.name}, ${leave.pendingAtNode.department.name}` 
                        : 'System (Auto)'}
                    </p>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Requested Dates</h4>
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

                      {leave.status === 'NEGOTIATING' && leave.managerSuggestedFromDate && leave.managerSuggestedToDate && (
                        <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                          <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">Manager Proposed Alternative Dates</h4>
                          <div className="flex items-center gap-2 text-base font-semibold">
                            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span>{format(new Date(leave.managerSuggestedFromDate), 'MMM d, yyyy')}</span>
                            <ArrowRight className="w-4 h-4 text-muted-foreground mx-2" />
                            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span>{format(new Date(leave.managerSuggestedToDate), 'MMM d, yyyy')}</span>
                          </div>
                          <p className="text-sm mt-3 text-blue-600/80 dark:text-blue-300/80">
                            Your manager cannot approve your original dates. Please review the alternative dates above.
                          </p>
                        </div>
                      )}

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Reason</h4>
                        {/* We use dangerouslySetInnerHTML because the rich text editor stores HTML */}
                        <div 
                          className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground/90 bg-muted/10 p-4 rounded-lg border border-border/50"
                          dangerouslySetInnerHTML={{ __html: leave.reason }} 
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>

                {/* Footer Actions */}
                <CardFooter className="bg-muted/10 p-4 border-t flex justify-end gap-3">
                  {leave.status === 'NEGOTIATING' ? (
                    <>
                      <Button 
                        variant="destructive" 
                        onClick={() => setWithdrawConfirmId(leave.id)}
                        disabled={processingId === leave.id}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Withdraw
                      </Button>
                      <Button 
                        onClick={() => handleAccept(leave.id)}
                        disabled={processingId === leave.id}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {processingId === leave.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Accept Proposed Dates
                      </Button>
                    </>
                  ) : leave.status === 'PENDING' ? (
                    <Button 
                      variant="outline" 
                      onClick={() => setWithdrawConfirmId(leave.id)}
                      disabled={processingId === leave.id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {processingId === leave.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                      Withdraw Request
                    </Button>
                  ) : null}
                </CardFooter>
              </Card>
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
