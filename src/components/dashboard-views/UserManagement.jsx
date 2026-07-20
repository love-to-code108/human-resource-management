'use client';

import { useState, useEffect } from 'react';
import { getSubordinates, deleteUser, editUser, adjustUserLeaveBalance } from '@/app/actions/userManagement';
import { getDepartments } from '@/app/actions/department';
import { getDesignations } from '@/app/actions/designation';
import { Loader2, Users, Search, ChevronRight, Briefcase, Building2, Calendar, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserActivityTimeline } from './UserActivityTimeline';

export function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [filterDept, setFilterDept] = useState('ALL');
  const [filterDesig, setFilterDesig] = useState('ALL');
  const [sortBy, setSortBy] = useState('name_asc');

  const [selectedUser, setSelectedUser] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    password: '',
    departmentId: '',
    designationId: ''
  });

  const [isAdjustLeaveDialogOpen, setIsAdjustLeaveDialogOpen] = useState(false);
  const [adjustLeaveData, setAdjustLeaveData] = useState({ balanceId: null, leaveTypeId: null, leaveTypeName: '', amount: '', reason: '' });

  useEffect(() => {
    loadUsers();
    loadFilters();
  }, []);

  const loadFilters = async () => {
    const [deptRes, desigRes] = await Promise.all([
      getDepartments(),
      getDesignations()
    ]);
    if (deptRes.success) setDepartments(deptRes.departments || []);
    if (desigRes.success) setDesignations(desigRes.designations || []);
  };

  useEffect(() => {
    let result = [...users];

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.designation?.name || '').toLowerCase().includes(q) ||
        (u.department?.name || '').toLowerCase().includes(q)
      );
    }

    if (filterDept !== 'ALL') {
      result = result.filter(u => u.departmentId === filterDept);
    }

    if (filterDesig !== 'ALL') {
      result = result.filter(u => u.designationId === filterDesig);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'dept_asc':
          return (a.department?.name || '').localeCompare(b.department?.name || '');
        case 'desig_asc':
          return (a.designation?.name || '').localeCompare(b.designation?.name || '');
        case 'name_asc':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredUsers(result);
  }, [searchQuery, filterDept, filterDesig, sortBy, users]);

  const loadUsers = async () => {
    setIsLoading(true);
    const res = await getSubordinates();
    if (res.success) {
      setUsers(res.users || []);
      setFilteredUsers(res.users || []);
      setIsAdmin(res.isAdmin || false);
    } else {
      toast.error(res.error || "Failed to load users");
    }
    setIsLoading(false);
  };

  const initiateDelete = (user) => {
    if (user.isAdmin) {
      toast.error("Cannot delete an Admin account.");
      return;
    }
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsLoading(true);
    const res = await deleteUser(userToDelete.id);
    if (res.success) {
      toast.success(`${userToDelete.name} has been deleted.`);
      setUserToDelete(null);
      loadUsers();
    } else {
      toast.error(res.error || "Failed to delete user.");
      setIsLoading(false);
    }
  };

  const openDetails = (user) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const openEdit = (user) => {
    setUserToEdit(user);
    setEditFormData({
      name: user.name || '',
      email: user.email || '',
      password: user.password || '',
      departmentId: user.departmentId || '',
      designationId: user.designationId || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await editUser(userToEdit.id, editFormData);
    if (res.success) {
      toast.success('User updated successfully');
      setIsEditDialogOpen(false);
      loadUsers();
    } else {
      toast.error(res.error || 'Failed to update user');
      setIsLoading(false);
    }
  };

  const openAdjustLeave = (balance) => {
    setAdjustLeaveData({
      balanceId: balance.id,
      leaveTypeId: balance.leaveType.id,
      leaveTypeName: balance.leaveType.name,
      amount: '',
      reason: ''
    });
    setIsAdjustLeaveDialogOpen(true);
  };

  const handleAdjustLeaveSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await adjustUserLeaveBalance(selectedUser.id, adjustLeaveData.leaveTypeId, adjustLeaveData.amount, adjustLeaveData.reason);
    if (res.success) {
      toast.success('Leave balance updated successfully');
      setIsAdjustLeaveDialogOpen(false);
      
      const numAmount = parseInt(adjustLeaveData.amount, 10);
      setSelectedUser(prev => ({
        ...prev,
        leaveBalances: prev.leaveBalances.map(b => 
          b.id === adjustLeaveData.balanceId 
            ? { ...b, totalDays: b.totalDays + numAmount } 
            : b
        )
      }));
      loadUsers();
    } else {
      toast.error(res.error || 'Failed to update leave balance');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-10 animate-in fade-in duration-500 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8 pt-4 pb-16">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">View the details and leave balances of your team members.</p>
        </div>

        <div className="flex flex-row gap-3 items-center w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or role..."
              className="pl-9 bg-background shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-[160px] bg-background">
                <SelectValue>
                  {filterDept === 'ALL' ? 'All Departments' : (departments.find(d => d.id === filterDept)?.name || 'All Departments')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Departments</SelectItem>
                {departments.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterDesig} onValueChange={setFilterDesig}>
              <SelectTrigger className="w-[160px] bg-background">
                <SelectValue>
                  {filterDesig === 'ALL' ? 'All Roles' : (designations.find(d => d.id === filterDesig)?.name || 'All Roles')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                {designations.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px] bg-background">
                <SelectValue>
                  {sortBy === 'name_asc' ? 'Name (A-Z)' : 
                   sortBy === 'name_desc' ? 'Name (Z-A)' : 
                   sortBy === 'dept_asc' ? 'Department' : 
                   sortBy === 'desig_asc' ? 'Designation' : 'Sort By'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                <SelectItem value="dept_asc">Department</SelectItem>
                <SelectItem value="desig_asc">Designation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground">There are no subordinates mapped to your role, or no users match your search.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/50 hover:bg-transparent">
                  <TableHead className="w-[300px] text-xs uppercase tracking-wider font-semibold text-muted-foreground">Employee</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Designation</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Department</TableHead>
                  {isAdmin && <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border cursor-pointer" onClick={() => openDetails(user)}>
                          {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                          <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span 
                            className="font-medium cursor-pointer hover:underline text-foreground" 
                            onClick={() => openDetails(user)}
                          >
                            {user.name}
                          </span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground max-w-[200px] whitespace-normal break-words">
                        <Briefcase className="w-4 h-4 shrink-0" />
                        <span>{user.designation?.name || 'Unassigned'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground max-w-[200px] whitespace-normal break-words">
                        <Building2 className="w-4 h-4 shrink-0" />
                        <span>{user.department?.name || 'Unassigned'}</span>
                      </div>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!user.isAdmin && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => openEdit(user)} className="text-muted-foreground hover:text-foreground hover:bg-transparent" title="Edit User">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => initiateDelete(user)} className="text-muted-foreground hover:text-destructive hover:bg-transparent" title="Delete User">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* User Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px] border-border/50 shadow-md bg-card dark:bg-zinc-900/90 backdrop-blur-sm">
            {selectedUser && (
              <>
                <DialogHeader className="pb-4 border-b">
                  <DialogTitle className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border">
                      {selectedUser.avatar && <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />}
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                        {selectedUser.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col text-left">
                      <div className="text-xl font-semibold tracking-tight">{selectedUser.name}</div>
                      <div className="text-sm font-normal text-muted-foreground">{selectedUser.email}</div>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider font-semibold">Designation</span>
                      <span className="font-medium text-foreground">{selectedUser.designation?.name || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider font-semibold">Department</span>
                      <span className="font-medium text-foreground">{selectedUser.department?.name || 'Unassigned'}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2 pb-2 border-b">
                      Leave Balances ({new Date().getFullYear()})
                    </h4>
                    
                    {(!selectedUser.leaveBalances || selectedUser.leaveBalances.length === 0) ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No leave balances found for this year.
                      </p>
                    ) : (
                      <div className="flex flex-col">
                        {selectedUser.leaveBalances.map(balance => {
                          const remaining = balance.totalDays - balance.usedDays;
                          
                          return (
                            <div key={balance.id} className="flex items-center justify-between py-3 border-b last:border-0">
                              <div>
                                <span className="font-medium text-sm block">{balance.leaveType.name}</span>
                                <span className="text-xs text-muted-foreground mt-0.5 block">{balance.usedDays} used out of {balance.totalDays}</span>
                                </div>
                              <div className="text-right shrink-0 flex items-center gap-4">
                                <div className="text-right">
                                  <span className="text-2xl font-semibold tracking-tight text-foreground">{remaining}</span>
                                </div>
                                {isAdmin && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={() => openAdjustLeave(balance)}
                                    title="Adjust Leave Balance"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <h4 className="text-sm font-semibold mb-4 pb-2 border-b">
                      Activity Timeline
                    </h4>
                    
                    <div className="max-h-[350px] overflow-y-auto pr-2">
                      <UserActivityTimeline userId={selectedUser.id} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

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
                  type="text" 
                  value={editFormData.password} 
                  onChange={(e) => setEditFormData({...editFormData, password: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Select value={editFormData.departmentId} onValueChange={(val) => setEditFormData({...editFormData, departmentId: val})}>
                  <SelectTrigger>
                    <SelectValue>
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
                    <SelectValue>
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
              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Adjust Leave Dialog */}
        <Dialog open={isAdjustLeaveDialogOpen} onOpenChange={setIsAdjustLeaveDialogOpen}>
          <DialogContent className="sm:max-w-[400px] border-border/50 shadow-md bg-card dark:bg-zinc-900/90 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle>Adjust Leave Balance</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdjustLeaveSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Leave Type</label>
                <div className="text-sm p-2 bg-muted rounded-md">{adjustLeaveData.leaveTypeName}</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Adjustment Amount (+ or -)</label>
                <Input 
                  type="number" 
                  value={adjustLeaveData.amount} 
                  onChange={(e) => setAdjustLeaveData({...adjustLeaveData, amount: e.target.value})} 
                  placeholder="e.g. 2 or -1"
                  required 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use positive numbers to add days, negative to deduct.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Justification Reason</label>
                <Input 
                  value={adjustLeaveData.reason} 
                  onChange={(e) => setAdjustLeaveData({...adjustLeaveData, reason: e.target.value})} 
                  placeholder="Reason for adjustment"
                  required 
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsAdjustLeaveDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Alert Dialog */}
        <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <AlertDialogContent className="border-border/50 shadow-md bg-card dark:bg-zinc-900/90 backdrop-blur-sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete <strong>{userToDelete?.name}</strong>'s account,
                along with all of their leave balances and historical leave requests.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Yes, delete user
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );
}
