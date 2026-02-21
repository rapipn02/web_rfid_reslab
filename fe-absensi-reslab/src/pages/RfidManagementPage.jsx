import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Users, CreditCard, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import rfidApi from '../api/rfidApi';
import membersApi from '../api/membersApi';

const RfidManagementPage = () => {
  const [devices, setDevices] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  
  useEffect(() => {
    fetchDevices();
    fetchPendingRegistrations();
    fetchMembers();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await rfidApi.getDevices();
      setDevices(response.data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
      setError('Gagal memuat data device');
    }
  };

  const fetchPendingRegistrations = async () => {
    try {
      const response = await rfidApi.getPendingRegistrations();
      setPendingRegistrations(response.data || []);
    } catch (error) {
      console.error('Error fetching pending registrations:', error);
      setError('Gagal memuat data registrasi pending');
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await membersApi.getMembers();
      setMembers(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching members:', error);
      setError('Gagal memuat data anggota');
      setLoading(false);
    }
  };

  const toggleRegistrationMode = async (deviceId, currentMode) => {
    try {
      await rfidApi.toggleRegistrationMode(deviceId, !currentMode);
      await fetchDevices();
      setSuccess(`Mode registrasi device ${currentMode ? 'dinonaktifkan' : 'diaktifkan'}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error toggling registration mode:', error);
      setError('Gagal mengubah mode registrasi');
      setTimeout(() => setError(''), 3000);
    }
  };

  const assignCardToMember = async (cardId, memberId, registrationId) => {
    try {
      await membersApi.assignRfidCard(memberId, cardId);
      await rfidApi.completePendingRegistration(registrationId, 'completed');
      await fetchPendingRegistrations();
      await fetchMembers();
      setSuccess('RFID card berhasil didaftarkan ke anggota');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error assigning card:', error);
      setError('Gagal mendaftarkan RFID card');
      setTimeout(() => setError(''), 3000);
    }
  };

  const rejectRegistration = async (registrationId) => {
    try {
      await rfidApi.completePendingRegistration(registrationId, 'rejected');
      await fetchPendingRegistrations();
      setSuccess('Registrasi ditolak');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error rejecting registration:', error);
      setError('Gagal menolak registrasi');
      setTimeout(() => setError(''), 3000);
    }
  };

  const DeviceCard = ({ device }) => {
    const isOnline = device.status === 'active' && 
      new Date() - new Date(device.lastActivity) < 5 * 60 * 1000; 

    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isOnline ? 'bg-green-100' : 'bg-red-100'}`}>
              {isOnline ? (
                <Wifi className={`h-6 w-6 ${isOnline ? 'text-green-600' : 'text-red-600'}`} />
              ) : (
                <WifiOff className={`h-6 w-6 ${isOnline ? 'text-green-600' : 'text-red-600'}`} />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{device.name}</h3>
              <p className="text-sm text-gray-600">{device.location}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Device ID:</span>
            <span className="font-mono text-gray-900">{device.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Last Activity:</span>
            <span className="text-gray-900">
              {device.lastActivity ? new Date(device.lastActivity).toLocaleString('id-ID') : 'Never'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Registration Mode:</span>
            <span className={`font-medium ${device.isRegistrationMode ? 'text-blue-600' : 'text-gray-600'}`}>
              {device.isRegistrationMode ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => toggleRegistrationMode(device.id, device.isRegistrationMode)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              device.isRegistrationMode
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {device.isRegistrationMode ? 'Stop Registration' : 'Start Registration'}
          </button>
          <button
            onClick={() => alert(`Device settings for ${device.name} - Coming soon!`)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  const PendingRegistrationCard = ({ registration }) => {
    const availableMembers = members.filter(member => !member.rfidCard && !member.isDeleted);

    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-orange-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-orange-100 rounded-lg">
            <CreditCard className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Pending Registration</h3>
            <p className="text-sm text-gray-600">
              Card: <span className="font-mono">{registration.cardId}</span>
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Device:</span>
            <span className="text-gray-900">{registration.deviceId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Scanned At:</span>
            <span className="text-gray-900">
              {new Date(registration.timestamp).toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assign to Member:
          </label>
          <select 
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            onChange={(e) => {
              if (e.target.value) {
                assignCardToMember(registration.cardId, e.target.value, registration.id);
              }
            }}
            defaultValue=""
          >
            <option value="">Select Member...</option>
            {availableMembers.map(member => (
              <option key={member.id} value={member.id}>
                {member.nama} - {member.nim}
              </option>
            ))}
          </select>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => rejectRegistration(registration.id)}
            className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
          >
            Reject
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">RFID Management</h1>
        <p className="text-gray-600">Manage RFID devices and card registrations</p>
      </div>

      {}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wifi className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Devices</p>
              <p className="text-2xl font-bold text-gray-900">{devices.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Online Devices</p>
              <p className="text-2xl font-bold text-gray-900">
                {devices.filter(d => d.status === 'active' && 
                  new Date() - new Date(d.lastActivity) < 5 * 60 * 1000).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Registrations</p>
              <p className="text-2xl font-bold text-gray-900">{pendingRegistrations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Registered Cards</p>
              <p className="text-2xl font-bold text-gray-900">
                {members.filter(m => m.rfidCard && !m.isDeleted).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">RFID Devices</h2>
        {devices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map(device => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Wifi className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No RFID devices found</p>
          </div>
        )}
      </div>

      {}
      {pendingRegistrations.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Card Registrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingRegistrations.map(registration => (
              <PendingRegistrationCard key={registration.id} registration={registration} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RfidManagementPage;
