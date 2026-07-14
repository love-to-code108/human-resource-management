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
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getDesignations, addDesignation, updateDesignation, deleteDesignation } from '@/app/actions/designation';

export function AddDesignationDialog({ trigger }) {
  const [open, setOpen] = useState(false);
  const [designations, setDesignations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  useEffect(() => {
    if (open) {
      loadDesignations();
    }
  }, [open]);

  const loadDesignations = async () => {
    setIsLoading(true);
    const res = await getDesignations();
    if (res.success) {
      setDesignations(res.designations);
    }
    setIsLoading(false);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const res = await addDesignation(newName);
    if (res.success) {
      toast.success("Designation added successfully.");
      setDesignations([...designations, res.designation]);
      setNewName('');
      setIsAdding(false);
    } else {
      toast.error(res.error || "Failed to add designation");
    }
  };

  const handleSaveEdit = async (id) => {
    if (!editName.trim()) return;
    const res = await updateDesignation(id, editName);
    if (res.success) {
      toast.success("Designation updated.");
      setDesignations(designations.map(d => d.id === id ? { ...d, name: res.designation.name } : d));
      setEditingId(null);
    } else {
      toast.error(res.error || "Failed to update designation");
    }
  };

  const handleDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const executeDelete = async (id) => {
    const res = await deleteDesignation(id);
    if (res.success) {
      toast.success("Designation deleted successfully.");
      setDesignations(designations.filter(d => d.id !== id));
    } else {
      toast.error(res.error || "Failed to delete designation");
    }
    setDeleteConfirmId(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Designation
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]" showCloseButton={false}>
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-semibold tracking-tight">Manage Designations</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Add, edit, or remove designations in the system.
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
          ) : designations.length === 0 && !isAdding ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No designations found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by adding the first designation to the system.
              </p>
              <Button onClick={() => setIsAdding(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Designation
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">S.No</TableHead>
                  <TableHead>Designation Name</TableHead>
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
                        placeholder="e.g. Professor" 
                        className="h-8"
                        autoFocus
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
                {designations.map((designation, index) => (
                  <TableRow key={designation.id}>
                    <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      {editingId === designation.id ? (
                        <Input 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(designation.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                      ) : (
                        designation.name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === designation.id ? (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500" onClick={() => handleSaveEdit(designation.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                          setEditingId(designation.id);
                          setEditName(designation.name);
                        }}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === designation.id ? (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setEditingId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(designation.id)}>
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

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Designation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this designation? This action cannot be undone.
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
