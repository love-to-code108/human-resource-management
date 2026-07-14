'use client'

import { useActionState } from 'react';
import { loginAction } from './actions';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

const initialState = {
  message: '',
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2 bg-background">
      {/* Left Branding Panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-10 text-white md:flex lg:p-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-zinc-800/40 via-zinc-950 to-zinc-950" />
        
        <div className="relative z-10 flex items-center gap-2 font-bold tracking-tight text-3xl">
          Leaveflow
        </div>
        
        <div className="relative z-10 space-y-6 max-w-lg">
          <blockquote className="space-y-4">
            <p className="text-3xl lg:text-4xl font-semibold leading-tight text-zinc-100">
              "Frictionless, automated hierarchy approvals at enterprise scale."
            </p>
          </blockquote>
          <div className="flex items-center gap-3 text-sm font-medium text-zinc-400">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            Protected by Leaveflow Enterprise Security
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="mx-auto flex w-full max-w-[380px] flex-col justify-center space-y-8">
          
          <div className="flex flex-col space-y-2 text-center md:text-left">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access the portal
            </p>
          </div>

          <form action={formAction}>
            <div className="grid gap-6">
              {state.message && (
                <div className="rounded-lg bg-destructive/10 p-4 text-sm font-medium text-destructive animate-in fade-in">
                  {state.message}
                </div>
              )}
              
              <div className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="name@university.edu" 
                    required 
                    className="h-11"
                  />
                </div>
                
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    required 
                    className="h-11"
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full group h-11 text-base mt-2" 
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="md:hidden flex flex-col items-center gap-2 mt-8">
            <h2 className="text-xl font-bold">Leaveflow</h2>
            <p className="text-center text-xs font-medium text-muted-foreground">
              Protected by Enterprise Security
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
