'use client';

import { useState, useEffect } from 'react';

export interface AccessibilityPreferences {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
  colorScheme: 'light' | 'dark' | 'auto';
}

export const useAccessibility = () => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    highContrast: false,
    reducedMotion: false,
    fontSize: 'medium',
    colorScheme: 'auto',
  });

  const [systemPreferences, setSystemPreferences] = useState({
    prefersReducedMotion: false,
    prefersHighContrast: false,
    prefersColorScheme: 'light' as 'light' | 'dark',
  });

  // Detect system preferences
  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateSystemPreferences = () => {
      setSystemPreferences({
        prefersReducedMotion: reducedMotionQuery.matches,
        prefersHighContrast: highContrastQuery.matches,
        prefersColorScheme: darkModeQuery.matches ? 'dark' : 'light',
      });
    };

    updateSystemPreferences();

    reducedMotionQuery.addEventListener('change', updateSystemPreferences);
    highContrastQuery.addEventListener('change', updateSystemPreferences);
    darkModeQuery.addEventListener('change', updateSystemPreferences);

    return () => {
      reducedMotionQuery.removeEventListener('change', updateSystemPreferences);
      highContrastQuery.removeEventListener('change', updateSystemPreferences);
      darkModeQuery.removeEventListener('change', updateSystemPreferences);
    };
  }, []);

  // Load preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('accessibility-preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(parsed);
      } catch (error) {
        console.error('Failed to parse accessibility preferences:', error);
      }
    }
  }, []);

  // Save preferences to localStorage
  const updatePreferences = (newPreferences: Partial<AccessibilityPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    localStorage.setItem('accessibility-preferences', JSON.stringify(updated));
  };

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast mode
    if (preferences.highContrast || systemPreferences.prefersHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (preferences.reducedMotion || systemPreferences.prefersReducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Font size
    root.classList.remove('font-small', 'font-medium', 'font-large');
    root.classList.add(`font-${preferences.fontSize}`);

    // Color scheme
    const effectiveColorScheme = preferences.colorScheme === 'auto' 
      ? systemPreferences.prefersColorScheme 
      : preferences.colorScheme;
      
    root.classList.remove('light', 'dark');
    root.classList.add(effectiveColorScheme);

  }, [preferences, systemPreferences]);

  const toggleHighContrast = () => {
    updatePreferences({ highContrast: !preferences.highContrast });
  };

  const toggleReducedMotion = () => {
    updatePreferences({ reducedMotion: !preferences.reducedMotion });
  };

  const setFontSize = (size: 'small' | 'medium' | 'large') => {
    updatePreferences({ fontSize: size });
  };

  const setColorScheme = (scheme: 'light' | 'dark' | 'auto') => {
    updatePreferences({ colorScheme: scheme });
  };

  return {
    preferences,
    systemPreferences,
    toggleHighContrast,
    toggleReducedMotion,
    setFontSize,
    setColorScheme,
    updatePreferences,
  };
};

export const useScreenReaderAnnouncement = () => {
  const [announcement, setAnnouncement] = useState<string>('');

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Create a live region for screen readers
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = message;
    
    document.body.appendChild(liveRegion);
    
    // Remove the live region after announcement
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);
    
    setAnnouncement(message);
  };

  return { announcement, announce };
};

export const useKeyboardNavigation = () => {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  useEffect(() => {
    if (isKeyboardUser) {
      document.body.classList.add('keyboard-user');
    } else {
      document.body.classList.remove('keyboard-user');
    }
  }, [isKeyboardUser]);

  return { isKeyboardUser };
};

export const useColorContrast = () => {
  const checkContrast = (background: string, text: string): number => {
    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1] || '0', 16),
        g: parseInt(result[2] || '0', 16),
        b: parseInt(result[3] || '0', 16)
      } : null;
    };

    // Calculate luminance
    const getLuminance = (r: number, g: number, b: number) => {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * (rs || 0) + 0.7152 * (gs || 0) + 0.0722 * (bs || 0);
    };

    const bgRgb = hexToRgb(background);
    const textRgb = hexToRgb(text);

    if (!bgRgb || !textRgb) return 0;

    const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
    const textLuminance = getLuminance(textRgb.r, textRgb.g, textRgb.b);

    const lighter = Math.max(bgLuminance, textLuminance);
    const darker = Math.min(bgLuminance, textLuminance);

    return (lighter + 0.05) / (darker + 0.05);
  };

  const isAccessible = (background: string, text: string, level: 'AA' | 'AAA' = 'AA'): boolean => {
    const contrast = checkContrast(background, text);
    return level === 'AA' ? contrast >= 4.5 : contrast >= 7;
  };

  return { checkContrast, isAccessible };
};