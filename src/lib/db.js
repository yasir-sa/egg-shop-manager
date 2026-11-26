// Local data layer (IndexedDB). Every screen goes through store.jsx, never here directly,
// so this file can later be swapped for Firebase Firestore without touching the pages.

const DB_NAME = 'egg-shop-manager'
const DB_VERSION = 1
export const STORES = [
  'settings', // key/value
  'products', // egg types and their rates
  'customers', 'staff', 'suppliers',
  'orders', 'bills', 'payments', // sales side
  'lots', 'wastes', 'supplierPays', // stock side
  'trays', 'expenses', 'activity',
]

let dbPromise = null
function open() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      STORES.forEach((name) => {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: name === 'settings' ? 'key' : 'id' })
      })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx(store, mode, fn) {
  return open().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(store, mode)
    const r = fn(t.objectStore(store))
    t.oncomplete = () => resolve(r?.result ?? r)
    t.onerror = () => reject(t.error)
  }))
}

export const db = {
  all: (s) => tx(s, 'readonly', (o) => o.getAll()),
  put: (s, v) => tx(s, 'readwrite', (o) => o.put(v)),
  remove: (s, k) => tx(s, 'readwrite', (o) => o.delete(k)),
  clear: (s) => tx(s, 'readwrite', (o) => o.clear()),
  putMany: (s, list) => tx(s, 'readwrite', (o) => list.forEach((v) => o.put(v))),
}

export const newId = () => crypto.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`
