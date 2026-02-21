const FirebaseService = require('../services/firebaseService');
const ResponseHelper = require('../utils/responseHelper');


class MemberController {
    
    
    static async getAllMembers(req, res) {
        try {
            const { status = 'active' } = req.query;
            
            const conditions = [];
            if (status !== 'all') {
                conditions.push({ field: 'status', operator: '==', value: status });
            }

            const members = await FirebaseService.getDocuments('members', conditions);
            
            return ResponseHelper.success(res, {
                members,
                count: members.length
            }, 'Members retrieved successfully');
            
        } catch (error) {
            console.error('Error in getAllMembers:', error);
            return ResponseHelper.error(res, 'Failed to retrieve members');
        }
    }

    
    static async getMemberById(req, res) {
        try {
            const { id } = req.params;
            
            const member = await FirebaseService.getDocumentById('members', id);
            
            if (!member) {
                return ResponseHelper.notFound(res, 'Member not found');
            }

            return ResponseHelper.success(res, member, 'Member retrieved successfully');
            
        } catch (error) {
            console.error('Error in getMemberById:', error);
            return ResponseHelper.error(res, 'Failed to retrieve member');
        }
    }

    
    static async createMember(req, res) {
        try {
            const { nama, nim, idRfid, hariPiket } = req.body;

            
            const nimExists = await FirebaseService.checkDocumentExists('members', 'nim', nim);
            if (nimExists) {
                return ResponseHelper.error(res, 'NIM already exists', 400);
            }

            
            const rfidExists = await FirebaseService.checkDocumentExists('members', 'idRfid', idRfid);
            if (rfidExists) {
                return ResponseHelper.error(res, 'RFID ID already exists', 400);
            }

            const memberData = {
                nama,
                nim,
                idRfid,
                hariPiket,
                status: 'active'
            };

            const newMember = await FirebaseService.addDocument('members', memberData);
            
            return ResponseHelper.success(res, newMember, 'Member created successfully', 201);
            
        } catch (error) {
            console.error('Error in createMember:', error);
            return ResponseHelper.error(res, 'Failed to create member');
        }
    }

    
    static async updateMember(req, res) {
        try {
            const { id } = req.params;
            const { nama, nim, idRfid, hariPiket } = req.body;

            
            const existingMember = await FirebaseService.getDocumentById('members', id);
            if (!existingMember) {
                return ResponseHelper.notFound(res, 'Member not found');
            }

            
            const nimExists = await FirebaseService.checkDocumentExists('members', 'nim', nim, id);
            if (nimExists) {
                return ResponseHelper.error(res, 'NIM already exists', 400);
            }

            
            const rfidExists = await FirebaseService.checkDocumentExists('members', 'idRfid', idRfid, id);
            if (rfidExists) {
                return ResponseHelper.error(res, 'RFID ID already exists', 400);
            }

            const updateData = {
                nama,
                nim,
                idRfid,
                hariPiket
            };

            const updatedMember = await FirebaseService.updateDocument('members', id, updateData);
            
            return ResponseHelper.success(res, updatedMember, 'Member updated successfully');
            
        } catch (error) {
            console.error('Error in updateMember:', error);
            return ResponseHelper.error(res, 'Failed to update member');
        }
    }

    
    static async deleteMember(req, res) {
        try {
            const { id } = req.params;

            
            const member = await FirebaseService.getDocumentById('members', id);
            if (!member) {
                return ResponseHelper.notFound(res, 'Member not found');
            }

            console.log(` Deleting member: ${member.nama} (${id})`);

            
            const attendanceRecords = await FirebaseService.getDocuments('attendance', [
                { field: 'anggotaId', operator: '==', value: id }
            ]);

            console.log(`Found ${attendanceRecords.length} attendance records to delete`);

            
            for (const record of attendanceRecords) {
                await FirebaseService.deleteDocument('attendance', record.id);
                console.log(`Deleted attendance record: ${record.id}`);
            }

            
            await FirebaseService.deleteDocument('members', id);
            console.log(`Deleted member: ${member.nama}`);

            
            try {
                await FirebaseService.sendRealtimeUpdate('member_deleted', {
                    id: id,
                    nama: member.nama,
                    nim: member.nim,
                    deletedAt: new Date().toISOString()
                });
                console.log('Realtime update sent for member deletion');
            } catch (realtimeError) {
                console.warn('Failed to send realtime update:', realtimeError.message);
            }

            return ResponseHelper.success(res, {
                id: id,
                nama: member.nama,
                deletedAttendanceRecords: attendanceRecords.length,
                status: 'permanently_deleted'
            }, `Member ${member.nama} dan ${attendanceRecords.length} record absensi berhasil dihapus`);
            
        } catch (error) {
            console.error('Error in deleteMember:', error);
            if (error.message.includes('not found')) {
                return ResponseHelper.notFound(res, 'Member not found');
            }
            return ResponseHelper.error(res, 'Failed to delete member: ' + error.message);
        }
    }

    
    static async updateMemberStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!['active', 'inactive'].includes(status)) {
                return ResponseHelper.error(res, 'Invalid status. Must be "active" or "inactive"', 400);
            }

            const updatedMember = await FirebaseService.updateDocument('members', id, { status });
            
            return ResponseHelper.success(res, updatedMember, 'Member status updated successfully');
            
        } catch (error) {
            console.error('Error in updateMemberStatus:', error);
            if (error.message.includes('not found')) {
                return ResponseHelper.notFound(res, 'Member not found');
            }
            return ResponseHelper.error(res, 'Failed to update member status');
        }
    }

    
    static async assignRfidCard(req, res) {
        try {
            const { id } = req.params;
            const { rfidCard } = req.body;

            if (!rfidCard || typeof rfidCard !== 'string') {
                return ResponseHelper.error(res, 400, 'Valid RFID card ID is required');
            }

            
            const existingMember = await FirebaseService.queryDocuments('members', [
                { field: 'rfidCard', operator: '==', value: rfidCard },
                { field: 'isDeleted', operator: '==', value: false }
            ]);

            if (existingMember.length > 0 && existingMember[0].id !== id) {
                return ResponseHelper.error(res, 400, 'RFID card already assigned to another member');
            }

            
            const updateData = {
                rfidCard: rfidCard.trim().toUpperCase(),
                updatedAt: new Date().toISOString(),
                updatedBy: req.user?.uid || 'system'
            };

            await FirebaseService.updateDocument('members', id, updateData);

            
            if (global.realtimeService) {
                global.realtimeService.broadcastUpdate('member_updated', {
                    id,
                    rfidCard: updateData.rfidCard
                });
            }

            return ResponseHelper.success(res, 200, 'RFID card assigned successfully');

        } catch (error) {
            console.error('Error in assignRfidCard:', error);
            if (error.message.includes('not found')) {
                return ResponseHelper.notFound(res, 'Member not found');
            }
            return ResponseHelper.error(res, 500, 'Failed to assign RFID card');
        }
    }

    
    static async removeRfidCard(req, res) {
        try {
            const { id } = req.params;

            
            const updateData = {
                rfidCard: null,
                updatedAt: new Date().toISOString(),
                updatedBy: req.user?.uid || 'system'
            };

            await FirebaseService.updateDocument('members', id, updateData);

            
            if (global.realtimeService) {
                global.realtimeService.broadcastUpdate('member_updated', {
                    id,
                    rfidCard: null
                });
            }

            return ResponseHelper.success(res, 200, 'RFID card removed successfully');

        } catch (error) {
            console.error('Error in removeRfidCard:', error);
            if (error.message.includes('not found')) {
                return ResponseHelper.notFound(res, 'Member not found');
            }
            return ResponseHelper.error(res, 500, 'Failed to remove RFID card');
        }
    }
}

module.exports = MemberController;
