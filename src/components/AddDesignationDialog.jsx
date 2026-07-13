'use client'

import { useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AddDesignationDialog({ trigger }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          trigger || (
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Designation
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Designation</DialogTitle>
          <DialogDescription>
            Create a new designation.
          </DialogDescription>
        </DialogHeader>
        <form>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Teacher" required />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setOpen(false)}>Save Designation</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
