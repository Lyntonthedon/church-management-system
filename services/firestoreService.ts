
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Simple event emitter for local updates
const listeners: { [path: string]: Function[] } = {};

const notifyListeners = (path: string) => {
  if (listeners[path]) {
    const data = getLocalCollection(path);
    listeners[path].forEach(callback => callback(data));
  }
};

const getLocalCollection = (path: string) => {
  const data = localStorage.getItem(`church_data_${path}`);
  return data ? JSON.parse(data) : [];
};

const saveLocalCollection = (path: string, data: any[]) => {
  localStorage.setItem(`church_data_${path}`, JSON.stringify(data));
  notifyListeners(path);
};

export const getCollection = async <T = any>(path: string, constraints: any[] = []): Promise<(T & { id: string })[]> => {
  return getLocalCollection(path);
};

export const subscribeToCollection = <T = any>(
  path: string, 
  callback: (data: (T & { id: string })[]) => void, 
  constraints: any[] = [],
  onError?: (error: any) => void
) => {
  if (!listeners[path]) listeners[path] = [];
  listeners[path].push(callback);
  
  // Initial call
  callback(getLocalCollection(path));
  
  return () => {
    listeners[path] = listeners[path].filter(l => l !== callback);
  };
};

export const addDocument = async <T = any>(path: string, data: T) => {
  const collection = getLocalCollection(path);
  const newDoc = {
    ...(data as any),
    id: Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  collection.push(newDoc);
  saveLocalCollection(path, collection);
  return newDoc;
};

export const updateDocument = async <T = any>(path: string, id: string, data: Partial<T>) => {
  const collection = getLocalCollection(path);
  const index = collection.findIndex((d: any) => d.id === id);
  if (index !== -1) {
    collection[index] = {
      ...collection[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveLocalCollection(path, collection);
  }
};

export const deleteDocument = async (path: string, id: string) => {
  const collection = getLocalCollection(path);
  const filtered = collection.filter((d: any) => d.id !== id);
  saveLocalCollection(path, filtered);
};

export const getDocument = async <T = any>(path: string, id: string): Promise<(T & { id: string }) | null> => {
  const collection = getLocalCollection(path);
  const doc = collection.find((d: any) => d.id === id);
  return doc || null;
};

export const handleFirestoreError = (error: any, operation: OperationType, path: string) => {
  console.error(`Local Storage Error [${operation}] on ${path}:`, error);
};
