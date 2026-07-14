'use client';

import React, { useState, useEffect } from 'react';
import { getLeaveTypes } from '@/app/actions/leaveType';
import { submitLeaveApplication } from '@/app/actions/leave';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { RichTextEditor } from '@/components/ui/RichTextEditor';

export function NewLeaveApplication() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedLeaveTypeName, setSelectedLeaveTypeName] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const res = await getLeaveTypes();
      if (res.success) {
        setLeaveTypes(res.leaveTypes || []);
      } else {
        toast.error("Failed to load leave types.");
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLeaveTypeName || !fromDate || !toDate || !reason) {
      toast.error("Please fill in all fields and provide a reason.");
      return;
    }

    const typeId = leaveTypes.find(t => t.name === selectedLeaveTypeName)?.id;
    if (!typeId) {
      toast.error("Invalid leave type selected.");
      return;
    }

    setIsSubmitting(true);
    const res = await submitLeaveApplication({
      leaveTypeId: typeId,
      fromDate,
      toDate,
      reason,
    });

    setIsSubmitting(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Leave application submitted successfully!");
      // Reset form
      setSelectedLeaveTypeName('');
      setFromDate('');
      setToDate('');
      setReason('');
    }
  };

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

        <form onSubmit={handleSubmit} className="space-y-12">
          
          {/* Section 1: Application Type */}
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium">1. Application Type</h3>
              <p className="text-sm text-muted-foreground">
                Select the category of leave you are requesting.
              </p>
            </div>
            
            <div className="grid gap-2 max-w-xl">
              <Label htmlFor="leaveType">Leave Type</Label>
              <Select value={selectedLeaveTypeName} onValueChange={setSelectedLeaveTypeName} required>
                <SelectTrigger id="leaveType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name} label={type.name}>
                      {type.name} ({type.defaultDays} days/yr)
                    </SelectItem>
                  ))}
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
              <div className="grid gap-2">
                <Label htmlFor="fromDate">From Date</Label>
                <Input 
                  id="fromDate" 
                  type="date" 
                  required 
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="toDate">To Date</Label>
                <Input 
                  id="toDate" 
                  type="date" 
                  required 
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  min={fromDate}
                />
              </div>
            </div>
          </div>

          <div className="border-b border-border" />

          {/* Section 3: Justification */}
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium">3. Justification</h3>
              <p className="text-sm text-muted-foreground">
                Provide a detailed reason for your leave request.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label>Reason for Leave</Label>
              <RichTextEditor
                content={reason}
                onChange={setReason}
                placeholder="Explain the reason for your leave..."
              />
              <p className="text-sm text-muted-foreground">
                Use the rich text editor to format your reason.
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={isSubmitting} size="lg">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Submit Application
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
