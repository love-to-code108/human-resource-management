'use client';

import { useState, useEffect } from 'react';
import { getSubordinates, deleteUser } from '@/app/actions/userManagement';
import { Loader2, Users, Search, ChevronRight, Briefcase, Building2, Calendar, Trash2 } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredUsers(users.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) ||
        u.designation?.name.toLowerCase().includes(q) ||
        u.department?.name.toLowerCase().includes(q)
      ));
    }
  }, [searchQuery, users]);

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

  return (
    <div className="flex-1 p-6 lg:p-8 xl:p-12 animate-in fade-in duration-500 bg-muted/10 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground mt-2">View the details and leave balances of your team members.</p>
        </div>

        <div className="flex items-center space-x-2 bg-background p-1 rounded-lg border max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground ml-2" />
          <Input 
            placeholder="Search by name, email, or role..." 
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="bg-background border rounded-2xl shadow-sm overflow-hidden">
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
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[300px]">Employee</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border">
                          <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Briefcase className="w-4 h-4" />
                        {user.designation?.name || 'Unassigned'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="w-4 h-4" />
                        {user.department?.name || 'Unassigned'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin && !user.isAdmin && (
                          <Button variant="ghost" size="icon" onClick={() => initiateDelete(user)} className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete User">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => openDetails(user)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          View Details
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* User Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            {selectedUser && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                        {selectedUser.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div>{selectedUser.name}</div>
                      <div className="text-sm font-normal text-muted-foreground">{selectedUser.email}</div>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs font-normal">
                      <Briefcase className="w-3 h-3 mr-1" /> {selectedUser.designation?.name}
                    </Badge>
                    <Badge variant="outline" className="text-xs font-normal">
                      <Building2 className="w-3 h-3 mr-1" /> {selectedUser.department?.name}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      Leave Balances ({new Date().getFullYear()})
                    </h4>
                    
                    {(!selectedUser.leaveBalances || selectedUser.leaveBalances.length === 0) ? (
                      <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg text-center">
                        No leave balances found for this year.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {selectedUser.leaveBalances.map(balance => {
                          const remaining = balance.totalDays - balance.usedDays;
                          const percentUsed = (balance.usedDays / balance.totalDays) * 100;
                          
                          return (
                            <div key={balance.id} className="bg-muted/30 border rounded-lg p-3">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-sm">{balance.leaveType.name}</span>
                                <span className="text-xs font-bold px-2 py-1 bg-background rounded-md border shadow-sm">
                                  {remaining} days left
                                </span>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-2 mt-2 overflow-hidden">
                                <div 
                                  className={`h-2 rounded-full ${percentUsed > 80 ? 'bg-destructive' : percentUsed > 50 ? 'bg-yellow-500' : 'bg-primary'}`} 
                                  style={{ width: `${percentUsed}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>{balance.usedDays} used</span>
                                <span>{balance.totalDays} total</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Alert Dialog */}
        <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <AlertDialogContent>
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
