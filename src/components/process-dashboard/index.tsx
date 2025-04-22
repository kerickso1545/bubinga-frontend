import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Inbox, 
  Tags, 
  Scissors, 
  ClipboardList, 
  FileDigit,
  LayoutGrid,
  List,
  Plus,
  Minus
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLayoutStore } from '../../lib/store';
import { LeftMenu } from '../shared/LeftMenu';
import { Button } from '../ui/button';
import { getQueues, getProcessingConfig, updateProcessingConfig } from '../../lib/api';
import { QueueData } from '../../lib/types';

type ViewMode = 'grid' | 'list';

export function ProcessDashboard() {
  const navigate = useNavigate();
  const { isToolbarExpanded } = useLayoutStore();
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isProcessingEnabled, setIsProcessingEnabled] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingLoading, setProcessingLoading] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const fetchQueueData = async () => {
    try {
      setRefreshing(true);
      const data = await getQueues();
      setQueueData(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to fetch queue data:', err);
      setError('Failed to load queue data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        await Promise.all([
          fetchQueueData(),
          fetchProcessingStatus()
        ]);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    }

    loadData();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (autoRefresh) {
      intervalRef.current = window.setInterval(() => {
        fetchQueueData();
        fetchProcessingStatus();
      }, refreshInterval * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval]);

  const fetchProcessingStatus = async () => {
    try {
      const data = await getProcessingConfig();
      setIsProcessingEnabled(data.enabled);
      setProcessingStatus(data.status);
    } catch (err) {
      console.error('Failed to fetch processing status:', err);
    }
  };

  const toggleProcessing = async () => {
    try {
      setProcessingLoading(true);
      const data = await updateProcessingConfig(isProcessingEnabled ? 0 : 1);
      setIsProcessingEnabled(data.enabled);
      setProcessingStatus(data.status);
    } catch (err) {
      console.error('Failed to toggle processing:', err);
    } finally {
      setProcessingLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchQueueData();
    fetchProcessingStatus();
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const handleIntervalChange = (seconds: number) => {
    setRefreshInterval(seconds);
  };

  const calculateTotal = (data: QueueData) => {
    let total = 0;
    Object.values(data).forEach(queue => {
      total += queue.input + queue.working + queue.exceptions;
    });
    return total;
  };

  const getBusiestQueue = (data: QueueData) => {
    let busiest = { name: '', count: 0 };
    
    Object.entries(data).forEach(([name, queue]) => {
      const count = queue.input + queue.working + queue.exceptions;
      if (count > busiest.count) {
        busiest = { name, count };
      }
    });
    
    return busiest;
  };

  const getMostExceptions = (data: QueueData) => {
    let most = { name: '', count: 0 };
    
    Object.entries(data).forEach(([name, queue]) => {
      if (queue.exceptions > most.count) {
        most = { name, count: queue.exceptions };
      }
    });
    
    return most;
  };

  const formatQueueName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const getQueueIcon = (queueName: string) => {
    switch (queueName) {
      case 'ingestion':
        return <Inbox className="h-5 w-5 text-blue-600" />;
      case 'classification':
        return <Tags className="h-5 w-5 text-purple-600" />;
      case 'split':
        return <Scissors className="h-5 w-5 text-orange-600" />;
      case 'extraction':
        return <ClipboardList className="h-5 w-5 text-green-600" />;
      case 'export':
        return <FileDigit className="h-5 w-5 text-indigo-600" />;
      default:
        return <FileDigit className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (count: number, type: 'input' | 'working' | 'exceptions') => {
    if (count === 0) return 'bg-gray-100 text-gray-500';
    
    switch (type) {
      case 'input':
        return 'bg-blue-100 text-blue-700';
      case 'working':
        return 'bg-yellow-100 text-yellow-700';
      case 'exceptions':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {Object.entries(queueData!).map(([queueName, queue]) => {
        const total = queue.input + queue.working + queue.exceptions;
        let status = 'Idle';
        let statusColor = 'bg-gray-100 text-gray-600';
        
        if (queue.working > 0) {
          status = 'Working';
          statusColor = 'bg-yellow-100 text-yellow-600';
        } else if (queue.input > 0) {
          status = 'Waiting';
          statusColor = 'bg-blue-100 text-blue-600';
        }
        
        return (
          <div key={queueName} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center">
                {getQueueIcon(queueName)}
                <h3 className="ml-2 font-medium text-gray-900">{formatQueueName(queueName)}</h3>
              </div>
            </div>
            
            <div className="p-4">
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Input:</span>
                  <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", getStatusColor(queue.input, 'input'))}>
                    {queue.input}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Working:</span>
                  <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", getStatusColor(queue.working, 'working'))}>
                    {queue.working}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Exceptions:</span>
                  <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", getStatusColor(queue.exceptions, 'exceptions'))}>
                    {queue.exceptions}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  Total: {total}
                </span>
                <span className={cn("text-xs px-2 py-1 rounded-full", statusColor)}>
                  {status}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Queue
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Input
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Working
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Exceptions
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Object.entries(queueData!).map(([queueName, queue]) => {
            const total = queue.input + queue.working + queue.exceptions;
            let status = 'Idle';
            let statusColor = 'text-gray-500';
            
            if (queue.working > 0) {
              status = 'Working';
              statusColor = 'text-yellow-600';
            } else if (queue.input > 0) {
              status = 'Waiting';
              statusColor = 'text-blue-600';
            }
            
            return (
              <tr key={queueName} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {getQueueIcon(queueName)}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {formatQueueName(queueName)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                    getStatusColor(queue.input, 'input')
                  )}>
                    {queue.input}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                    getStatusColor(queue.working, 'working')
                  )}>
                    {queue.working}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                    getStatusColor(queue.exceptions, 'exceptions')
                  )}>
                    {queue.exceptions}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {total}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor} bg-gray-100`}>
                    {status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div id="mainContainer" className="fixed inset-0">
      <div id="topBar" className="fixed top-0 left-0 right-0 bg-[#eef5ff] shadow-sm z-50 h-12">
        <div className="flex items-center justify-between h-full px-4">
          <h1 className="text-lg font-semibold text-gray-900">
            Process Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Processing:</span>
              <div 
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer",
                  processingLoading ? "opacity-50 cursor-not-allowed" : "",
                  isProcessingEnabled ? "bg-primary-600" : "bg-gray-200"
                )}
                onClick={processingLoading ? undefined : toggleProcessing}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    isProcessingEnabled ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Auto Refresh:</span>
              <div 
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer",
                  autoRefresh ? "bg-primary-600" : "bg-gray-200"
                )}
                onClick={toggleAutoRefresh}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    autoRefresh ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </div>
            </div>
            
            {autoRefresh && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Interval:</span>
                <div className="flex rounded-md shadow-sm">
                  {[5, 10, 30].map((seconds) => (
                    <button
                      key={seconds}
                      onClick={() => handleIntervalChange(seconds)}
                      className={cn(
                        "relative inline-flex items-center px-3 py-1 text-sm font-medium",
                        refreshInterval === seconds 
                          ? "bg-primary-600 text-white" 
                          : "bg-white text-gray-700 hover:bg-gray-50",
                        seconds === 5 && "rounded-l-md",
                        seconds === 30 && "rounded-r-md",
                        "border border-gray-300",
                        seconds !== 5 && "border-l-0"
                      )}
                    >
                      {seconds}s
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
              Refresh
            </Button>
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
          {loading && !queueData ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 bg-white" 
                  onClick={handleRefresh}
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : queueData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Total Documents</h3>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900">{calculateTotal(queueData)}</span>
                    <span className="ml-2 text-sm text-gray-500">documents in system</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Busiest Queue</h3>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900">
                      {getBusiestQueue(queueData).name ? formatQueueName(getBusiestQueue(queueData).name) : 'None'}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      {getBusiestQueue(queueData).count} documents
                    </span>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Most Exceptions</h3>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900">
                      {getMostExceptions(queueData).name ? formatQueueName(getMostExceptions(queueData).name) : 'None'}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      {getMostExceptions(queueData).count} exceptions
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow mb-6">
                <div className="p-4 border-b flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Process Queue Status</h2>
                  <div className="flex rounded-md shadow-sm">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        "rounded-l-md rounded-r-none border-r-0",
                        viewMode === 'grid' && "bg-gray-100"
                      )}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={cn(
                        "rounded-r-md rounded-l-none",
                        viewMode === 'list' && "bg-gray-100"
                      )}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="p-6">
                  {viewMode === 'grid' ? renderGridView() : renderListView()}
                </div>
              </div>
              
              {lastUpdated && (
                <div className="mt-4 text-right text-xs text-gray-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}