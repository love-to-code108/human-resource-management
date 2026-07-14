'use client'

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getLeaveTypes, addLeaveType, updateLeaveType, deleteLeaveType } from '@/app/actions/leaveType';
import { getDesignations } from '@/app/actions/designation';
import { toast } from 'sonner';

export function AddLeaveTypeDialog({ trigger }) {
  const [open, setOpen] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  // Form View State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form Fields
  const [name, setName] = useState('');
  const [defaultDays, setDefaultDays] = useState('');
  const [overrides, setOverrides] = useState([]); // [{ designationId, allocatedDays }]

  useEffect(() => {
    if (open) {
      loadData();
    } else {
      resetForm();
    }
  }, [open]);

  const loadData = async () => {
    setIsLoading(true);
    const [ltRes, desRes] = await Promise.all([
      getLeaveTypes(),
      getDesignations()
    ]);
    
    if (ltRes.success) setLeaveTypes(ltRes.leaveTypes);
    if (desRes.success) setDesignations(desRes.designations);
    setIsLoading(false);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName('');
    setDefaultDays('');
    setOverrides([]);
    setIsSaving(false);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (lt) => {
    setEditingId(lt.id);
    setName(lt.name);
    setDefaultDays(lt.defaultDays.toString());
    setOverrides(lt.allocations.map(a => ({
      designationName: a.designation.name,
      allocatedDays: a.allocatedDays.toString()
    })));
    setShowForm(true);
  };

  const handleAddOverride = () => {
    setOverrides([...overrides, { designationName: '', allocatedDays: '' }]);
  };

  const handleOverrideChange = (index, field, value) => {
    const newOverrides = [...overrides];
    newOverrides[index][field] = value;
    setOverrides(newOverrides);
  };

  const handleRemoveOverride = (index) => {
    setOverrides(overrides.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !defaultDays) {
      toast.error("Name and Default Days are required.");
      return;
    }

    // Validate overrides
    for (const o of overrides) {
      if (!o.designationName || !o.allocatedDays) {
        toast.error("Please fill all override fields or remove empty overrides.");
        return;
      }
    }

    // Check duplicate overrides
    const desigSet = new Set();
    const mappedOverrides = [];
    
    for (const o of overrides) {
      if (desigSet.has(o.designationName)) {
        toast.error("Duplicate designation overrides are not allowed.");
        return;
      }
      desigSet.add(o.designationName);
      
      const desigId = designations.find(d => d.name === o.designationName)?.id;
      if (desigId) {
        mappedOverrides.push({
          designationId: desigId,
          allocatedDays: o.allocatedDays
        });
      }
    }

    setIsSaving(true);
    let res;
    if (editingId) {
      res = await updateLeaveType(editingId, name, defaultDays, mappedOverrides);
    } else {
      res = await addLeaveType(name, defaultDays, mappedOverrides);
    }

    setIsSaving(false);
    if (res.success) {
      toast.success(editingId ? "Leave type updated" : "Leave type added");
      await loadData();
      resetForm();
    } else {
      toast.error(res.error || "An error occurred.");
    }
  };

  const handleDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const executeDelete = async (id) => {
    const res = await deleteLeaveType(id);
    if (res.success) {
      toast.success("Leave type deleted");
      setLeaveTypes(leaveTypes.filter(d => d.id !== id));
    } else {
      toast.error("Failed to delete.");
    }
    setDeleteConfirmId(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Leave Type
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] overflow-hidden flex flex-col max-h-[85vh]" showCloseButton={false}>
        <DialogHeader className="flex flex-row items-center justify-between shrink-0">
          <div>
            <DialogTitle className="text-xl font-semibold tracking-tight">
              {showForm ? (editingId ? 'Edit Leave Type' : 'Add New Leave Type') : 'Manage Leave Types'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              {showForm ? 'Configure global limits and designation-specific overrides.' : 'Add, edit, or remove leave types.'}
            </DialogDescription>
          </div>
          {!showForm && (
            <Button size="sm" onClick={openAddForm} disabled={isLoading} className="mt-0">
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          )}
          {showForm && (
            <Button size="sm" variant="ghost" onClick={resetForm} className="mt-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
        </DialogHeader>

        <div className="mt-4 flex-1 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
          ) : showForm ? (
            <form id="leaveTypeForm" onSubmit={handleSave} className="space-y-6 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Leave Type Name</Label>
                  <Input 
                    placeholder="e.g. Sick Leave" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Global Default Days (Per Year)</Label>
                  <Input 
                    type="number" 
                    placeholder="e.g. 10" 
                    value={defaultDays} 
                    onChange={e => setDefaultDays(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-4 border rounded-xl p-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold">Designation Overrides (Optional)</h4>
                    <p className="text-xs text-muted-foreground">Override the default days for specific designations.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddOverride}>
                    <Plus className="w-3 h-3 mr-2" /> Add Override
                  </Button>
                </div>

                {overrides.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-2">No overrides added. Everyone will get {defaultDays || '0'} days.</p>
                ) : (
                  <div className="space-y-3">
                    {overrides.map((override, idx) => (
                      <div key={idx} className="flex gap-3 items-start animate-in fade-in zoom-in-95">
                        <div className="flex-1 space-y-1">
                          <Select 
                            value={override.designationName} 
                            onValueChange={v => handleOverrideChange(idx, 'designationName', v)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select Designation" />
                            </SelectTrigger>
                            <SelectContent>
                              {designations.map(d => (
                                <SelectItem key={d.id} value={d.name} label={d.name}>{d.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-32 space-y-1">
                          <Input 
                            type="number" 
                            placeholder="Days" 
                            className="h-9"
                            value={override.allocatedDays}
                            onChange={e => handleOverrideChange(idx, 'allocatedDays', e.target.value)}
                          />
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-destructive"
                          onClick={() => handleRemoveOverride(idx)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Leave Type
                </Button>
              </div>
            </form>
          ) : leaveTypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-md">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No leave types found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by adding the first leave type to the system.
              </p>
              <Button onClick={openAddForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Leave Type
              </Button>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Default Days</TableHead>
                    <TableHead>Overrides</TableHead>
                    <TableHead className="w-16">Edit</TableHead>
                    <TableHead className="w-16">Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveTypes.map((lt) => (
                    <TableRow key={lt.id}>
                      <TableCell className="font-medium">{lt.name}</TableCell>
                      <TableCell>{lt.defaultDays}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {lt.allocations?.length || 0} configured
                      </TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditForm(lt)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(lt.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Leave Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this leave type? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => executeDelete(deleteConfirmId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </Dialog>
  );
}
