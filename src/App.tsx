import { useState, useEffect, ChangeEvent } from 'react';

const DB_NAME = 'ImageDB';
const STORE_NAME = 'images';

interface ImageRecord {
  id?: number;
  file: File;
  timestamp: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result);
      } else {
        reject(new Error('Failed to open database.'));
      }
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

function getAllImages(db: IDBDatabase): Promise<ImageRecord[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as ImageRecord[]);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

function addImage(db: IDBDatabase, file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const imageData: ImageRecord = {
      file,
      timestamp: new Date().toISOString(),
    };

    const request = store.add(imageData);
    request.onsuccess = () => {
      resolve(request.result as number);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

export default function App() {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [db, setDb] = useState<IDBDatabase | null>(null);

  useEffect(() => {
    openDB()
      .then((database) => {
        setDb(database);
        return getAllImages(database);
      })
      .then((storedImages) => {
        setImages(storedImages);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!db) return;
    const file = event.target.files?.[0];
    if (file) {
      await addImage(db, file);
      const newImages = await getAllImages(db);
      setImages(newImages);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Image Uploader</h1>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' }}>
        {images.map((img) => {
          const url = URL.createObjectURL(img.file);
          return (
            <img
              key={img.id}
              src={url}
              alt="Uploaded"
              style={{ maxWidth: '200px', border: '1px solid #ccc', padding: '5px' }}
            />
          );
        })}
      </div>
    </div>
  );
}
