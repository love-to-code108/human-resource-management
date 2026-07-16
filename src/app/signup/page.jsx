'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GalleryVerticalEnd, Loader2, ArrowRight, CheckCircle2, Clock, XCircle, ShieldCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import Link from 'next/link';
import { getDepartments } from '@/app/actions/department';
import { getDesignations } from '@/app/actions/designation';
import { submitSignup, checkRegistrationStatus, checkIfSignupEnabled } from '@/app/actions/registration';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SignupPage() {
  const router = useRouter();
  
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [appStatus, setAppStatus] = useState(null); // 'PENDING', 'APPROVED', 'REJECTED', or null
  const [isSignupEnabled, setIsSignupEnabled] = useState(true);
  
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    departmentId: '',
    designationId: '',
    otp: ''
  });

  useEffect(() => {
    // Check if user has already applied
    const existingId = localStorage.getItem('registrationId');
    if (existingId) {
      checkStatus(existingId);
    } else {
      loadFormData();
    }
  }, []);

  const checkStatus = async (id) => {
    const res = await checkRegistrationStatus(id);
    if (res.success) {
      setAppStatus(res.status);
    } else {
      // Maybe the record was completely deleted, clear local storage
      localStorage.removeItem('registrationId');
      loadFormData();
    }
    setIsPageLoading(false);
  };

  const loadFormData = async () => {
    setIsLoading(true);
    const enabledRes = await checkIfSignupEnabled();
    if (enabledRes.success && !enabledRes.enabled) {
      setIsSignupEnabled(false);
      setIsLoading(false);
      setIsPageLoading(false);
      return;
    }

    const [deptRes, desigRes] = await Promise.all([getDepartments(), getDesignations()]);
    if (deptRes.success) setDepartments(deptRes.departments || []);
    if (desigRes.success) setDesignations(desigRes.designations || []);
    setIsLoading(false);
    setIsPageLoading(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    
    setIsLoading(true);
    const res = await submitSignup(formData);
    
    if (res.success) {
      toast.success('Application submitted successfully!');
      localStorage.setItem('registrationId', res.registrationId);
      setAppStatus('PENDING');
    } else {
      toast.error(res.error || 'Signup failed.');
    }
    setIsLoading(false);
  };

  if (isPageLoading) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // --- ALREADY APPLIED VIEWS ---
  if (appStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-8">
        <div className="w-full max-w-[420px] space-y-10">
          <div className="flex flex-col gap-6">
            <div className="space-y-3">
              <div className="font-bold tracking-tight text-xl text-foreground">
                Leaveflow
              </div>
            </div>
            
            <div className="bg-card border border-border/50 rounded-xl shadow-sm p-8 text-center space-y-6">
              {appStatus === 'PENDING' && (
                <>
                  <div className="mx-auto w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center">
                    <Clock className="w-8 h-8 text-yellow-600" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold tracking-tight">Application Under Review</h2>
                    <p className="text-sm text-muted-foreground">Your signup request has been submitted and is currently waiting for administrator approval. Please check back later.</p>
                  </div>
                </>
              )}
              {appStatus === 'APPROVED' && (
                <>
                  <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold tracking-tight">Application Approved!</h2>
                    <p className="text-sm text-muted-foreground">Your account has been fully approved and is ready to use.</p>
                  </div>
                  <Button className="w-full" asChild>
                    <Link href="/login">
                      Go to Login <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </>
              )}
              {appStatus === 'REJECTED' && (
                <>
                  <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-destructive" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold tracking-tight">Application Rejected</h2>
                    <p className="text-sm text-muted-foreground">Unfortunately, your signup request was not approved. Please contact an administrator for more details.</p>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => {
                    localStorage.removeItem('registrationId');
                    setAppStatus(null);
                    loadFormData();
                  }}>
                    Try Again
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- SIGNUPS DISABLED VIEW ---
  if (!isSignupEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-8">
        <div className="w-full max-w-[420px] space-y-10">
          <div className="flex flex-col gap-6">
            <div className="space-y-3">
              <div className="font-bold tracking-tight text-xl text-foreground">
                Leaveflow
              </div>
            </div>
            <div className="bg-card border border-border/50 rounded-xl shadow-sm p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">Signups Disabled</h2>
                <p className="text-sm text-muted-foreground">New account registrations are currently closed. Please contact your administrator if you need access.</p>
              </div>
              <Button className="w-full" asChild>
                <Link href="/login">
                  Back to Login
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- SIGNUP FORM VIEW ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-[420px] space-y-10">
        
        {/* Header */}
        <div className="space-y-3">
          <div className="font-bold tracking-tight text-xl text-foreground">
            Leaveflow
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Create account</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your details and the invite code to apply
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" placeholder="John Doe" required value={formData.name} onChange={handleChange} className="h-11 shadow-sm bg-background" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="m@example.com" required value={formData.email} onChange={handleChange} className="h-11 shadow-sm bg-background" />
              </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} className="h-11 shadow-sm bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} className="h-11 shadow-sm bg-background" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={formData.departmentId} onValueChange={(val) => handleSelectChange('departmentId', val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Select value={formData.designationId} onValueChange={(val) => handleSelectChange('designationId', val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your designation" />
                    </SelectTrigger>
                    <SelectContent>
                      {designations.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">Secret Invite Code</Label>
                  <Input id="otp" name="otp" type="text" placeholder="Enter code provided by Admin" required className="h-11 font-mono shadow-sm bg-background" value={formData.otp} onChange={handleChange} />
                </div>
              </div>

              <Button type="submit" className="w-full h-11 text-base mt-2" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : "Sign Up"}
              </Button>
            </div>
          </form>

          {/* Footer & Links */}
          <div className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="underline underline-offset-4 font-medium hover:text-foreground">
                Sign in
              </Link>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground pt-4">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Protected by Enterprise Security
            </div>
        </div>
      </div>
    </div>
  );
}
