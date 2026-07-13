'use client'

import { useState } from 'react';
import { Plus, ArrowRight } from 'lucide-react';

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
          <DialogTitle className="text-xl font-semibold tracking-tight">Add Designation</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Create a new designation.
          </DialogDescription>
        </DialogHeader>
        <form>
          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</Label>
              <Input id="name" name="name" placeholder="Teacher" required />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setOpen(false)} className="w-full h-11 text-base font-medium transition-all active:scale-[0.98] group">
              Save Designation
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
