import JSZip from 'jszip';

interface CodeCheckpoint {
  timestamp: string;
  name: string;
  comment: string;
  files: Record<string, string>;
}

// List of file extensions to include in the backup
const INCLUDE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.html', 
  '.md', '.env', '.gitignore', '.eslintrc', '.prettierrc',
  '.config.js', '.config.ts'
];

// List of directories/files to exclude
const EXCLUDE_PATHS = [
  'node_modules',
  'dist',
  '.git',
  '.bolt',
  'package-lock.json'
];

function shouldIncludeFile(path: string): boolean {
  if (EXCLUDE_PATHS.some(excluded => path.includes(excluded))) {
    return false;
  }
  return INCLUDE_EXTENSIONS.some(ext => path.endsWith(ext)) ||
         path.includes('.config.') ||
         path === '.env' ||
         path === '.gitignore';
}

// Store checkpoints in IndexedDB for more storage space
const DB_NAME = 'code_checkpoints';
const STORE_NAME = 'checkpoints';

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

async function saveCheckpoint(checkpoint: CodeCheckpoint): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.put({
      id: `${checkpoint.timestamp}_${checkpoint.name}`,
      ...checkpoint
    });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getAllCheckpoints(): Promise<CodeCheckpoint[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Function to read files using the File System Access API
async function readFilesFromFileSystem(dirHandle: FileSystemDirectoryHandle, path = ''): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  
  for await (const entry of dirHandle.values()) {
    const entryPath = path ? `${path}/${entry.name}` : entry.name;
    
    if (entry.kind === 'file' && shouldIncludeFile(entryPath)) {
      const file = await entry.getFile();
      const content = await file.text();
      files[entryPath] = content;
    } else if (entry.kind === 'directory' && !EXCLUDE_PATHS.includes(entry.name)) {
      const newDirHandle = await dirHandle.getDirectoryHandle(entry.name);
      const subFiles = await readFilesFromFileSystem(newDirHandle, entryPath);
      Object.assign(files, subFiles);
    }
  }
  
  return files;
}

// Store the directory handle for future access
let cachedDirHandle: FileSystemDirectoryHandle | null = null;

export async function initializeBackup(): Promise<void> {
  try {
    // Request persistent access to the project directory with write permissions
    cachedDirHandle = await window.showDirectoryPicker({
      mode: 'readwrite', // Changed to readwrite
      startIn: 'documents'
    });
    
    // Create initial checkpoint
    await createAutoCheckpoint('Initial backup');
    
    // Set up automatic backups every 5 minutes
    setInterval(() => {
      createAutoCheckpoint('Auto backup');
    }, 5 * 60 * 1000);
  } catch (err) {
    console.error('Failed to initialize backup:', err);
    throw new Error('Failed to access project directory. Please try again.');
  }
}

async function createAutoCheckpoint(comment: string): Promise<void> {
  if (!cachedDirHandle) {
    throw new Error('Backup not initialized');
  }
  
  try {
    const files = await readFilesFromFileSystem(cachedDirHandle);
    const timestamp = new Date().toISOString();
    
    const checkpoint: CodeCheckpoint = {
      timestamp,
      name: `auto-${timestamp}`,
      comment,
      files
    };
    
    await saveCheckpoint(checkpoint);
    
    // Keep only last 10 checkpoints
    const checkpoints = await getAllCheckpoints();
    if (checkpoints.length > 10) {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      for (const oldCheckpoint of checkpoints.slice(0, -10)) {
        store.delete(`${oldCheckpoint.timestamp}_${oldCheckpoint.name}`);
      }
    }
  } catch (err) {
    console.error('Failed to create auto checkpoint:', err);
  }
}

export async function createCheckpoint(name: string, comment: string = ''): Promise<string> {
  if (!cachedDirHandle) {
    throw new Error('Backup not initialized');
  }
  
  try {
    const files = await readFilesFromFileSystem(cachedDirHandle);
    const timestamp = new Date().toISOString();
    
    const checkpoint: CodeCheckpoint = {
      timestamp,
      name,
      comment,
      files
    };
    
    await saveCheckpoint(checkpoint);
    return `${timestamp}_${name}`;
  } catch (err) {
    console.error('Failed to create checkpoint:', err);
    throw new Error('Failed to create checkpoint. Please try again.');
  }
}

export async function getCheckpoints(): Promise<CodeCheckpoint[]> {
  try {
    return await getAllCheckpoints();
  } catch {
    return [];
  }
}

export async function getCheckpoint(id: string): Promise<CodeCheckpoint | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function exportCheckpoint(id: string): Promise<void> {
  const checkpoint = await getCheckpoint(id);
  if (!checkpoint) {
    throw new Error('Checkpoint not found');
  }

  const zip = new JSZip();

  // Add metadata file
  const metadata = {
    name: checkpoint.name,
    timestamp: checkpoint.timestamp,
    comment: checkpoint.comment
  };
  zip.file('checkpoint.json', JSON.stringify(metadata, null, 2));

  // Add all files maintaining directory structure
  for (const [filePath, content] of Object.entries(checkpoint.files)) {
    zip.file(filePath, content);
  }

  // Generate the zip file
  const blob = await zip.generateAsync({ type: 'blob' });

  // Create a download link and trigger the download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${checkpoint.name}-${new Date(checkpoint.timestamp).toISOString().split('T')[0]}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function restoreCheckpoint(id: string): Promise<void> {
  if (!cachedDirHandle) {
    throw new Error('Backup not initialized');
  }

  const checkpoint = await getCheckpoint(id);
  if (!checkpoint) {
    throw new Error('Checkpoint not found');
  }

  try {
    // Create a backup before restoring
    await createCheckpoint('pre-restore-backup', 'Automatic backup before checkpoint restore');

    // Restore each file
    for (const [filePath, content] of Object.entries(checkpoint.files)) {
      await writeFile(cachedDirHandle, filePath, content);
    }
  } catch (err) {
    console.error('Failed to restore checkpoint:', err);
    throw new Error('Failed to restore checkpoint. Please try again.');
  }
}

// Helper function to write a file to the file system
async function writeFile(rootHandle: FileSystemDirectoryHandle, filePath: string, content: string) {
  const parts = filePath.split('/');
  const fileName = parts.pop()!;
  let currentHandle = rootHandle;

  // Create directories if they don't exist
  for (const part of parts) {
    currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
  }

  // Write the file
  const fileHandle = await currentHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}