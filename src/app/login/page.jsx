'use client'

import { useActionState, useState } from 'react';
import { loginAction } from './actions';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const initialState = {
  message: '',
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-[380px] space-y-10">

        {/* Header */}
        <div className="space-y-3">
          <div className="font-bold tracking-tight text-xl text-foreground">
            Leaveflow
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your credentials to access the portal
            </p>
          </div>
        </div>

        {/* Form */}
        <form action={formAction}>
          <div className="space-y-6">
            {state.message && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm font-medium text-destructive animate-in fade-in">
                {state.message}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@university.edu"
                  required
                  className="h-11 shadow-sm bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="h-11 shadow-sm pr-10 bg-background"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base mt-2"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                "Sign In"
              )}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground pt-4">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          Protected by Enterprise Security
        </div>

      </div>
    </div>
  );
}
