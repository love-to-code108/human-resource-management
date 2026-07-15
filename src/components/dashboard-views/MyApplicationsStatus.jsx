'use client';

import { useState, useEffect } from 'react';
import { getMyLeaves, acceptNegotiation, withdrawLeave, editLeaveApplication, getMyLeaveBalances } from '@/app/actions/leave';
import { getApprovalChainForUser } from '@/app/actions/hierarchy';
import { Loader2, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Trash2, ArrowRight, Edit2, Send, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
  const [approvalChain, setApprovalChain] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [withdrawConfirmId, setWithdrawConfirmId] = useState(null);

  // Edit State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [newFromDate, setNewFromDate] = useState();
  const [newToDate, setNewToDate] = useState();
  const [newSubject, setNewSubject] = useState('');
  const [newReason, setNewReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [leavesRes, chainRes] = await Promise.all([
      getMyLeaves(),
      getApprovalChainForUser()
    ]);
    if (leavesRes.success) setLeaves(leavesRes.leaves);
    else toast.error(leavesRes.error);
    
    if (chainRes.success) setApprovalChain(chainRes.chain);
    setIsLoading(false);
  };

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
      await loadData();
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
      await loadData();
    } else {
      toast.error(res.error);
    }
    setProcessingId(null);
    setWithdrawConfirmId(null);
  };

  const openEditDialog = (leave) => {
    setEditData(leave);
    setNewFromDate(new Date(leave.fromDate));
    setNewToDate(new Date(leave.toDate));
    setNewSubject(leave.subject || '');
    setNewReason(leave.reason);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!newFromDate || !newToDate || !newSubject || !newReason) {
      toast.error('All fields are required.');
      return;
    }
    
    setProcessingId(editData.id);
    const res = await editLeaveApplication(editData.id, {
      fromDate: format(newFromDate, 'yyyy-MM-dd'),
      toDate: format(newToDate, 'yyyy-MM-dd'),
      subject: newSubject,
      reason: newReason
    });
    
    if (res.success) {
      toast.success('Application updated successfully.');
      setIsEditDialogOpen(false);
      await loadData();
    } else {
      toast.error(res.error);
    }
    setProcessingId(null);
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
                      <p className="text-sm font-medium">
                        {leave.status === 'APPROVED' ? (
                          <span className="text-emerald-600">Fully Approved</span>
                        ) : leave.pendingAtNodes && leave.pendingAtNodes.length > 0 ? (
                          leave.pendingAtNodes.map(node => `${node.designation.name}, ${node.department.name}`).join(' OR ')
                        ) : 'System'}
                      </p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
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
                    
                    {/* Subject */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Subject</h4>
                      <p className="text-base font-semibold">{leave.subject || 'N/A'}</p>
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
                    <h4 className="text-sm font-medium text-muted-foreground">Detailed Justification</h4>
                    <div 
                      className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground/90 bg-muted/20 p-4 rounded-lg border border-border/50"
                      dangerouslySetInnerHTML={{ __html: leave.reason }} 
                    />
                  </div>

                  {/* Status Tracker */}
                  <div className="space-y-4 pt-2">
                    <h4 className="font-medium text-sm border-b pb-2">Status Tracker</h4>
                    {approvalChain.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No approvals required. (Auto-approve)</p>
                    ) : (
                      <div className="relative pl-4 space-y-6 before:absolute before:left-[21px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                        {approvalChain.map((level, i) => {
                          const pendingIds = leave.pendingAtNodes.map(n => n.id);
                          const currentLevelIndex = approvalChain.findIndex(lvl => lvl.some(node => pendingIds.includes(node.id)));
                          
                          let state = 'pending';
                          if (leave.status === 'APPROVED') state = 'approved';
                          else if (leave.status === 'REJECTED' && currentLevelIndex === i) state = 'rejected';
                          else if (leave.status === 'REJECTED' && currentLevelIndex === -1 && i === approvalChain.length - 1) state = 'rejected';
                          else if (currentLevelIndex !== -1) {
                            if (i < currentLevelIndex) state = 'approved';
                            else if (i === currentLevelIndex) state = 'current';
                          }

                          return (
                            <div key={i} className="relative flex items-start gap-4">
                              <div className={cn(
                                "relative z-10 w-3 h-3 mt-1.5 rounded-full ring-4 ring-background",
                                state === 'approved' ? "bg-emerald-500" : state === 'current' ? "bg-primary animate-pulse" : state === 'rejected' ? "bg-destructive" : "bg-muted-foreground/30"
                              )} />
                              <div className="flex flex-col">
                                <span className={cn(
                                  "text-xs font-semibold uppercase tracking-wider mb-1",
                                  state === 'approved' ? "text-emerald-600" : state === 'current' ? "text-primary" : state === 'rejected' ? "text-destructive" : "text-muted-foreground"
                                )}>
                                  Level {i + 1} {state === 'approved' && '- Approved'} {state === 'rejected' && '- Rejected'} {state === 'current' && '- Pending'}
                                </span>
                                <div className="space-y-1">
                                  {level.map((node, j) => (
                                    <div key={j} className={cn("text-sm", state === 'pending' ? "text-muted-foreground" : "font-medium")}>
                                      {node.designation.name} <span className="font-normal opacity-70">({node.department.name})</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex gap-3">
                    {(() => {
                      const pendingIds = leave.pendingAtNodes.map(n => n.id);
                      const currentLevelIndex = approvalChain.findIndex(lvl => lvl.some(node => pendingIds.includes(node.id)));
                      const canEdit = leave.status === 'PENDING' && currentLevelIndex === 0;

                      return (
                        <>
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
                            <>
                              {canEdit && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openEditDialog(leave)}
                                  disabled={processingId === leave.id}
                                >
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Edit Request
                                </Button>
                              )}
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
                            </>
                          ) : null}
                        </>
                      );
                    })()}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] border-border/50 shadow-md bg-card dark:bg-zinc-900/90 backdrop-blur-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Leave Application</DialogTitle>
            <DialogDescription>
              You can only edit applications that have not yet been reviewed by any manager.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background",
                        !newFromDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newFromDate ? format(newFromDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={newFromDate}
                      onSelect={setNewFromDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background",
                        !newToDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newToDate ? format(newToDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={newToDate}
                      onSelect={setNewToDate}
                      disabled={(date) => {
                        const minDate = newFromDate ? new Date(newFromDate) : new Date();
                        minDate.setHours(0, 0, 0, 0);
                        return date < minDate;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Subject</Label>
              <Input 
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Brief subject of your leave"
              />
            </div>

            <div className="grid gap-2">
              <Label>Detailed Justification</Label>
              <RichTextEditor
                content={newReason}
                onChange={setNewReason}
                placeholder="Explain the reason for your leave..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)} disabled={processingId === editData?.id}>
                Cancel
              </Button>
              <Button type="submit" disabled={processingId === editData?.id}>
                {processingId === editData?.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
