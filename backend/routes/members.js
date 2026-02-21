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


router.get('/', 
  verifyToken,
  requirePermission('read:members'),
  MemberController.getAllMembers
);


router.get('/:id', 
  verifyToken,
  requirePermission('read:members'),
  MemberController.getMemberById
);


router.post('/', 
  sanitizeInput,
  verifyToken,
  requirePermission('create:members'),
  validateMemberData,
  ValidationMiddleware.validateMember, 
  MemberController.createMember
);


router.put('/:id', 
  sanitizeInput,
  verifyToken,
  requirePermission('update:members'),
  validateMemberData,
  ValidationMiddleware.validateMember, 
  MemberController.updateMember
);


router.delete('/:id', 
  verifyToken,
  requirePermission('delete:members'),
  MemberController.deleteMember
);


router.put('/:id/rfid',
  sanitizeInput,
  verifyToken,
  requirePermission('update:members'),
  MemberController.assignRfidCard
);


router.delete('/:id/rfid',
  verifyToken,
  requirePermission('update:members'),
  MemberController.removeRfidCard
);

module.exports = router;


router.get('/', MemberController.getAllMembers);


router.get('/:id', MemberController.getMemberById);


router.post('/', ValidationMiddleware.validateMember, MemberController.createMember);


router.put('/:id', ValidationMiddleware.validateMember, MemberController.updateMember);


router.delete('/:id', MemberController.deleteMember);


router.patch('/:id/status', MemberController.updateMemberStatus);

module.exports = router;


router.get('/', async (req, res) => {
  try {
    console.log('Fetching all members...');
    
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
    console.error('Error fetching members:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch members',
      message: error.message
    });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching member with ID: ${id}`);

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
    console.error('Error fetching member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch member',
      message: error.message
    });
  }
});


router.post('/', async (req, res) => {
  try {
    const { nama, nim, idRfid, hariPiket } = req.body;
    console.log('Adding new member:', { nama, nim, idRfid });

    
    if (!nama || !nim || !idRfid || !hariPiket || hariPiket.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['nama', 'nim', 'idRfid', 'hariPiket']
      });
    }

    
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
    
    console.log('Member added successfully:', docRef.id);

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...newMember
      },
      message: 'Member added successfully'
    });

  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add member',
      message: error.message
    });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, nim, idRfid, hariPiket } = req.body;
    console.log(`Updating member ${id}:`, { nama, nim, idRfid });

    
    const memberDoc = await adminDb.collection('members').doc(id).get();
    if (!memberDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    
    if (!nama || !nim || !idRfid || !hariPiket || hariPiket.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['nama', 'nim', 'idRfid', 'hariPiket']
      });
    }

    
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

    
    const updatedData = {
      nama: nama.trim(),
      nim: nim.trim(),
      idRfid: idRfid.trim(),
      hariPiket: Array.isArray(hariPiket) ? hariPiket : [hariPiket],
      updatedAt: new Date().toISOString()
    };

    await adminDb.collection('members').doc(id).update(updatedData);
    
    console.log('Member updated successfully:', id);
    
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
    console.error('Error updating member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update member',
      message: error.message
    });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Deleting member: ${id}`);

    const memberDoc = await adminDb.collection('members').doc(id).get();
    if (!memberDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    
    await adminDb.collection('members').doc(id).update({
      status: 'inactive',
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log('Member deleted successfully:', id);
    
    res.json({
      success: true,
      message: 'Member deleted successfully',
      data: { id }
    });

  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete member',
      message: error.message
    });
  }
});

module.exports = router;
