'use client';

import { useState, useEffect } from 'react';
import { getUserSettings, updateUserName, updateUserPassword, updateUserAvatar, removeUserAvatar } from '@/app/actions/userSettings';
import { Loader2, User, Building, Settings as SettingsIcon, Briefcase, Camera, Check, Lock, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';
import { useRouter } from 'next/navigation';

export function UserSettings() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingName, setIsSavingName] = useState(false);
  const [editName, setEditName] = useState('');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Cropper State
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const res = await getUserSettings();
    if (res.success) {
      setData(res);
      setEditName(res.user.name);
    } else {
      toast.error(res.error || 'Failed to load settings');
    }
    setIsLoading(false);
  };

  const handleSaveName = async () => {
    if (!editName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    if (editName === data.user.name) return; // No change

    setIsSavingName(true);
    const res = await updateUserName(editName);
    if (res.success) {
      toast.success('Name updated successfully');
      setData({
        ...data,
        user: { ...data.user, name: res.name }
      });
      // Optionally trigger a sidebar refresh if we lift state, 
      // but a page refresh or global store update might be needed for instant sidebar change.
      // For now, it will update on next load.
    } else {
      toast.error(res.error || 'Failed to update name');
    }
    setIsSavingName(false);
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Both password fields are required');
      return;
    }
    
    setIsSavingPassword(true);
    const res = await updateUserPassword(currentPassword, newPassword);
    if (res.success) {
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
    } else {
      toast.error(res.error || 'Failed to update password');
    }
    setIsSavingPassword(false);
  };

  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result);
        setIsCropping(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleUploadAvatar = async () => {
    try {
      setIsUploadingAvatar(true);
      const croppedImageBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      const res = await updateUserAvatar(croppedImageBase64);
      if (res.success) {
        toast.success('Profile picture updated successfully!');
        setData({
          ...data,
          user: { ...data.user, avatar: croppedImageBase64 }
        });
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to update profile picture');
      }
    } catch (e) {
      console.error(e);
      toast.error('An error occurred while cropping the image');
    } finally {
      setIsUploadingAvatar(false);
      setIsCropping(false);
      setImageSrc(null);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setIsRemovingAvatar(true);
      const res = await removeUserAvatar();
      if (res.success) {
        toast.success('Profile picture removed');
        setData({
          ...data,
          user: { ...data.user, avatar: null }
        });
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to remove profile picture');
      }
    } catch (e) {
      console.error(e);
      toast.error('An error occurred while removing the image');
    } finally {
      setIsRemovingAvatar(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex-1 p-6 lg:p-8 xl:p-12 animate-in fade-in duration-500 bg-muted/10 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-8 h-8 text-primary" />
            Account Settings
          </h2>
          <p className="text-muted-foreground mt-2">Manage your profile, view work details, and check your leave balances.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column - Profile & Settings */}
          <div className="md:col-span-2 space-y-8">
            
            {/* Profile Section */}
            <div className="bg-background border rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b bg-muted/20">
                <h3 className="font-semibold text-lg">Profile Information</h3>
                <p className="text-sm text-muted-foreground">Update your personal details here.</p>
              </div>
              <div className="p-6 space-y-8">
                
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <label htmlFor="avatar-upload" className="cursor-pointer">
                      <Avatar className="h-24 w-24 border-4 border-background shadow-md transition-transform group-hover:scale-105">
                        {data.user.avatar && <AvatarImage src={data.user.avatar} />}
                        <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                          {data.user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </label>
                    <input 
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onFileChange}
                    />
                  </div>
                  <div>
                    <h4 className="font-medium">Profile Picture</h4>
                    <p className="text-sm text-muted-foreground mb-3">Upload a square image, ideally 200x200px.</p>
                    <div className="flex items-center gap-3">
                      <Label htmlFor="avatar-upload" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3 cursor-pointer">
                        Change Avatar
                      </Label>
                      {data.user.avatar && (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="h-8" 
                          onClick={handleRemoveAvatar}
                          disabled={isRemovingAvatar}
                        >
                          {isRemovingAvatar ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Name Section */}
                <div className="grid gap-2 max-w-md">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="fullName" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                    <Button 
                      onClick={handleSaveName} 
                      disabled={isSavingName || editName === data.user.name}
                    >
                      {isSavingName ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                    </Button>
                  </div>
                </div>

                {/* Email Section (Read Only) */}
                <div className="grid gap-2 max-w-md">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    value={data.user.email}
                    disabled
                    className="bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground">Email addresses cannot be changed.</p>
                </div>

              </div>
            </div>

            {/* Security Section */}
            <div className="bg-background border rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b bg-muted/20">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  Security
                </h3>
                <p className="text-sm text-muted-foreground">Manage your password.</p>
              </div>
              <div className="p-6 space-y-6 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input 
                    id="currentPassword" 
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input 
                    id="newPassword" 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Password must be at least 6 characters.</p>
                </div>
                <Button 
                  onClick={handleUpdatePassword} 
                  disabled={isSavingPassword || !currentPassword || !newPassword}
                >
                  {isSavingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Update Password
                </Button>
              </div>
            </div>

            {/* Work Details Section */}
            <div className="bg-background border rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b bg-muted/20">
                <h3 className="font-semibold text-lg">Work Details</h3>
                <p className="text-sm text-muted-foreground">Your organizational role and department.</p>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Briefcase className="w-4 h-4" />
                    <Label className="text-xs font-semibold uppercase tracking-wider">Designation</Label>
                  </div>
                  <div className="font-medium text-lg bg-muted/30 p-3 rounded-lg border">
                    {data.user.designation || 'Not Assigned'}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Building className="w-4 h-4" />
                    <Label className="text-xs font-semibold uppercase tracking-wider">Department</Label>
                  </div>
                  <div className="font-medium text-lg bg-muted/30 p-3 rounded-lg border">
                    {data.user.department || 'Not Assigned'}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - Leave Balances */}
          <div className="space-y-6">
            <div className="bg-background border rounded-2xl shadow-sm overflow-hidden sticky top-8">
              <div className="p-6 border-b bg-muted/20">
                <h3 className="font-semibold text-lg">Leave Balances</h3>
                <p className="text-sm text-muted-foreground">Your available time off.</p>
              </div>
              <div className="p-6 space-y-6">
                {data.leaveBalances.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No leave balances found.</p>
                  </div>
                ) : (
                  data.leaveBalances.map((balance) => {
                    const remaining = balance.totalDays - balance.usedDays;
                    const percentage = Math.min(100, Math.max(0, (remaining / balance.totalDays) * 100));
                    
                    let colorClass = "bg-emerald-500";
                    if (percentage < 25) colorClass = "bg-red-500";
                    else if (percentage < 50) colorClass = "bg-yellow-500";

                    return (
                      <div key={balance.id} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="font-medium text-sm">{balance.leaveType.name}</span>
                          <span className="text-xs font-bold bg-muted px-2 py-1 rounded-md">
                            {remaining} / {balance.totalDays} left
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-muted/50 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${colorClass} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Cropper Modal */}
      <Dialog open={isCropping} onOpenChange={setIsCropping}>
        <DialogContent className="sm:max-w-[500px]" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Crop Profile Picture</DialogTitle>
            <DialogDescription>
              Drag and zoom to align your face perfectly inside the circle.
            </DialogDescription>
          </DialogHeader>
          <div className="relative w-full h-[300px] bg-black/10 rounded-md overflow-hidden my-4">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCropping(false); setImageSrc(null); }}>
              Cancel
            </Button>
            <Button onClick={handleUploadAvatar} disabled={isUploadingAvatar}>
              {isUploadingAvatar ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Apply & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
