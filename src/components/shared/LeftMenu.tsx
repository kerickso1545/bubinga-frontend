import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Settings, 
  LogOut,
  ChevronDown,
  ClipboardList,
  Tags,
  Loader2,
  LayoutDashboard,
  ServerCog
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLayoutStore, useAuthStore, useExceptionCountStore } from '../../lib/store';

export function LeftMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isToolbarExpanded, setToolbarExpanded } = useLayoutStore();
  const { user, logout } = useAuthStore();
  const [isDocumentReviewExpanded, setIsDocumentReviewExpanded] = useState(true);
  
  const { 
    classification: classificationCount, 
    extraction: extractionCount, 
    isLoading: isCountLoading,
    fetchCounts
  } = useExceptionCountStore();

  useEffect(() => {
    fetchCounts();
    
    const intervalId = setInterval(() => {
      fetchCounts();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchCounts]);

  useEffect(() => {
    const isDocumentReviewSection = 
      location.pathname === '/dashboard' || 
      location.pathname === '/' ||
      location.pathname.includes('/classification') ||
      location.pathname.includes('/extraction');
    
    if (!isDocumentReviewSection) {
      setIsDocumentReviewExpanded(false);
    } else {
      setIsDocumentReviewExpanded(true);
    }
  }, [location.pathname]);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Process Dashboard', path: '/process-dashboard' },
  ];

  const documentReviewSubItems = [
    { 
      icon: Tags, 
      label: 'Document Type Issues', 
      count: classificationCount,
      path: '/dashboard',
      isActive: () => location.pathname.includes('/classification')
    },
    { 
      icon: ClipboardList, 
      label: 'Field Issues', 
      count: extractionCount,
      path: '/dashboard',
      isActive: () => location.pathname.includes('/extraction')
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    
    const nameParts = user.name.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || 
             location.pathname === '/';
    }
    return location.pathname === path;
  };

  const isDocumentReviewActive = () => {
    return location.pathname === '/dashboard' || 
           location.pathname === '/' ||
           location.pathname.includes('/classification') ||
           location.pathname.includes('/extraction');
  };

  const toggleDocumentReview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDocumentReviewExpanded(!isDocumentReviewExpanded);
  };

  const totalDocumentCount = classificationCount + extractionCount;

  return (
    <div
      id="leftToolbar"
      className={cn(
        "fixed left-0 top-12 bottom-0 bg-[#003366] shadow-lg transition-all duration-300 z-40 flex flex-col",
        isToolbarExpanded ? "w-48" : "w-12"
      )}
    >
      <button
        id="leftToolbarToggle"
        onClick={() => setToolbarExpanded(!isToolbarExpanded)}
        className="absolute -right-[18px] top-1/2 -translate-y-1/2 bg-white rounded-r shadow-md hover:bg-gray-50 w-[18px] h-16 flex items-center justify-center border border-l-0"
        title={isToolbarExpanded ? "Collapse menu" : "Expand menu"}
      >
        {isToolbarExpanded ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      <div className="flex flex-col space-y-1 w-full pt-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex items-center px-3 py-2 text-[#b3c7e6] hover:bg-[#004480] transition-colors",
                "focus:outline-none focus:bg-[#004480]",
                active && "bg-[#004480]"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span
                className={cn(
                  "ml-3 text-sm whitespace-nowrap transition-all duration-300",
                  isToolbarExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        <div className="w-full">
          <div
            onClick={() => navigate('/dashboard')}
            className={cn(
              "flex items-center px-3 py-2 w-full text-[#b3c7e6] hover:bg-[#004480] transition-colors cursor-pointer",
              "focus:outline-none focus:bg-[#004480]",
              isDocumentReviewActive() && "bg-[#004480]"
            )}
          >
            <FileText className="h-5 w-5 flex-shrink-0" />
            {isToolbarExpanded && (
              <span className="ml-3 text-sm flex-1">
                Document Review
                {!isCountLoading && totalDocumentCount > 0 && (
                  
                  <span className="ml-1 text-xs bg-[#0055a4] rounded-full px-1.5 py-0.5">
                    {totalDocumentCount}
                  </span>
                )}
                {isCountLoading && (
                  <Loader2 className="inline-block h-3 w-3 ml-1 animate-spin" />
                )}
              </span>
            )}
            {isToolbarExpanded && (
              <div
                onClick={toggleDocumentReview}
                className="text-[#b3c7e6] hover:text-white cursor-pointer"
              >
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isDocumentReviewExpanded ? "transform rotate-0" : "transform rotate-[-90deg]"
                  )} 
                />
              </div>
            )}
          </div>

          {(isToolbarExpanded && isDocumentReviewExpanded) || !isToolbarExpanded ? (
            <div className={cn(
              isToolbarExpanded ? "pl-2 space-y-1 relative" : "pl-0 space-y-1 mt-1 relative"
            )}>
              <div className={cn(
                "absolute top-0 bottom-0 w-[2px] bg-[#1a4d80] opacity-70",
                "left-[6px]"
              )}></div>
              
              {documentReviewSubItems.map((subItem, index) => {
                const SubIcon = subItem.icon;
                const isSubActive = subItem.isActive();
                
                return (
                  <div
                    key={index}
                    onClick={() => navigate(subItem.path)}
                    className={cn(
                      "flex items-center w-full text-[#b3c7e6] hover:bg-[#004480] transition-colors cursor-pointer",
                      "focus:outline-none focus:bg-[#004480]",
                      isSubActive && "bg-[#004480]",
                      isToolbarExpanded ? "px-3 py-2 rounded-md" : "px-3 py-2"
                    )}
                  >
                    {!isToolbarExpanded && (
                      <div className="flex justify-center w-full relative">
                        <div className="relative">
                          <SubIcon className="h-5 w-5 flex-shrink-0" />
                          
                          {subItem.count > 0 && (
                            <span className="absolute -top-2 -right-2 bg-[#0055a4] rounded-full w-4 h-4 flex items-center justify-center text-[10px] text-white">
                              {subItem.count}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {isToolbarExpanded && (
                      <>
                        <div className="relative ml-[10px]">
                          <SubIcon className="h-4 w-4 flex-shrink-0" />
                        </div>
                        
                        <span className="ml-2 text-xs flex-1">
                          {subItem.label}
                          {!isCountLoading && subItem.count > 0 && (
                            <span className="ml-1 text-xs bg-[#0055a4] rounded-full px-1.5 py-0.5">
                              {subItem.count}
                            </span>
                          )}
                          {isCountLoading && (
                            <Loader2 className="inline-block h-3 w-3 ml-1 animate-spin" />
                          )}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <button
          onClick={() => navigate('/admin')}
          className={cn(
            "flex items-center px-3 py-2 w-full text-[#b3c7e6] hover:bg-[#004480] transition-colors",
            location.pathname === '/admin' && "bg-[#004480]"
          )}
        >
          <ServerCog className="h-5 w-5 flex-shrink-0" />
          <span
            className={cn(
              "ml-3 text-sm whitespace-nowrap transition-all duration-300",
              isToolbarExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
            )}
          >
            Admin
          </span>
        </button>
      </div>

      <div className="mt-auto mb-4 w-full">
        <div className="border-t border-[#004480] my-2 w-full"></div>
        
        <div className={cn(
          "flex items-center px-3 py-2 text-[#b3c7e6]",
          isToolbarExpanded ? "justify-start" : "justify-center"
        )}>
          <div className="bg-[#004480] rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">{getUserInitials()}</span>
          </div>
          <div className={cn(
            "ml-3 transition-all duration-300",
            isToolbarExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
          )}>
            <div className="text-sm font-medium">{user?.name || 'User'}</div>
            <div className="text-xs text-[#8ba6cc] truncate">{user?.email || ''}</div>
          </div>
        </div>

        <button
          onClick={() => navigate('/settings')}
          className={cn(
            "flex items-center px-3 py-2 w-full text-[#b3c7e6] hover:bg-[#004480] transition-colors",
            location.pathname === '/settings' && "bg-[#004480]"
          )}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          <span
            className={cn(
              "ml-3 text-sm whitespace-nowrap transition-all duration-300",
              isToolbarExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
            )}
          >
            Settings
          </span>
        </button>
        
        <button
          onClick={handleLogout}
          className="flex items-center px-3 py-2 w-full text-[#b3c7e6] hover:bg-[#004480] transition-colors"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span
            className={cn(
              "ml-3 text-sm whitespace-nowrap transition-all duration-300",
              isToolbarExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
            )}
          >
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}