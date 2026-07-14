'use client'

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getLeaveTypes, addLeaveType, updateLeaveType, deleteLeaveType } from '@/app/actions/leaveType';

export function AddLeaveTypeDialog({ trigger }) {
  const [open, setOpen] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newDays, setNewDays] = useState('');
  
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDays, setEditDays] = useState('');

  useEffect(() => {
    if (open) {
      loadLeaveTypes();
    }
  }, [open]);

  const loadLeaveTypes = async () => {
    setIsLoading(true);
    const res = await getLeaveTypes();
    if (res.success) {
      setLeaveTypes(res.leaveTypes);
    }
    setIsLoading(false);
  };

  const handleAdd = async () => {
    if (!newName.trim() || !newDays) return;
    const res = await addLeaveType(newName, newDays);
    if (res.success) {
      setLeaveTypes([...leaveTypes, res.leaveType]);
      setNewName('');
      setNewDays('');
      setIsAdding(false);
    }
  };

  const handleSaveEdit = async (id) => {
    if (!editName.trim() || !editDays) return;
    const res = await updateLeaveType(id, editName, editDays);
    if (res.success) {
      setLeaveTypes(leaveTypes.map(d => d.id === id ? { ...d, name: res.leaveType.name, defaultDays: res.leaveType.defaultDays } : d));
      setEditingId(null);
    }
  };

  const handleDelete = async (id) => {
    const res = await deleteLeaveType(id);
    if (res.success) {
      setLeaveTypes(leaveTypes.filter(d => d.id !== id));
    }
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
      <DialogContent className="sm:max-w-[650px]" showCloseButton={false}>
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-semibold tracking-tight">Manage Leave Types</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Add, edit, or remove leave types and their default days.
            </DialogDescription>
          </div>
          <Button size="sm" onClick={() => setIsAdding(true)} disabled={isAdding || isLoading} className="mt-0">
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </DialogHeader>

        <div className="mt-4 border rounded-md max-h-[300px] overflow-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
          ) : leaveTypes.length === 0 && !isAdding ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No leave types found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by adding the first leave type to the system.
              </p>
              <Button onClick={() => setIsAdding(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Leave Type
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">S.No</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead className="w-24">Default Days</TableHead>
                  <TableHead className="w-16">Edit</TableHead>
                  <TableHead className="w-16">Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isAdding && (
                  <TableRow>
                    <TableCell className="text-muted-foreground">-</TableCell>
                    <TableCell>
                      <Input 
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Sick Leave" 
                        className="h-8"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAdd();
                          if (e.key === 'Escape') setIsAdding(false);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        value={newDays}
                        onChange={(e) => setNewDays(e.target.value)}
                        placeholder="e.g. 10" 
                        type="number"
                        className="h-8"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAdd();
                          if (e.key === 'Escape') setIsAdding(false);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500" onClick={handleAdd}>
                        <Check className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setIsAdding(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
                {leaveTypes.map((leaveType, index) => (
                  <TableRow key={leaveType.id}>
                    <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      {editingId === leaveType.id ? (
                        <Input 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(leaveType.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                      ) : (
                        leaveType.name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === leaveType.id ? (
                        <Input 
                          value={editDays}
                          onChange={(e) => setEditDays(e.target.value)}
                          type="number"
                          className="h-8"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(leaveType.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                      ) : (
                        leaveType.defaultDays
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === leaveType.id ? (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500" onClick={() => handleSaveEdit(leaveType.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                          setEditingId(leaveType.id);
                          setEditName(leaveType.name);
                          setEditDays(leaveType.defaultDays.toString());
                        }}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === leaveType.id ? (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setEditingId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(leaveType.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
