'use client';

import { useState, useEffect, useRef } from 'react';
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
  const fileInputRef = useRef(null);
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
    <div className="flex-1 p-6 lg:p-10 animate-in fade-in duration-500 h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-12 pb-16 pt-4">
        
        {/* Main Page Header */}
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your profile, security preferences, and view your work details.
          </p>
        </div>
        
        {/* Profile Section (No redundant header) */}
        <div className="space-y-8 pt-4">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 border">
              {data.user.avatar && <AvatarImage src={data.user.avatar} className="object-cover" />}
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                {data.user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={onFileChange}
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Update Avatar
                </Button>
                {data.user.avatar && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleRemoveAvatar}
                    disabled={isRemovingAvatar}
                  >
                    {isRemovingAvatar ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Recommended size: 200x200px. Maximum file size: 5MB.
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="flex gap-3">
                <Input
                  id="fullName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="max-w-md"
                />
                <Button
                  onClick={handleSaveName}
                  disabled={isSavingName || editName === data.user.name}
                >
                  {isSavingName ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                This is the name that will be displayed on your profile.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={data.user.email}
                disabled
                className="max-w-md bg-muted/50 cursor-not-allowed"
              />
              <p className="text-sm text-muted-foreground">
                Your email address is managed by the organization and cannot be changed.
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-border" />

        {/* Security Section */}
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium">Security</h3>
            <p className="text-sm text-muted-foreground">
              Ensure your account is using a long, random password to stay secure.
            </p>
          </div>
          
          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="max-w-md"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="max-w-md"
              />
              <p className="text-sm text-muted-foreground">
                Must be at least 6 characters long.
              </p>
            </div>
            
            <div>
              <Button
                onClick={handleUpdatePassword}
                disabled={isSavingPassword || !currentPassword || !newPassword}
              >
                {isSavingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Update Password
              </Button>
            </div>
          </div>
        </div>

        <div className="border-b border-border" />

        {/* Work Details */}
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium">Work Details</h3>
            <p className="text-sm text-muted-foreground">
              Your organizational role and department assignment.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-xl">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Designation</Label>
              <div className="font-medium text-lg">
                {data.user.designation || 'Not Assigned'}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Department</Label>
              <div className="font-medium text-lg">
                {data.user.department || 'Not Assigned'}
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-border" />

        {/* Leave Balances Dashboard Grid */}
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Leave Balances</h3>
              <p className="text-sm text-muted-foreground">
                Overview of your available time off for {new Date().getFullYear()}.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {data.leaveBalances.length === 0 ? (
              <div className="col-span-full text-muted-foreground text-sm">
                No active leave balances found.
              </div>
            ) : (
              data.leaveBalances.map((balance) => {
                const remaining = balance.totalDays - balance.usedDays;
                const percentage = Math.min(100, Math.max(0, (remaining / balance.totalDays) * 100));
                
                let textColor = "text-emerald-600 dark:text-emerald-500";
                if (percentage < 25) textColor = "text-destructive";
                else if (percentage < 50) textColor = "text-amber-600 dark:text-amber-500";

                return (
                  <div key={balance.id} className="space-y-1.5">
                    <h4 className="text-sm font-medium text-muted-foreground">{balance.leaveType.name}</h4>
                    <div className="text-4xl font-bold tracking-tight">
                      {remaining}
                    </div>
                    <p className={`text-xs font-medium ${textColor}`}>
                      {balance.usedDays} days used of {balance.totalDays}
                    </p>
                  </div>
                );
              })
            )}
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
