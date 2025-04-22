import { useNavigate } from 'react-router-dom';
import { useLayoutStore } from '../../lib/store';
import { LeftMenu } from '../shared/LeftMenu';

export function Home() {
  const navigate = useNavigate();
  const { isToolbarExpanded } = useLayoutStore();

  return (
    <div id="mainContainer" className="fixed inset-0">
      <div id="topBar" className="fixed top-0 left-0 right-0 bg-[#eef5ff] shadow-sm z-50 h-12">
        <div className="flex items-center justify-between h-full px-4">
          <h1 className="text-lg font-semibold text-gray-900">
            Home
          </h1>
          <div className="flex items-center space-x-2">
            {/* Empty placeholder for future user/settings content */}
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
        <div className="p-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Welcome</h2>
            </div>
            
            <div className="p-6">
              <p className="text-gray-500 mb-4">
                Welcome to Bubinga Refinish. This is the home page.
              </p>
              
              <p className="text-gray-500">
                Use the navigation menu on the left to access different sections of the application.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}