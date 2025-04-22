import { z } from 'zod';

export type User = {
  id: string;
  name: string;
  email: string;
  roles: ('classification' | 'extraction')[];
};

export type Confidence = {
  value: number;
  description: string;
  doc_type?: string;
  low_confidence_fields?: number;
  threshold?: number;
};

export type Exception = {
  id: string;
  path: string;
  status: string;
  document_type: string;
  confidence: Confidence;
  step: 'classification' | 'extraction';
  created_at: string;
  page_count?: number;
  extracted_data?: any[]; // We'll use the raw extracted data structure
};

export type DocumentType = {
  id: string;
  name: string;
  description?: string;
};

export const configSchema = z.object({
  document_types: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
  })),
});

export type Config = z.infer<typeof configSchema>;

export type QueueStatus = {
  input: number;
  working: number;
  exceptions: number;
};

export type QueueData = {
  ingestion: QueueStatus;
  classification: QueueStatus;
  split: QueueStatus;
  extraction: QueueStatus;
  export: QueueStatus;
};