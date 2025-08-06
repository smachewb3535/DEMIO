export class TranslinkDB {
    constructor(maxRecords = 10) {
        this.dbName = 'TranslinkResponses';
        this.storeName = 'conversations';
        this.maxRecords = maxRecords;
        this.db = null;
    }

    initializeDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    store.createIndex('byQuestion', 'question', {
                        unique: false
                    });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                reject('IndexedDB error: ' + event.target.error);
            };
        });
    }

    async saveResponse(responseData) {
        if (!this.db) await this.initializeDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);

            responseData.timestamp = responseData.timestamp || new Date().toISOString();

            const addRequest = store.add(responseData);

            addRequest.onsuccess = () => {
                this.enforceRecordLimit();
                resolve();
            };

            addRequest.onerror = (event) => reject(event.target.error);
        });
    }

    async enforceRecordLimit() {
        const allRecords = await this.getAllResponses();
        if (allRecords.length <= this.maxRecords) return;

        const sorted = allRecords.sort((a, b) =>
            new Date(a.timestamp) - new Date(b.timestamp));

        const deleteCount = allRecords.length - this.maxRecords;
        const recordsToDelete = sorted.slice(0, deleteCount);

        const transaction = this.db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);

        recordsToDelete.forEach(record => {
            store.delete(record.id);
        });
    }

    async getAllResponses() {
        if (!this.db) await this.initializeDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }
}