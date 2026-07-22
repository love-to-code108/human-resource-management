'use client';

import { useState, useEffect } from 'react';
import { getSignupSettings, updateSignupSettings, getPendingRegistrations, approveRegistration, rejectRegistration, deleteRegistration } from '@/app/actions/registration';
import { getDepartments } from '@/app/actions/department';
import { getDesignations } from '@/app/actions/designation';
import { getUserByEmail, editUser } from '@/app/actions/userManagement';
import { Loader2, ShieldCheck, RefreshCw, CheckCircle2, XCircle, Search, Briefcase, Building2, Users, Edit2, Trash2, AlertCircle, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Switch } from "@/components/ui/switch";
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export function RegistrationHub() {
  const [isLoading, setIsLoading] = useState(true);
  const [registrations, setRegistrations] = useState([]);
  
  // Settings
  const [signupEnabled, setSignupEnabled] = useState(false);
  const [otp, setOtp] = useState('');
  
  // Departments & Designations for approval
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Approval Dialog
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [selectedRegForApproval, setSelectedRegForApproval] = useState(null);
  const [approveForm, setApproveForm] = useState({ departmentId: '', designationId: '' });

  // Reject Dialog
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedRegForRejection, setSelectedRegForRejection] = useState(null);

  // Edit Dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', email: '', password: '', departmentId: '', designationId: '' });
  const [userToEdit, setUserToEdit] = useState(null);

  // Delete Confirm
  const [regToDelete, setRegToDelete] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [settingsRes, regRes, deptRes, desigRes] = await Promise.all([
      getSignupSettings(),
      getPendingRegistrations(),
      getDepartments(),
      getDesignations()
    ]);

    if (settingsRes.success) {
      setSignupEnabled(settingsRes.enabled);
      setOtp(settingsRes.otp);
    }
    
    if (regRes.success) setRegistrations(regRes.registrations);
    if (deptRes.success) setDepartments(deptRes.departments || []);
    if (desigRes.success) setDesignations(desigRes.designations || []);

    setIsLoading(false);
  };

  const handleToggleSignup = async (checked) => {
    setSignupEnabled(checked);
    const res = await updateSignupSettings(checked, otp);
    if (res.success) {
      toast.success(`Signups ${checked ? 'enabled' : 'disabled'} successfully.`);
    } else {
      toast.error('Failed to update signup settings.');
      setSignupEnabled(!checked); // Revert
    }
  };

  const generateOtp = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleRegenerateOtp = async () => {
    const newOtp = generateOtp();
    const res = await updateSignupSettings(signupEnabled, newOtp);
    if (res.success) {
      setOtp(newOtp);
      toast.success('New OTP generated successfully.');
    } else {
      toast.error('Failed to generate new OTP.');
    }
  };

  const handleApproveClick = (reg) => {
    setSelectedRegForApproval(reg);
    setApproveForm({
      departmentId: reg.departmentId || '',
      designationId: reg.designationId || ''
    });
    setIsApproveDialogOpen(true);
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!approveForm.departmentId || !approveForm.designationId) {
      toast.error('Please select both Department and Designation.');
      return;
    }

    setIsLoading(true);
    const res = await approveRegistration(selectedRegForApproval.id, approveForm.departmentId, approveForm.designationId);
    
    if (res.success) {
      toast.success('User approved and added to system.');
      setIsApproveDialogOpen(false);
      loadData();
    } else {
      toast.error(res.error || 'Failed to approve registration.');
      setIsLoading(false);
    }
  };

  const handleRejectClick = (reg) => {
    setSelectedRegForRejection(reg);
    setIsRejectDialogOpen(true);
  };

  const confirmReject = async () => {
    setIsLoading(true);
    const res = await rejectRegistration(selectedRegForRejection.id);
    if (res.success) {
      toast.success('Registration rejected.');
      setIsRejectDialogOpen(false);
      loadData();
    } else {
      toast.error('Failed to reject registration.');
      setIsLoading(false);
    }
  };

  const handleEditClick = async (reg) => {
    setIsLoading(true);
    const res = await getUserByEmail(reg.email);
    setIsLoading(false);
    if (res.success && res.user) {
      setUserToEdit(res.user);
      setEditFormData({
        name: res.user.name || '',
        email: res.user.email || '',
        password: res.user.password || '',
        departmentId: res.user.departmentId || '',
        designationId: res.user.designationId || ''
      });
      setIsEditDialogOpen(true);
    } else {
      toast.error('Could not find user account. They may have been deleted.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await editUser(userToEdit.id, editFormData);
    if (res.success) {
      toast.success('User updated successfully');
      setIsEditDialogOpen(false);
      loadData();
    } else {
      toast.error(res.error || 'Failed to update user');
      setIsLoading(false);
    }
  };

  const confirmDeleteReg = async () => {
    if (!regToDelete) return;
    setIsLoading(true);
    const res = await deleteRegistration(regToDelete.id);
    if (res.success) {
      toast.success('Registration record deleted successfully.');
      setRegToDelete(null);
      loadData();
    } else {
      toast.error(res.error || 'Failed to delete registration.');
      setIsLoading(false);
    }
  };

  const filteredRegistrations = registrations.filter(reg => 
    reg.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    reg.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 lg:p-10 animate-in fade-in duration-500 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8 pt-4 pb-16">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight">Registration Hub</h2>
          <p className="text-muted-foreground">Manage system access, signup settings, and approve new members.</p>
        </div>

        {/* Top Section: Settings */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg tracking-tight">Access Control</h3>
            </div>
            <p className="text-sm text-muted-foreground">Enable or disable the public signup page.</p>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
              <span className="font-medium">Allow New Signups</span>
              <Switch 
                checked={signupEnabled}
                onCheckedChange={handleToggleSignup}
              />
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <RefreshCw className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg tracking-tight">Secret OTP Code</h3>
            </div>
            <p className="text-sm text-muted-foreground">Provide this code to teachers who need to sign up.</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-muted/30 border border-border/50 rounded-lg p-3 text-center font-mono font-bold tracking-widest text-lg">
                {otp || '------'}
              </div>
              <Button onClick={handleRegenerateOtp} variant="outline" className="shrink-0" title="Regenerate OTP">
                <RefreshCw className="w-4 h-4 mr-2" /> Regenerate
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Section: Table */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold tracking-tight">Pending Applications</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search name or email..."
                className="pl-9 bg-background shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No pending applications found</h3>
              <p className="text-muted-foreground">There are no pending registrations matching your search.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/50 hover:bg-transparent">
                  <TableHead className="w-[300px] text-xs uppercase tracking-wider font-semibold text-muted-foreground">Employee</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Designation</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Department</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Date</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Status</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((reg) => (
                  <TableRow key={reg.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                            {reg.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{reg.name}</span>
                          <span className="text-xs text-muted-foreground">{reg.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground max-w-[200px] whitespace-normal break-words">
                        <Briefcase className="w-4 h-4 shrink-0" />
                        <span>{reg.designation?.name || 'Unassigned'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground max-w-[200px] whitespace-normal break-words">
                        <Building2 className="w-4 h-4 shrink-0" />
                        <span>{reg.department?.name || 'Unassigned'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{format(new Date(reg.createdAt), 'MMM d, yyyy')}</span>
                    </TableCell>
                    <TableCell>
                      {reg.status === 'PENDING' && <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>}
                      {reg.status === 'APPROVED' && <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Approved</Badge>}
                      {reg.status === 'REJECTED' && <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {reg.status === 'PENDING' && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="h-8 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleRejectClick(reg)}>
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                          </Button>
                          <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleApproveClick(reg)}>
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                          </Button>
                        </div>
                      )}
                      {reg.status === 'APPROVED' && (
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(reg)} className="text-muted-foreground hover:text-foreground hover:bg-transparent" title="Edit User">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setRegToDelete(reg)} className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete Record">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      {reg.status === 'REJECTED' && (
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setRegToDelete(reg)} className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete Record">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Approve Dialog */}
        <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
          <DialogContent className="sm:max-w-[425px] border-border/50 shadow-md bg-card dark:bg-zinc-900/90 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle>Approve Registration</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleApproveSubmit} className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Please verify and assign a department and designation for <strong>{selectedRegForApproval?.name}</strong> before approving.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department <span className="text-destructive">*</span></label>
                  <Select value={approveForm.departmentId} onValueChange={(val) => setApproveForm({...approveForm, departmentId: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department">
                        {departments.find(d => d.id === approveForm.departmentId)?.name || 'Select Department'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Designation <span className="text-destructive">*</span></label>
                  <Select value={approveForm.designationId} onValueChange={(val) => setApproveForm({...approveForm, designationId: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Designation">
                        {designations.find(d => d.id === approveForm.designationId)?.name || 'Select Designation'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {designations.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsApproveDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Approve & Add User
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <AlertDialogContent className="border-border/50 shadow-md bg-card dark:bg-zinc-900/90 backdrop-blur-sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Reject Application</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to reject the application for <strong>{selectedRegForRejection?.name}</strong>? This action will mark their registration as rejected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmReject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Yes, reject
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Registration Confirm Dialog */}
        <AlertDialog open={!!regToDelete} onOpenChange={(open) => !open && setRegToDelete(null)}>
          <AlertDialogContent className="border-border/50 shadow-md bg-card dark:bg-zinc-900/90 backdrop-blur-sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the registration record for <strong>{regToDelete?.name}</strong>.
                {regToDelete?.status === 'APPROVED' && (
                  <span className="block mt-2 font-medium text-destructive">
                    <AlertCircle className="w-4 h-4 inline mr-1 mb-0.5" />
                    Warning: Since this user is APPROVED, this will also delete their User Account entirely.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteReg} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Yes, delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] border-border/50 shadow-md bg-card dark:bg-zinc-900/90 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input 
                  value={editFormData.name} 
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} 
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input 
                  type="email"
                  value={editFormData.email} 
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} 
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input 
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={editFormData.password} 
                  onChange={(e) => setEditFormData({...editFormData, password: e.target.value})} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Select value={editFormData.departmentId} onValueChange={(val) => setEditFormData({...editFormData, departmentId: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department">
                      {departments.find(d => d.id === editFormData.departmentId)?.name || 'Select Department'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Designation</label>
                <Select value={editFormData.designationId} onValueChange={(val) => setEditFormData({...editFormData, designationId: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Designation">
                      {designations.find(d => d.id === editFormData.designationId)?.name || 'Select Designation'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {designations.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
