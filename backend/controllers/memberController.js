const FirebaseService = require('../services/firebaseService');
const ResponseHelper = require('../utils/responseHelper');

/**
 * Member Controller
 */
class MemberController {
    
    // GET /api/members - Get all members
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

    // GET /api/members/:id - Get member by ID
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

    // POST /api/members - Create new member
    static async createMember(req, res) {
        try {
            const { nama, nim, idRfid, hariPiket } = req.body;

            // Check if NIM already exists
            const nimExists = await FirebaseService.checkDocumentExists('members', 'nim', nim);
            if (nimExists) {
                return ResponseHelper.error(res, 'NIM already exists', 400);
            }

            // Check if RFID already exists
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

    // PUT /api/members/:id - Update member
    static async updateMember(req, res) {
        try {
            const { id } = req.params;
            const { nama, nim, idRfid, hariPiket } = req.body;

            // Check if member exists
            const existingMember = await FirebaseService.getDocumentById('members', id);
            if (!existingMember) {
                return ResponseHelper.notFound(res, 'Member not found');
            }

            // Check if NIM already exists (excluding current member)
            const nimExists = await FirebaseService.checkDocumentExists('members', 'nim', nim, id);
            if (nimExists) {
                return ResponseHelper.error(res, 'NIM already exists', 400);
            }

            // Check if RFID already exists (excluding current member)
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

    // DELETE /api/members/:id - Delete member
    static async deleteMember(req, res) {
        try {
            const { id } = req.params;

            const deletedMember = await FirebaseService.deleteDocument('members', id);
            
            return ResponseHelper.success(res, deletedMember, 'Member deleted successfully');
            
        } catch (error) {
            console.error('Error in deleteMember:', error);
            if (error.message.includes('not found')) {
                return ResponseHelper.notFound(res, 'Member not found');
            }
            return ResponseHelper.error(res, 'Failed to delete member');
        }
    }

    // PATCH /api/members/:id/status - Update member status
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
}

module.exports = MemberController;
