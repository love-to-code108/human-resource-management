'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
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

  return (
    <Button
      variant="ghost"
      size="icon"
      className="shrink-0 text-muted-foreground hover:text-foreground relative overflow-hidden transition-colors"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      <Sun className="h-4 w-4 transition-all duration-500 absolute dark:rotate-90 dark:opacity-0 opacity-100 rotate-0" />
      <Moon className="h-4 w-4 transition-all duration-500 absolute dark:rotate-0 dark:opacity-100 opacity-0 -rotate-90" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
