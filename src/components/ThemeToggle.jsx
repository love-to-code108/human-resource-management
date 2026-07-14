'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export function ThemeToggle({ asDropdownItem }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:bg-muted">
        <span className="h-4 w-4" />
      </Button>
    )
  }

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  if (asDropdownItem) {
    return (
      <div 
        onClick={toggleTheme}
        className="flex items-center w-full cursor-pointer"
      >
        <div className="relative w-4 h-4 mr-2 flex items-center justify-center">
          <Sun className="h-4 w-4 transition-all duration-500 absolute dark:rotate-90 dark:opacity-0 opacity-100 rotate-0" />
          <Moon className="h-4 w-4 transition-all duration-500 absolute dark:rotate-0 dark:opacity-100 opacity-0 -rotate-90" />
        </div>
        <span>Appearance</span>
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="shrink-0 text-muted-foreground hover:text-foreground relative overflow-hidden transition-colors"
      onClick={toggleTheme}
    >
      <Sun className="h-4 w-4 transition-all duration-500 absolute dark:rotate-90 dark:opacity-0 opacity-100 rotate-0" />
      <Moon className="h-4 w-4 transition-all duration-500 absolute dark:rotate-0 dark:opacity-100 opacity-0 -rotate-90" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
