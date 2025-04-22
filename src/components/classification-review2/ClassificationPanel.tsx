import { Check, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Config } from '../../lib/types';
import { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface ClassificationPanelProps {
  config: Config;
  currentDocType: string;
  confidenceValue: number;
  routingReason?: string;
  selectedDocType: string;
  setSelectedDocType: (docType: string) => void;
  onConfirmClassification: () => void;
  submitting: boolean;
}

export function ClassificationPanel({
  config,
  currentDocType,
  confidenceValue,
  routingReason,
  selectedDocType,
  setSelectedDocType,
  onConfirmClassification,
  submitting
}: ClassificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedType = config.document_types.find(t => t.id === selectedDocType);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-medium text-gray-900">
          Document Details
        </h2>
      </div>
      
      <div className="p-6 space-y-6 overflow-auto flex-1">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Current Classification
          </label>
          <p className="mt-1 text-sm text-gray-900">
            {currentDocType}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Confidence
          </label>
          <div className="mt-1 flex items-center space-x-2">
            <div
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                confidenceValue < 0.9
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {(confidenceValue * 100).toFixed(2)}%
            </div>
            <span className="text-sm text-gray-500">
              {confidenceValue < 0.9 ? 'Low' : 'High'}
            </span>
          </div>
          {routingReason && (
            <p className="mt-1 text-sm text-gray-500">
              {routingReason}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="docType" className="block text-sm font-medium text-gray-700 mb-2">
            Classify Document
          </label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              className={cn(
                "relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default",
                "focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
                isOpen && "ring-1 ring-blue-500 border-blue-500"
              )}
              onClick={() => setIsOpen(!isOpen)}
              disabled={submitting}
            >
              <span className="block truncate">
                {selectedType ? selectedType.name : "Select document type..."}
              </span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDown className={cn(
                  "h-4 w-4 text-gray-400",
                  isOpen && "transform rotate-180"
                )} />
              </span>
            </button>

            {isOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                {config.document_types.map((type) => (
                  <div
                    key={type.id}
                    className={cn(
                      "cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50",
                      selectedDocType === type.id && "bg-blue-50"
                    )}
                    onClick={() => {
                      setSelectedDocType(type.id);
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex flex-col">
                      <span className={cn(
                        "block truncate font-medium",
                        selectedDocType === type.id && "text-blue-600"
                      )}>
                        {type.name}
                      </span>
                      {type.description && (
                        <span className="block truncate text-xs text-gray-500 mt-0.5">
                          {type.description}
                        </span>
                      )}
                    </div>

                    {selectedDocType === type.id && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-4">
          <Button
            className="w-full"
            onClick={onConfirmClassification}
            disabled={!selectedDocType || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirm Classification
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}