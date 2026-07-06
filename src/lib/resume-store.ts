/**
 * Résumé files uploaded through the apply form are too large for localStorage
 * (which caps around ~5MB total and stores strings only). We keep the actual
 * file bytes in IndexedDB, keyed by the application id, so the admin can view
 * or download them later. The Application record in localStorage only keeps the
 * file name; this store holds the blob.
 */

const DB_NAME = "gmg-crm"
const STORE = "resumes"
const VERSION = 1

export type StoredResume = { name: string; type: string; blob: Blob }

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** Persist a résumé file under an application id. */
export async function saveResume(id: string, file: File): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite")
      tx.objectStore(STORE).put({ name: file.name, type: file.type, blob: file }, id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

/** Fetch a stored résumé, or undefined if none was saved for this application. */
export async function getResume(id: string): Promise<StoredResume | undefined> {
  const db = await openDb()
  try {
    return await new Promise<StoredResume | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly")
      const req = tx.objectStore(STORE).get(id)
      req.onsuccess = () => resolve(req.result as StoredResume | undefined)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

/** Remove a stored résumé (called when its application is deleted). */
export async function deleteResume(id: string): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite")
      tx.objectStore(STORE).delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}
