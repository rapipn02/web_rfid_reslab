class DataStore {
    constructor() {
        this.members = [
            { id: 1, nama: 'Rahmat Fajar Saputra', nim: '210511001', idRfid: 'RF001ABC', hariPiket: ['Senin', 'Rabu'] },
            { id: 2, nama: 'NursyaBani', nim: '210511002', idRfid: 'RF002DEF', hariPiket: ['Selasa'] },
            { id: 3, nama: 'Muhammad Fajri', nim: '210511003', idRfid: 'RF003GHI', hariPiket: ['Rabu', 'Jumat'] },
            { id: 4, nama: 'Asyifa Putri Romansha', nim: '210511004', idRfid: 'RF004JKL', hariPiket: ['Kamis'] },
            { id: 5, nama: 'Hanaviz', nim: '210511005', idRfid: 'RF005MNO', hariPiket: ['Jumat', 'Sabtu'] },
            { id: 6, nama: 'Bunga Jacinda', nim: '210511006', idRfid: 'RF006PQR', hariPiket: ['Senin'] },
            { id: 7, nama: 'Muhammad Hafiz', nim: '210511007', idRfid: 'RF007STU', hariPiket: ['Selasa', 'Kamis'] },
            { id: 8, nama: 'Naufal Rafiif Irwan', nim: '210511008', idRfid: 'RF008VWX', hariPiket: ['Rabu'] },
            { id: 9, nama: 'Daffa', nim: '210511009', idRfid: 'RF009YZA', hariPiket: ['Kamis', 'Jumat'] },
            { id: 10, nama: 'Widia', nim: '210511010', idRfid: 'RF010BCD', hariPiket: ['Jumat'] },
        ];

        this.attendance = [
            { id: 1, memberId: 1, nama: 'Rahmat Fajar Saputra', tanggal: '2025-08-26', jam: '10.00', jamPulang: '17.30', status: 'Hadir' },
            { id: 2, memberId: 2, nama: 'NursyaBani', tanggal: '2025-08-26', jam: '09.58', jamPulang: '18.00', status: 'Hadir' },
            { id: 3, memberId: 3, nama: 'Muhammad Fajri', tanggal: '2025-08-25', jam: '-', jamPulang: '-', status: 'Tidak Hadir' },
            { id: 4, memberId: 4, nama: 'Asyifa Putri Romansha', tanggal: '2025-08-25', jam: '10.05', jamPulang: '16.45', status: 'Hadir' },
            { id: 5, memberId: 5, nama: 'Hanaviz', tanggal: '2025-08-24', jam: '-', jamPulang: '-', status: 'Tidak Hadir' },
            { id: 6, memberId: 6, nama: 'Bunga Jacinda', tanggal: '2025-08-26', jam: '08.30', jamPulang: '17.15', status: 'Hadir' },
            { id: 7, memberId: 7, nama: 'Muhammad Hafiz', tanggal: '2025-08-25', jam: '09.15', jamPulang: '18.30', status: 'Hadir' },
            { id: 8, memberId: 8, nama: 'Naufal Rafiif Irwan', tanggal: '2025-08-24', jam: '-', jamPulang: '-', status: 'Tidak Hadir' },
            { id: 9, memberId: 9, nama: 'Daffa', tanggal: '2025-08-26', jam: '11.00', jamPulang: '19.00', status: 'Hadir' },
            { id: 10, memberId: 10, nama: 'Widia', tanggal: '2025-08-25', jam: '14.20', jamPulang: '20.15', status: 'Hadir' },
            { id: 11, memberId: 1, nama: 'Rahmat Fajar Saputra', tanggal: '2025-08-27', jam: '09.30', jamPulang: '17.00', status: 'Hadir' },
            { id: 12, memberId: 2, nama: 'NursyaBani', tanggal: '2025-08-27', jam: '-', jamPulang: '-', status: 'Tidak Hadir' },
        ];

        this.subscribers = [];
    }

    // Subscriber pattern untuk update real-time
    subscribe(callback) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(sub => sub !== callback);
        };
    }

    notify() {
        this.subscribers.forEach(callback => callback());
    }

    // Member methods
    getMembers() {
        return [...this.members];
    }

    getMemberById(id) {
        return this.members.find(member => member.id === parseInt(id));
    }

    addMember(memberData) {
        const newId = Math.max(...this.members.map(m => m.id), 0) + 1;
        const newMember = {
            id: newId,
            ...memberData
        };
        this.members.push(newMember);
        this.notify();
        return newMember;
    }

    updateMember(id, memberData) {
        const index = this.members.findIndex(member => member.id === parseInt(id));
        if (index !== -1) {
            this.members[index] = { ...this.members[index], ...memberData };
            
            // Update attendance records with new name
            this.attendance.forEach(record => {
                if (record.memberId === parseInt(id)) {
                    record.nama = memberData.nama;
                }
            });
            
            this.notify();
            return this.members[index];
        }
        return null;
    }

    deleteMember(id) {
        const index = this.members.findIndex(member => member.id === parseInt(id));
        if (index !== -1) {
            const deletedMember = this.members.splice(index, 1)[0];
            
            // Remove related attendance records
            this.attendance = this.attendance.filter(record => record.memberId !== parseInt(id));
            
            this.notify();
            return deletedMember;
        }
        return null;
    }

    // Attendance methods
    getAttendance() {
        return [...this.attendance];
    }

    addAttendance(attendanceData) {
        const newId = Math.max(...this.attendance.map(a => a.id), 0) + 1;
        const newAttendance = {
            id: newId,
            ...attendanceData
        };
        this.attendance.push(newAttendance);
        this.notify();
        return newAttendance;
    }

    // Statistics methods
    getAttendanceStats() {
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = this.attendance.filter(record => record.tanggal === today);
        
        return {
            hadir: this.attendance.filter(record => record.status === 'Hadir').length,
            tidakHadir: this.attendance.filter(record => record.status === 'Tidak Hadir').length,
            todayHadir: todayAttendance.filter(record => record.status === 'Hadir').length,
            todayTidakHadir: todayAttendance.filter(record => record.status === 'Tidak Hadir').length
        };
    }

    // Chart data
    getChartData() {
        // Generate monthly data for the last 5 months
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei'];
        return months.map(month => ({
            name: month,
            Hadir: Math.floor(Math.random() * 50) + 20,
            TidakHadir: Math.floor(Math.random() * 30) + 10
        }));
    }

    // Utility methods
    isNimExists(nim, excludeId = null) {
        const trimmedNim = typeof nim === 'string' ? nim.trim() : nim;
        return this.members.some(member => 
            member.nim === trimmedNim && (excludeId === null || member.id !== excludeId)
        );
    }

    isRfidExists(rfid, excludeId = null) {
        const trimmedRfid = typeof rfid === 'string' ? rfid.trim() : rfid;
        return this.members.some(member => 
            member.idRfid === trimmedRfid && (excludeId === null || member.id !== excludeId)
        );
    }

    generateRfidId() {
        let newRfid;
        do {
            newRfid = 'RF' + Math.random().toString(36).substr(2, 6).toUpperCase();
        } while (this.isRfidExists(newRfid));
        return newRfid;
    }
}

// Create singleton instance
const dataStore = new DataStore();
export default dataStore;