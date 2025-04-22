import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Settings, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      icon: FileText,
      label: 'Exception Review',
      path: '/dashboard',
    },
    {
      icon: Settings,
      label: 'Admin',
      path: '/admin',
    },
  ];

  // Check if we're on a review page
  const isReviewPage = location.pathname.includes('classification') || 
                      location.pathname.includes('extraction');

  // If we're on a review page, don't render the layout structure
  if (isReviewPage) {
    return <>{children}</>;
  }

  return <>{children}</>;
}