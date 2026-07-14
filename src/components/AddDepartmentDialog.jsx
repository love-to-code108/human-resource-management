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
import { getDepartments, addDepartment, updateDepartment, deleteDepartment } from '@/app/actions/department';

export function AddDepartmentDialog({ trigger }) {
  const [open, setOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    if (open) {
      loadDepartments();
    }
  }, [open]);

  const loadDepartments = async () => {
    setIsLoading(true);
    const res = await getDepartments();
    if (res.success) {
      setDepartments(res.departments);
    }
    setIsLoading(false);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const res = await addDepartment(newName);
    if (res.success) {
      toast.success("Department added successfully.");
      setDepartments([...departments, res.department]);
      setNewName('');
      setIsAdding(false);
    } else {
      toast.error(res.error || "Failed to add department");
    }
  };

  const handleSaveEdit = async (id) => {
    if (!editName.trim()) return;
    const res = await updateDepartment(id, editName);
    if (res.success) {
      toast.success("Department updated.");
      setDepartments(departments.map(d => d.id === id ? { ...d, name: res.department.name } : d));
      setEditingId(null);
    } else {
      toast.error(res.error || "Failed to update department");
    }
  };

  const handleDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const executeDelete = async (id) => {
    const res = await deleteDepartment(id);
    if (res.success) {
      toast.success("Department deleted successfully.");
      setDepartments(departments.filter(d => d.id !== id));
    } else {
      toast.error(res.error || "Failed to delete department");
    }
    setDeleteConfirmId(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Department
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]" showCloseButton={false}>
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-semibold tracking-tight">Manage Departments</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Add, edit, or remove departments in the system.
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
          ) : departments.length === 0 && !isAdding ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No departments found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by adding the first department to the system.
              </p>
              <Button onClick={() => setIsAdding(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Department
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">S.No</TableHead>
                  <TableHead>Department Name</TableHead>
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
                        placeholder="e.g. Finance" 
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
                {departments.map((department, index) => (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      {editingId === department.id ? (
                        <Input 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(department.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                      ) : (
                        department.name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === department.id ? (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500" onClick={() => handleSaveEdit(department.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                          setEditingId(department.id);
                          setEditName(department.name);
                        }}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === department.id ? (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setEditingId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(department.id)}>
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
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this department? This action cannot be undone.
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
