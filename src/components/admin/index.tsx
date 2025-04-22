import { useState, useEffect } from 'react';
import { useLayoutStore } from '../../lib/store';
import { LeftMenu } from '../shared/LeftMenu';
import { getProcessingConfig, updateProcessingConfig } from '../../lib/api';
import { Plus, Minus } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export function Admin() {
  const { isToolbarExpanded } = useLayoutStore();
  const [isProcessingEnabled, setIsProcessingEnabled] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workers, setWorkers] = useState(0);
  const [maxWorkers, setMaxWorkers] = useState(1);

  useEffect(() => {
    async function fetchProcessingConfig() {
      try {
        const data = await getProcessingConfig();
        setIsProcessingEnabled(data.enabled);
        setStatus(data.status);
        setWorkers(data.workers);
        setMaxWorkers(data.max_workers);
      } catch (err) {
        console.error('Failed to fetch processing config:', err);
        setError('Failed to load processing configuration');
      } finally {
        setLoading(false);
      }
    }

    fetchProcessingConfig();
  }, []);

  const toggleProcessing = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await updateProcessingConfig(isProcessingEnabled ? 0 : workers || 1);
      setIsProcessingEnabled(data.enabled);
      setStatus(data.status);
      setWorkers(data.workers);
    } catch (err) {
      console.error('Failed to toggle processing:', err);
      setError('Failed to update processing configuration');
    } finally {
      setLoading(false);
    }
  };

  const updateWorkers = async (newWorkers: number) => {
    if (newWorkers < 0 || newWorkers > maxWorkers) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await updateProcessingConfig(newWorkers);
      setIsProcessingEnabled(data.enabled);
      setStatus(data.status);
      setWorkers(data.workers);
    } catch (err) {
      console.error('Failed to update workers:', err);
      setError('Failed to update worker count');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="mainContainer" className="fixed inset-0">
      <div id="topBar" className="fixed top-0 left-0 right-0 bg-[#eef5ff] shadow-sm z-50 h-12">
        <div className="flex items-center justify-between h-full px-4">
          <h1 className="text-lg font-semibold text-gray-900">
            Administration
          </h1>
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
              <h2 className="text-lg font-semibold">System Administration</h2>
            </div>
            
            <div className="p-6">
              <div className="mb-8">
                <h3 className="text-base font-medium text-gray-900 mb-4">Processing Control</h3>
                <div className="flex items-center space-x-4">
                  <div 
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer",
                      loading ? 'opacity-50 cursor-not-allowed' : '',
                      isProcessingEnabled ? "bg-primary-600" : "bg-gray-200"
                    )}
                    onClick={loading ? undefined : toggleProcessing}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        isProcessingEnabled ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateWorkers(workers - 1)}
                      disabled={loading || workers <= 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium w-8 text-center">{workers}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateWorkers(workers + 1)}
                      disabled={loading || workers >= maxWorkers}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-500 ml-2">
                      workers (max: {maxWorkers})
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-gray-600">
                    {loading ? 'Updating...' : status}
                  </span>
                </div>
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
              </div>

              <div className="mt-4 border rounded-md p-4 bg-gray-50">
                <div className="text-center text-gray-400 py-8">
                  Additional administration features coming soon
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}