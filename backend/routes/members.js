const express = require('express');
const router = express.Router();
const MemberController = require('../controllers/memberController');
const ValidationMiddleware = require('../middleware/validation');
const { 
  verifyToken, 
  requirePermission, 
  validateMemberData, 
  sanitizeInput 
} = require('../middleware');

// GET /api/members - Get all members (requires read permission)
router.get('/', 
  verifyToken,
  requirePermission('read:members'),
  MemberController.getAllMembers
);

// GET /api/members/:id - Get member by ID (requires read permission)
router.get('/:id', 
  verifyToken,
  requirePermission('read:members'),
  MemberController.getMemberById
);

// POST /api/members - Create new member (requires create permission)
router.post('/', 
  sanitizeInput,
  verifyToken,
  requirePermission('create:members'),
  validateMemberData,
  ValidationMiddleware.validateMember, 
  MemberController.createMember
);

// PUT /api/members/:id - Update member (requires update permission)
router.put('/:id', 
  sanitizeInput,
  verifyToken,
  requirePermission('update:members'),
  validateMemberData,
  ValidationMiddleware.validateMember, 
  MemberController.updateMember
);

// DELETE /api/members/:id - Delete member (requires delete permission)
router.delete('/:id', 
  verifyToken,
  requirePermission('delete:members'),
  MemberController.deleteMember
);

module.exports = router;

/**
 * @swagger
 * /api/members:
 *   get:
 *     summary: Get all members
 *     description: Retrieve a list of all registered members
 *     tags: [Members]
 *     responses:
 *       200:
 *         description: List of members retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Member'
 *                 count:
 *                   type: integer
 *                   example: 10
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', MemberController.getAllMembers);

/**
 * @swagger
 * /api/members/{id}:
 *   get:
 *     summary: Get member by ID
 *     description: Retrieve a specific member by their ID
 *     tags: [Members]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Member ID
 *         example: member_123
 *     responses:
 *       200:
 *         description: Member retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Member'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id', MemberController.getMemberById);

/**
 * @swagger
 * /api/members:
 *   post:
 *     summary: Create new member
 *     description: Register a new member in the system
 *     tags: [Members]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nama
 *               - nim
 *               - idRfid
 *               - hariPiket
 *             properties:
 *               nama:
 *                 type: string
 *                 example: Ahmad Rizki
 *               nim:
 *                 type: string
 *                 example: "210511001"
 *               idRfid:
 *                 type: string
 *                 example: RFID001
 *               hariPiket:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu]
 *                 example: [Senin, Rabu]
 *     responses:
 *       201:
 *         description: Member created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Member'
 *                 message:
 *                   type: string
 *                   example: Member created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/', ValidationMiddleware.validateMember, MemberController.createMember);

/**
 * @swagger
 * /api/members/{id}:
 *   put:
 *     summary: Update member
 *     description: Update an existing member's information
 *     tags: [Members]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Member ID
 *         example: member_123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nama
 *               - nim
 *               - idRfid
 *               - hariPiket
 *             properties:
 *               nama:
 *                 type: string
 *                 example: Ahmad Rizki Updated
 *               nim:
 *                 type: string
 *                 example: "210511001"
 *               idRfid:
 *                 type: string
 *                 example: RFID001
 *               hariPiket:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu]
 *                 example: [Senin, Rabu, Jumat]
 *     responses:
 *       200:
 *         description: Member updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Member'
 *                 message:
 *                   type: string
 *                   example: Member updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put('/:id', ValidationMiddleware.validateMember, MemberController.updateMember);

/**
 * @swagger
 * /api/members/{id}:
 *   delete:
 *     summary: Delete member
 *     description: Remove a member from the system
 *     tags: [Members]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Member ID
 *         example: member_123
 *     responses:
 *       200:
 *         description: Member deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Member deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete('/:id', MemberController.deleteMember);

// PATCH /api/members/:id/status - Update member status
router.patch('/:id/status', MemberController.updateMemberStatus);

module.exports = router;

// GET /api/members - Get all members
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching all members...');
    
    const membersSnapshot = await adminDb.collection('members')
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .get();
    
    const members = [];
    membersSnapshot.forEach(doc => {
      members.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: members,
      count: members.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching members:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch members',
      message: error.message
    });
  }
});

// GET /api/members/:id - Get member by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`👤 Fetching member with ID: ${id}`);

    const memberDoc = await adminDb.collection('members').doc(id).get();
    
    if (!memberDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: memberDoc.id,
        ...memberDoc.data()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch member',
      message: error.message
    });
  }
});

// POST /api/members - Add new member
router.post('/', async (req, res) => {
  try {
    const { nama, nim, idRfid, hariPiket } = req.body;
    console.log('➕ Adding new member:', { nama, nim, idRfid });

    // Validation
    if (!nama || !nim || !idRfid || !hariPiket || hariPiket.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['nama', 'nim', 'idRfid', 'hariPiket']
      });
    }

    // Check if NIM already exists
    const existingNim = await adminDb.collection('members')
      .where('nim', '==', nim)
      .get();

    if (!existingNim.empty) {
      return res.status(400).json({
        success: false,
        error: 'NIM already exists',
        field: 'nim'
      });
    }

    // Check if RFID already exists
    const existingRfid = await adminDb.collection('members')
      .where('idRfid', '==', idRfid)
      .get();

    if (!existingRfid.empty) {
      return res.status(400).json({
        success: false,
        error: 'RFID ID already exists',
        field: 'idRfid'
      });
    }

    // Create new member
    const newMember = {
      nama: nama.trim(),
      nim: nim.trim(),
      idRfid: idRfid.trim(),
      hariPiket: Array.isArray(hariPiket) ? hariPiket : [hariPiket],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await adminDb.collection('members').add(newMember);
    
    console.log('✅ Member added successfully:', docRef.id);

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...newMember
      },
      message: 'Member added successfully'
    });

  } catch (error) {
    console.error('❌ Error adding member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add member',
      message: error.message
    });
  }
});

// PUT /api/members/:id - Update member
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, nim, idRfid, hariPiket } = req.body;
    console.log(`📝 Updating member ${id}:`, { nama, nim, idRfid });

    // Check if member exists
    const memberDoc = await adminDb.collection('members').doc(id).get();
    if (!memberDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    // Validation
    if (!nama || !nim || !idRfid || !hariPiket || hariPiket.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['nama', 'nim', 'idRfid', 'hariPiket']
      });
    }

    // Check if NIM exists (excluding current member)
    const existingNim = await adminDb.collection('members')
      .where('nim', '==', nim)
      .get();

    const nimConflict = existingNim.docs.find(doc => doc.id !== id);
    if (nimConflict) {
      return res.status(400).json({
        success: false,
        error: 'NIM already exists',
        field: 'nim'
      });
    }

    // Check if RFID exists (excluding current member)
    const existingRfid = await adminDb.collection('members')
      .where('idRfid', '==', idRfid)
      .get();

    const rfidConflict = existingRfid.docs.find(doc => doc.id !== id);
    if (rfidConflict) {
      return res.status(400).json({
        success: false,
        error: 'RFID ID already exists',
        field: 'idRfid'
      });
    }

    // Update member
    const updatedData = {
      nama: nama.trim(),
      nim: nim.trim(),
      idRfid: idRfid.trim(),
      hariPiket: Array.isArray(hariPiket) ? hariPiket : [hariPiket],
      updatedAt: new Date().toISOString()
    };

    await adminDb.collection('members').doc(id).update(updatedData);
    
    console.log('✅ Member updated successfully:', id);
    
    res.json({
      success: true,
      data: {
        id,
        ...memberDoc.data(),
        ...updatedData
      },
      message: 'Member updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update member',
      message: error.message
    });
  }
});

// DELETE /api/members/:id - Delete member
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting member: ${id}`);

    const memberDoc = await adminDb.collection('members').doc(id).get();
    if (!memberDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    // Soft delete - change status to inactive
    await adminDb.collection('members').doc(id).update({
      status: 'inactive',
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Member deleted successfully:', id);
    
    res.json({
      success: true,
      message: 'Member deleted successfully',
      data: { id }
    });

  } catch (error) {
    console.error('❌ Error deleting member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete member',
      message: error.message
    });
  }
});

module.exports = router;
