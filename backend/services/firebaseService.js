const { adminDb, adminRtdb } = require('../config/firebase');

/**
 * Firebase Service Layer
 */
class FirebaseService {
    
    // Firestore operations
    static async addDocument(collection, data) {
        try {
            const docRef = await adminDb.collection(collection).add({
                ...data,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            return { id: docRef.id, ...data };
        } catch (error) {
            throw new Error(`Failed to add document: ${error.message}`);
        }
    }

    static async getDocuments(collection, conditions = []) {
        try {
            let query = adminDb.collection(collection);
            
            // Apply conditions
            conditions.forEach(condition => {
                query = query.where(condition.field, condition.operator, condition.value);
            });

            const snapshot = await query.get();
            const documents = [];
            
            snapshot.forEach(doc => {
                documents.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return documents;
        } catch (error) {
            throw new Error(`Failed to get documents: ${error.message}`);
        }
    }

    static async getDocumentById(collection, id) {
        try {
            const doc = await adminDb.collection(collection).doc(id).get();
            
            if (!doc.exists) {
                return null;
            }

            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            throw new Error(`Failed to get document: ${error.message}`);
        }
    }

    static async updateDocument(collection, id, data) {
        try {
            await adminDb.collection(collection).doc(id).update({
                ...data,
                updatedAt: new Date().toISOString()
            });
            
            return await this.getDocumentById(collection, id);
        } catch (error) {
            throw new Error(`Failed to update document: ${error.message}`);
        }
    }

    static async deleteDocument(collection, id) {
        try {
            const doc = await this.getDocumentById(collection, id);
            if (!doc) {
                throw new Error('Document not found');
            }

            await adminDb.collection(collection).doc(id).delete();
            return doc;
        } catch (error) {
            throw new Error(`Failed to delete document: ${error.message}`);
        }
    }

    // Realtime Database operations
    static async setRealtimeData(path, data) {
        try {
            await adminRtdb.ref(path).set({
                ...data,
                timestamp: new Date().toISOString()
            });
            return true;
        } catch (error) {
            throw new Error(`Failed to set realtime data: ${error.message}`);
        }
    }

    static async updateRealtimeData(path, data) {
        try {
            await adminRtdb.ref(path).update({
                ...data,
                timestamp: new Date().toISOString()
            });
            return true;
        } catch (error) {
            throw new Error(`Failed to update realtime data: ${error.message}`);
        }
    }

    static async getRealtimeData(path) {
        try {
            const snapshot = await adminRtdb.ref(path).once('value');
            return snapshot.val();
        } catch (error) {
            throw new Error(`Failed to get realtime data: ${error.message}`);
        }
    }

    // Helper methods
    static async checkDocumentExists(collection, field, value, excludeId = null) {
        try {
            const conditions = [{ field, operator: '==', value }];
            const documents = await this.getDocuments(collection, conditions);
            
            if (excludeId) {
                return documents.some(doc => doc.id !== excludeId);
            }
            
            return documents.length > 0;
        } catch (error) {
            throw new Error(`Failed to check document existence: ${error.message}`);
        }
    }
}

module.exports = FirebaseService;
