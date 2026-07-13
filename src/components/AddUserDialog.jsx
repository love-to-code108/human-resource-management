'use client'

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Plus, Loader2, ArrowRight } from 'lucide-react';
import { createUser } from '@/app/actions/users';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full h-11 text-base font-medium transition-all active:scale-[0.98] group">
      {pending ? (
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      ) : (
        <>
          Save User
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </>
      )}
    </Button>
  );
}

export function AddUserDialog({ trigger }) {
  const [open, setOpen] = useState(false);

  async function clientAction(formData) {
    const result = await createUser(formData);
    if (result?.error) {
      alert(result.error);
    } else {
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger || (
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New User
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">Add New User</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Create a new user account. Their password will be auto-generated.
          </DialogDescription>
        </DialogHeader>
        <form action={clientAction}>
          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</Label>
              <Input id="name" name="name" placeholder="John Doe" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input id="email" name="email" type="email" placeholder="john@university.edu" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="departmentId" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Department</Label>
              <Select name="departmentId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dummy-dept-1">CSE Department</SelectItem>
                  <SelectItem value="dummy-dept-2">HR Department</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="designationId" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Designation</Label>
              <Select name="designationId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a designation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dummy-desig-1">Teacher</SelectItem>
                  <SelectItem value="dummy-desig-2">HOD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
