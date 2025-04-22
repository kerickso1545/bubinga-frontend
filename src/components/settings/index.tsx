import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Lock, Activity, Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLayoutStore, useAuthStore } from '../../lib/store';
import { LeftMenu } from '../shared/LeftMenu';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export function Settings() {
  const navigate = useNavigate();
  const { isToolbarExpanded } = useLayoutStore();
  const { user } = useAuthStore();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    
    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    
    if (!newPassword) {
      setPasswordError('New password is required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    // Simulate password change
    setTimeout(() => {
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 500);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    // In a real implementation, this would update the theme in the app
  };

  return (
    <div id="mainContainer" className="fixed inset-0">
      <div id="topBar" className="fixed top-0 left-0 right-0 bg-[#eef5ff] shadow-sm z-50 h-12">
        <div className="flex items-center justify-between h-full px-4">
          <h1 className="text-lg font-semibold text-gray-900">
            Settings
          </h1>
          <div className="flex items-center space-x-2">
            {/* Empty placeholder for future content */}
          </div>
        </div>
      </div>

      <LeftMenu />

      <div 
        className="fixed top-12 bottom-0 overflow-auto transition-all duration-300 bg-[#f1f7ff]"
        style={{ 
          left: isToolbarExpanded ? '12rem' : '3rem',
          right: 0
        }}
      >
        <div className="p-6 max-w-4xl mx-auto">
          {/* Password Change Section */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b flex items-center">
              <Lock className="h-5 w-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-semibold">Change Password</h2>
            </div>
            
            <div className="p-6">
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                {passwordError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                    {passwordError}
                  </div>
                )}
                
                {passwordSuccess && (
                  <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
                    Password changed successfully
                  </div>
                )}
                
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <Button type="submit" className="mt-2">
                  <Save className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </form>
            </div>
          </div>
          
          {/* Theme Settings */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b flex items-center">
              <Moon className="h-5 w-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-semibold">Theme Settings</h2>
            </div>
            
            <div className="p-6">
              <div className="flex flex-wrap gap-4">
                <Button
                  variant={theme === 'light' ? 'primary' : 'outline'}
                  onClick={() => handleThemeChange('light')}
                  className="flex-1 min-w-[120px]"
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </Button>
                
                <Button
                  variant={theme === 'dark' ? 'primary' : 'outline'}
                  onClick={() => handleThemeChange('dark')}
                  className="flex-1 min-w-[120px]"
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </Button>
                
                <Button
                  variant={theme === 'system' ? 'primary' : 'outline'}
                  onClick={() => handleThemeChange('system')}
                  className="flex-1 min-w-[120px]"
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  System Default
                </Button>
              </div>
              
              <p className="mt-4 text-sm text-gray-500">
                Choose your preferred theme for the application. System default will follow your device settings.
              </p>
            </div>
          </div>
          
          {/* My Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex items-center">
              <Activity className="h-5 w-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-semibold">My Activity</h2>
            </div>
            
            <div className="p-6">
              <p className="text-gray-500">
                Your recent activity will be displayed here. This feature is coming soon.
              </p>
              
              <div className="mt-4 border rounded-md p-4 bg-gray-50">
                <div className="text-center text-gray-400 py-8">
                  No activity data available yet
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}