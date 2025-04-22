// Allow configuring the API base URL through environment variables
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

export async function getExceptions() {
  try {
    console.log('Fetching exceptions from:', `${API_BASE}/exceptions`);
    const response = await fetch(`${API_BASE}/exceptions`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Exceptions response:', data);
    return data;
  } catch (error) {
    console.error('Failed to fetch exceptions:', error);
    throw error;
  }
}

export async function getDocument(docId: string) {
  try {
    const url = `${API_BASE}/document?doc_id=${encodeURIComponent(docId)}`;
    console.log('Fetching document from:', url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Document response:', data);
    return data;
  } catch (error) {
    console.error('Failed to fetch document:', error);
    throw error;
  }
}

export async function getDocumentPages(docId: string): Promise<number> {
  try {
    const url = `${API_BASE}/document/pages?doc_id=${encodeURIComponent(docId)}`;
    console.log('Fetching document pages from:', url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Document pages response:', data);
    return data.total_pages;
  } catch (error) {
    console.error('Failed to fetch document pages:', error);
    throw error;
  }
}

export async function getConfig() {
  try {
    console.log('Fetching config from:', `${API_BASE}/config`);
    const response = await fetch(`${API_BASE}/config`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Config response:', data);
    return data;
  } catch (error) {
    console.error('Failed to fetch config:', error);
    throw error;
  }
}

export async function getDocumentPage(docId: string, pageNumber: number) {
  try {
    const url = `${API_BASE}/pdf/page?doc_id=${encodeURIComponent(docId)}&page_number=${pageNumber}`;
    console.log('Fetching page from:', url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    console.log('Page response blob size:', blob.size);
    return blob;
  } catch (error) {
    console.error('Failed to fetch page:', error);
    throw error;
  }
}

export async function getQueues() {
  try {
    console.log('Fetching queues from:', `${API_BASE}/queues`);
    const response = await fetch(`${API_BASE}/queues`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Queues response:', data);
    return data;
  } catch (error) {
    console.error('Failed to fetch queues:', error);
    throw error;
  }
}

export async function getProcessingConfig() {
  try {
    const response = await fetch(`${API_BASE}/processing/config`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch processing config:', error);
    throw error;
  }
}

export async function updateProcessingConfig(workers: number) {
  try {
    const response = await fetch(`${API_BASE}/processing/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workers }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to update processing config:', error);
    throw error;
  }
}