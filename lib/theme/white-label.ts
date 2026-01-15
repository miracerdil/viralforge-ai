/**
 * White-Label Theme System
 * Handles custom branding and theming for workspaces
 */

export interface WhiteLabelTheme {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: string;
  fontFamily: string;
}

export interface WhiteLabelSettings {
  workspaceId: string;
  customDomain: string | null;
  domainVerified: boolean;
  customLogoUrl: string | null;
  customFaviconUrl: string | null;
  appName: string;
  supportEmail: string | null;
  supportUrl: string | null;
  theme: WhiteLabelTheme;
  hideViralForgeBranding: boolean;
  customCss: string | null;
  isActive: boolean;
}

export const DEFAULT_THEME: WhiteLabelTheme = {
  primaryColor: '#6366f1',
  accentColor: '#8b5cf6',
  backgroundColor: '#ffffff',
  textColor: '#111827',
  borderRadius: '0.5rem',
  fontFamily: 'Inter',
};

/**
 * Generate CSS variables from theme
 */
export function generateThemeCss(theme: WhiteLabelTheme): string {
  // Convert hex to HSL for Tailwind CSS variable format
  const hexToHsl = (hex: string): string => {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  return `
    :root {
      --wl-primary: ${hexToHsl(theme.primaryColor)};
      --wl-accent: ${hexToHsl(theme.accentColor)};
      --wl-background: ${theme.backgroundColor};
      --wl-text: ${theme.textColor};
      --wl-radius: ${theme.borderRadius};
      --wl-font-family: ${theme.fontFamily}, system-ui, sans-serif;
    }

    .white-label {
      --primary-50: hsl(var(--wl-primary) / 0.05);
      --primary-100: hsl(var(--wl-primary) / 0.1);
      --primary-200: hsl(var(--wl-primary) / 0.2);
      --primary-300: hsl(var(--wl-primary) / 0.3);
      --primary-400: hsl(var(--wl-primary) / 0.4);
      --primary-500: hsl(var(--wl-primary));
      --primary-600: hsl(var(--wl-primary) / 0.9);
      --primary-700: hsl(var(--wl-primary) / 0.8);

      background-color: var(--wl-background);
      color: var(--wl-text);
      font-family: var(--wl-font-family);
    }

    .white-label .rounded-lg,
    .white-label .rounded-xl,
    .white-label .rounded-2xl {
      border-radius: var(--wl-radius);
    }
  `.trim();
}

/**
 * Apply theme to document
 */
export function applyTheme(theme: WhiteLabelTheme, customCss?: string | null): void {
  // Remove existing theme style
  const existingStyle = document.getElementById('white-label-theme');
  if (existingStyle) {
    existingStyle.remove();
  }

  // Create new style element
  const styleElement = document.createElement('style');
  styleElement.id = 'white-label-theme';
  styleElement.textContent = generateThemeCss(theme) + (customCss || '');

  // Add to document
  document.head.appendChild(styleElement);

  // Add class to body
  document.body.classList.add('white-label');
}

/**
 * Remove theme from document
 */
export function removeTheme(): void {
  const existingStyle = document.getElementById('white-label-theme');
  if (existingStyle) {
    existingStyle.remove();
  }
  document.body.classList.remove('white-label');
}

/**
 * Validate hex color
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Lighten or darken a hex color
 */
export function adjustColor(hex: string, amount: number): string {
  hex = hex.replace('#', '');

  const num = parseInt(hex, 16);
  let r = (num >> 16) + amount;
  let g = ((num >> 8) & 0x00ff) + amount;
  let b = (num & 0x0000ff) + amount;

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
