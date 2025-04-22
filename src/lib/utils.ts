import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.log('Invalid date string:', dateString);
      return 'N/A';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
}

export function encodeDocId(path: string): string {
  const bytes = new TextEncoder().encode(path);
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function decodeDocId(docId: string): string {
  const base64 = docId
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padding = base64.length % 4;
  const paddedBase64 = padding ? base64 + '='.repeat(4 - padding) : base64;
  const bytes = Uint8Array.from(atob(paddedBase64), c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}