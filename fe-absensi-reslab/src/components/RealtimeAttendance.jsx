import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../api';

const RealtimeAttendance = () => {

  const [todayAttendance, setTodayAttendance] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    
    loadTodayAttendance();

    
    const eventSource = new EventSource('http://localhost:5000/api/realtime/attendance');
    
    eventSource.onopen = () => {
      setIsConnected(true);
      console.log('Real-time attendance connected');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Real-time attendance update:', data);
        
        if (data.type === 'attendance_scan') {
          loadTodayAttendance(); 
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      console.log('Real-time attendance disconnected');
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const loadTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await attendanceApi.getAttendanceByDate(today);
      setTodayAttendance(response.data || []);
    } catch (error) {
      console.error('Error loading today attendance:', error);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return timeString.substring(0, 5); 
  };



  return (
    <div className="realtime-attendance">
      {}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>📊 Real-time Attendance</h5>
        <div className="d-flex align-items-center">
          <span 
            className={`badge ${isConnected ? 'bg-success' : 'bg-danger'} me-2`}
          >
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          <small className="text-muted">
            {new Date().toLocaleTimeString()}
          </small>
        </div>
      </div>



      {}
      <div className="card">
        <div className="card-header bg-light">
          <h6 className="mb-0">📅 Today's Attendance ({todayAttendance.length} members)</h6>
        </div>
        <div className="card-body p-0">
          {todayAttendance.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted mb-0">No attendance records today</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Member</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayAttendance.map((record, index) => (
                    <tr key={record.id || index}>
                      <td>
                        <div>
                          <strong>{record.nama}</strong><br />
                          <small className="text-muted">{record.nim}</small>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-success">
                          {formatTime(record.jamDatang)}
                        </span>
                      </td>
                      <td>
                        {record.jamPulang ? (
                          <span className="badge bg-primary">
                            {formatTime(record.jamPulang)}
                          </span>
                        ) : (
                          <span className="badge bg-warning">Active</span>
                        )}
                      </td>
                      <td>
                        <small>{record.durasi || '-'}</small>
                      </td>
                      <td>
                        <span className={`badge ${
                          record.status === 'hadir' ? 'bg-success' : 
                          record.status === 'terlambat' ? 'bg-warning' : 'bg-secondary'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {}
      <div className="row mt-3">
        <div className="col-md-4">
          <div className="card bg-success text-white">
            <div className="card-body text-center">
              <h4>{todayAttendance.filter(a => a.jamDatang && !a.jamPulang).length}</h4>
              <small>Currently Present</small>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-primary text-white">
            <div className="card-body text-center">
              <h4>{todayAttendance.filter(a => a.jamPulang).length}</h4>
              <small>Completed</small>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-info text-white">
            <div className="card-body text-center">
              <h4>{todayAttendance.length}</h4>
              <small>Total Today</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeAttendance;
