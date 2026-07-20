'use client';

import React, { useState, useEffect } from 'react';
import { getUserActivityTimeline } from '@/app/actions/userManagement';
import { Loader2, GitCommit, User, Calendar, CheckCircle2, XCircle, FileText, ArrowRight, Activity, PlusCircle, MinusCircle, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function UserActivityTimeline({ userId }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL_TIME');

  useEffect(() => {
    async function loadTimeline() {
      if (!userId) return;
      setIsLoading(true);
      setError(null);
      
      const res = await getUserActivityTimeline(userId);
      if (!res.success) {
        setError(res.error || 'Failed to load timeline.');
        setIsLoading(false);
        return;
      }

      const rawEvents = [];
      
      res.leaveRequests?.forEach(req => {
        req.auditLogs?.forEach(log => {
          rawEvents.push({
            id: log.id,
            date: new Date(log.createdAt),
            type: 'AUDIT_LOG',
            action: log.action,
            actorName: log.actor?.name || 'System',
            leaveType: req.leaveType.name,
            fromDate: req.fromDate,
            toDate: req.toDate,
            subject: req.subject
          });
        });
      });

      res.manualTransactions?.forEach(tx => {
        rawEvents.push({
          id: tx.id,
          date: new Date(tx.createdAt),
          type: 'MANUAL_TX',
          action: 'ADJUST_BALANCE',
          actorName: tx.performedBy?.name || 'System',
          leaveType: tx.leaveType.name,
          amount: tx.amount,
          reason: tx.reason
        });
      });

      // Sort descending (newest top)
      rawEvents.sort((a, b) => b.date - a.date);
      setEvents(rawEvents);
      setIsLoading(false);
    }
    loadTimeline();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-sm text-destructive py-10 bg-destructive/5 rounded-md">
        {error}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-10 bg-muted/20 rounded-md border border-dashed">
        <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
        <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
      </div>
    );
  }

  let filteredEvents = events;

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredEvents = filteredEvents.filter(e => 
      e.action?.toLowerCase().includes(q) || 
      e.actorName?.toLowerCase().includes(q) || 
      e.leaveType?.toLowerCase().includes(q) ||
      e.reason?.toLowerCase().includes(q)
    );
  }

  if (typeFilter !== 'ALL') {
    filteredEvents = filteredEvents.filter(e => {
      if (typeFilter === 'MANUAL') return e.type === 'MANUAL_TX';
      if (typeFilter === 'LEAVE') return e.type === 'AUDIT_LOG';
      return true;
    });
  }

  if (dateFilter !== 'ALL_TIME') {
    const now = new Date();
    filteredEvents = filteredEvents.filter(e => {
      if (dateFilter === 'THIS_MONTH') {
        return e.date.getMonth() === now.getMonth() && e.date.getFullYear() === now.getFullYear();
      }
      if (dateFilter === 'LAST_3_MONTHS') {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return e.date >= threeMonthsAgo;
      }
      if (dateFilter === 'THIS_YEAR') {
        return e.date.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Filters Header */}
      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search timeline..." 
            className="pl-9 bg-muted/50 h-9 text-sm" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px] bg-muted/50 h-9 text-sm">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 shrink-0" />
                <SelectValue placeholder="Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Events</SelectItem>
              <SelectItem value="MANUAL">Adjustments</SelectItem>
              <SelectItem value="LEAVE">Applications</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[120px] bg-muted/50 h-9 text-sm">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL_TIME">All Time</SelectItem>
              <SelectItem value="THIS_MONTH">This Month</SelectItem>
              <SelectItem value="LAST_3_MONTHS">Last 3 Months</SelectItem>
              <SelectItem value="THIS_YEAR">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-6">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-10 bg-muted/20 rounded-md border border-dashed mt-4">
            <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No matching activity found.</p>
          </div>
        ) : (
          <div className="relative pl-7 space-y-7 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-border/70 py-2">
            {filteredEvents.map((event) => {
        const isManual = event.type === 'MANUAL_TX';
        const isAddition = isManual && event.amount > 0;
        
        let dotBg = "bg-muted";
        let titleColor = "text-muted-foreground";
        let titleText = "";
        let description = "";
        let secondaryText = "";

        if (isManual) {
          dotBg = isAddition ? "bg-emerald-500" : "bg-destructive";
          titleColor = isAddition ? "text-emerald-500" : "text-destructive";
          titleText = isAddition ? "BALANCE ADJUSTMENT (CREDIT)" : "BALANCE ADJUSTMENT (DEBIT)";
          description = `${isAddition ? 'Credited' : 'Debited'} ${Math.abs(event.amount)} days ${isAddition ? 'to' : 'from'} ${event.leaveType} balance.`;
          secondaryText = event.reason ? `"${event.reason}"` : "";
        } else {
          switch (event.action) {
            case 'SUBMITTED':
              dotBg = "bg-blue-500";
              titleColor = "text-blue-500";
              titleText = "LEAVE APPLICATION SUBMITTED";
              description = `Requested ${event.leaveType}`;
              secondaryText = `${format(new Date(event.fromDate), 'MMM d, yyyy')} - ${format(new Date(event.toDate), 'MMM d, yyyy')}`;
              break;
            case 'APPROVED':
              dotBg = "bg-emerald-500";
              titleColor = "text-emerald-500";
              titleText = "APPLICATION APPROVED";
              description = `Approved request for ${event.leaveType}`;
              secondaryText = "";
              break;
            case 'REJECTED':
              dotBg = "bg-destructive";
              titleColor = "text-destructive";
              titleText = "APPLICATION REJECTED";
              description = `Declined request for ${event.leaveType}`;
              secondaryText = "";
              break;
            case 'PROPOSED_DATES':
              dotBg = "bg-amber-500";
              titleColor = "text-amber-500";
              titleText = "NEW DATES PROPOSED";
              description = `Suggested alternative dates for ${event.leaveType}`;
              secondaryText = "";
              break;
            case 'ACCEPTED_DATES':
              dotBg = "bg-emerald-500";
              titleColor = "text-emerald-500";
              titleText = "PROPOSED DATES ACCEPTED";
              description = `Accepted the modified dates for ${event.leaveType}`;
              secondaryText = "";
              break;
            default:
              dotBg = "bg-muted";
              titleColor = "text-muted-foreground";
              titleText = event.action;
              description = `Action performed on ${event.leaveType}`;
              secondaryText = "";
              break;
          }
        }

        return (
          <div key={event.id} className="relative flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Node Dot */}
            <div className={cn(
              "absolute left-[-21px] mt-[5px] w-3 h-3 rounded-full ring-4 ring-background border border-border/50",
              dotBg
            )} />

            {/* Title */}
            <div className="flex items-center gap-3">
              <span className={cn("text-xs font-semibold uppercase tracking-wider", titleColor)}>
                {titleText}
              </span>
            </div>

            {/* Primary Description */}
            <div className="text-sm font-medium text-foreground">
              {description}
            </div>

            {/* Secondary Info / Reason */}
            {secondaryText && (
              <div className="text-sm text-muted-foreground italic">
                {secondaryText}
              </div>
            )}
            
            {/* Actor and Date info */}
            <div className="text-xs text-muted-foreground/70 mt-0.5 flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="font-medium text-muted-foreground">{event.actorName}</span>
              <span className="hidden sm:inline-block text-[10px] opacity-50">•</span>
              <span className="text-[11px]">{format(event.date, 'MMM d, yyyy h:mm a')}</span>
            </div>
          </div>
        );
      })}
          </div>
        )}
      </div>
    </div>
  );
}
