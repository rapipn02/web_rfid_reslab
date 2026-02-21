const { adminDb: db, adminRtdb } = require('../config/firebase');


class RealtimeService {
  
  
  static setupRealtimeListeners() {
    console.log('Setting up real-time listeners...');
    
    
    this.setupMembersListener();
    
    
    this.setupAttendanceListener();
  }

  
  static setupMembersListener() {
    const membersRef = db.collection('members');
    
    membersRef.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const memberData = { id: change.doc.id, ...change.doc.data() };
        
        if (change.type === 'added') {
          console.log('New member added:', memberData.nama);
          this.broadcastUpdate('member_added', memberData);
        }
        
        if (change.type === 'modified') {
          console.log('Member modified:', memberData.nama);
          this.broadcastUpdate('member_updated', memberData);
          
          
          if (memberData.status === 'deleted') {
            this.handleMemberDeletion(memberData);
          }
        }
        
        if (change.type === 'removed') {
          console.log('Member removed:', memberData.nama);
          this.broadcastUpdate('member_deleted', memberData);
        }
      });
    }, (error) => {
      console.error('Error in members listener:', error);
    });
  }

  
  static setupAttendanceListener() {
    const attendanceRef = db.collection('attendance');
    
    attendanceRef.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const attendanceData = { id: change.doc.id, ...change.doc.data() };
        
        if (change.type === 'added') {
          console.log('New attendance record:', attendanceData.nama);
          this.broadcastUpdate('attendance_added', attendanceData);
        }
        
        if (change.type === 'modified') {
          console.log('Attendance record modified:', attendanceData.nama);
          this.broadcastUpdate('attendance_updated', attendanceData);
        }
        
        if (change.type === 'removed') {
          console.log('Attendance record removed:', attendanceData.nama);
          this.broadcastUpdate('attendance_deleted', attendanceData);
        }
      });
    }, (error) => {
      console.error('Error in attendance listener:', error);
    });
  }

  
  static async handleMemberDeletion(memberData) {
    try {
      console.log(`Processing member deletion for: ${memberData.nama}`);
      
      
      const attendanceSnapshot = await db.collection('attendance')
        .where('member_id', '==', memberData.id)
        .get();

      if (!attendanceSnapshot.empty) {
        const batch = db.batch();
        
        attendanceSnapshot.docs.forEach((doc) => {
          batch.update(doc.ref, {
            nama: `${memberData.nama} (Dihapus)`,
            member_deleted: true,
            updated_at: new Date().toISOString()
          });
        });

        await batch.commit();
        console.log(`Updated ${attendanceSnapshot.size} attendance records for deleted member`);
        
        
        this.broadcastUpdate('bulk_attendance_updated', {
          member_id: memberData.id,
          member_name: memberData.nama,
          affected_records: attendanceSnapshot.size
        });
      }

    } catch (error) {
      console.error('Error handling member deletion:', error);
    }
  }

  
  static broadcastUpdate(eventType, data) {
    
    if (!global.sseClients) {
      global.sseClients = [];
    }

    const updateMessage = JSON.stringify({
      type: eventType,
      data: data,
      timestamp: new Date().toISOString()
    });

    
    global.sseClients.forEach((client, index) => {
      try {
        client.write(`data: ${updateMessage}\n\n`);
      } catch (error) {
        console.error('Error sending SSE update:', error);
        
        global.sseClients.splice(index, 1);
      }
    });

    console.log(`Broadcasted ${eventType} to ${global.sseClients.length} clients`);
  }

  
  static setupSSEEndpoint(req, res) {
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    
    if (!global.sseClients) {
      global.sseClients = [];
    }

    
    global.sseClients.push(res);
    console.log(`New SSE client connected. Total clients: ${global.sseClients.length}`);

    
    res.write(`data: ${JSON.stringify({
      type: 'connected',
      message: 'Real-time connection established',
      timestamp: new Date().toISOString()
    })}\n\n`);

    
    req.on('close', () => {
      const index = global.sseClients.indexOf(res);
      if (index !== -1) {
        global.sseClients.splice(index, 1);
        console.log(`SSE client disconnected. Total clients: ${global.sseClients.length}`);
      }
    });
  }

  
  static startHeartbeat() {
    setInterval(() => {
      if (global.sseClients && global.sseClients.length > 0) {
        const heartbeat = JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        });

        global.sseClients.forEach((client, index) => {
          try {
            client.write(`data: ${heartbeat}\n\n`);
          } catch (error) {
            
            global.sseClients.splice(index, 1);
          }
        });
      }
    }, 60000); 
  }
}

module.exports = RealtimeService;
