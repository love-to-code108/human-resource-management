'use client'

import { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
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

const initialData = [
  { id: '1', name: 'Teacher' },
  { id: '2', name: 'HOD' },
  { id: '3', name: 'Dean' },
];

export function AddDesignationDialog({ trigger }) {
  const [open, setOpen] = useState(false);
  const [designations, setDesignations] = useState(initialData);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    setDesignations([...designations, { id: Date.now().toString(), name: newName }]);
    setNewName('');
    setIsAdding(false);
  };

  const handleSaveEdit = (id) => {
    if (!editName.trim()) return;
    setDesignations(designations.map(d => d.id === id ? { ...d, name: editName } : d));
    setEditingId(null);
  };

  const handleDelete = (id) => {
    setDesignations(designations.filter(d => d.id !== id));
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
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-semibold tracking-tight">Manage Designations</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Add, edit, or remove designations in the system.
            </DialogDescription>
          </div>
          <Button size="sm" onClick={() => setIsAdding(true)} disabled={isAdding} className="mt-0">
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </DialogHeader>

        <div className="mt-4 border rounded-md max-h-[300px] overflow-auto">
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
              {designations.length === 0 && !isAdding && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    No designations found.
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
