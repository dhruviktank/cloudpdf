// IndexedDB utility helpers for caching PDF binary data
// Provides openDB, getPdf, setPdf, deletePdf. All return Promises.

const DB_NAME = 'pdf_cache_db'
const STORE_NAME = 'pdfs'
const DB_VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function getPdf(key) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(key)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export function setPdf(key, data) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.put(data, key)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}

export function deletePdf(key) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.delete(key)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    } catch (err) {
      reject(err)
    }
  })
}
