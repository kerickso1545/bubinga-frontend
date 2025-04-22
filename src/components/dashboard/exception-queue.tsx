import { FileText, AlertCircle, Clock, Tag, ClipboardCheck, Info } from 'lucide-react';
import { Exception } from '../../lib/types';
import { formatDate, encodeDocId } from '../../lib/utils';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';

interface ExceptionQueueProps {
  title: string;
  exceptions: Exception[];
  onSelect: (exception: Exception) => void;
}

export function ExceptionQueue({ exceptions, onSelect }: ExceptionQueueProps) {
  const navigate = useNavigate();
  
  const getDocId = (path: string) => {
    const match = path.match(/processes[/\\].+/);
    if (match) {
      const relativePath = match[0].replace(/\\/g, '/');
      return encodeDocId(relativePath);
    }
    return null;
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
              Type
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Document ID
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Document Type
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Confidence
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {exceptions.map((exception) => {
            const docId = getDocId(exception.path);
            const isClassification = exception.step === 'classification';
            const confidenceValue = exception.confidence.value;
            
            return (
              <tr
                key={docId} // Using the encoded doc_id as the unique key
                className="hover:bg-gray-50"
              >
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {exception.id}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center">
                    <Tag className="h-4 w-4 text-gray-400 mr-1.5" />
                    <span className="text-sm text-gray-900">
                      {exception.document_type || 'Unknown'}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center">
                    <div 
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        confidenceValue >= 0.9 
                          ? 'bg-green-100 text-green-800'
                          : confidenceValue >= 0.8
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {Math.round(confidenceValue * 100)}%
                    </div>
                    {confidenceValue < 0.9 && (
                      <AlertCircle className="h-4 w-4 ml-1.5 text-yellow-500" />
                    )}
                  </div>
                  {exception.confidence.description && (
                    <div className="text-xs text-gray-500 mt-0.5 max-w-md">
                      {exception.confidence.description}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1.5" />
                    {formatDate(exception.created_at)}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-right">
                  {docId && (
                    <div className="inline-flex items-center rounded-md shadow-sm">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 px-2.5 rounded-r-none border-r-0"
                        onClick={() => onSelect(exception)}
                        title="View document details"
                      >
                        <Info className="h-5 w-5" />
                        <span className="sr-only">View document details</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 px-2.5 rounded-l-none"
                        onClick={() => navigate(`/${exception.step}2?doc_id=${docId}`)}
                        title={`Review ${isClassification ? 'classification' : 'extraction'}`}
                      >
                        <ClipboardCheck className="h-5 w-5" />
                        <span className="sr-only">Review document</span>
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}