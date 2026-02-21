const FirebaseService = require('../services/firebaseService');
const AttendanceController = require('../controllers/attendanceController');
const moment = require('moment-timezone');


async function processOldDataAndAutoCheckout() {
    try {
        console.log('Processing old data and applying auto checkout logic...');
        
        
        moment.tz.setDefault('Asia/Jakarta');
        
        
        const dates = [];
        for (let i = 0; i <= 7; i++) {
            const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
            dates.push(date);
        }
        
        console.log(`Processing dates: ${dates.join(',')}`);
        
        let totalProcessed = 0;
        let totalUpdated = 0;
        
        for (const date of dates) {
            console.log(`\n Processing date: ${date}`);
            
            
            const records = await FirebaseService.getDocuments('attendance', [
                { field: 'tanggal', operator: '==', value: date }
            ]);
            
            console.log(`Found ${records.length} records for ${date}`);
            
            if (records.length === 0) {
                console.log(`No records for ${date}, skipping...`);
                continue;
            }
            
            
            for (const record of records) {
                totalProcessed++;
                
                
                const currentStatus = AttendanceController.determineStatus(
                    record.jamDatang, 
                    record.jamPulang, 
                    record.tanggal
                );
                
                console.log(`${record.nama} (${record.nim}): Current DB Status: "${record.status}" -> Should be: "${currentStatus}"`);
                
                
                if (record.status !== currentStatus) {
                    const updateData = {
                        status: currentStatus,
                        updatedAt: moment().tz('Asia/Jakarta').toISOString()
                    };
                    
                    
                    if (record.jamDatang && !record.jamPulang && currentStatus === 'Tidak Piket') {
                        updateData.autoCheckedOut = true;
                        updateData.autoCheckedOutAt = moment().tz('Asia/Jakarta').toISOString();
                        updateData.autoCheckedOutReason = 'Retrospective auto checkout - failed to checkout before 18:00';
                    }
                    
                    try {
                        await FirebaseService.updateDocument('attendance', record.id, updateData);
                        totalUpdated++;
                        console.log(`Updated: "${record.status}" -> "${currentStatus}"`);
                        
                        
                        if (updateData.autoCheckedOut) {
                            console.log(`Auto checkout applied: JamDatang: ${record.jamDatang}, JamPulang: ${record.jamPulang}`);
                        }
                        
                    } catch (error) {
                        console.error(`Failed to update record ${record.id}:`, error.message);
                    }
                } else {
                    console.log(` No update needed (status already correct)`);
                }
            }
            
            
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log(`\n Processing completed!`);
        console.log(`Total records processed: ${totalProcessed}`);
        console.log(`Total records updated: ${totalUpdated}`);
        
        
        console.log('\n Final verification for recent dates...');
        
        const recentDates = [
            moment().format('YYYY-MM-DD'),
            moment().subtract(1, 'day').format('YYYY-MM-DD')
        ];
        
        for (const checkDate of recentDates) {
            const todayRecords = await FirebaseService.getDocuments('attendance', [
                { field: 'tanggal', operator: '==', value: checkDate }
            ]);
            
            console.log(`\n ${checkDate} final status check:`);
            
            if (todayRecords.length === 0) {
                console.log(`No records found`);
                continue;
            }
            
            const statusCounts = {};
            todayRecords.forEach(record => {
                const status = record.status;
                statusCounts[status] = (statusCounts[status] || 0) + 1;
            });
            
            console.log(`Status distribution:`, statusCounts);
            
            
            const sedangPiketRecords = todayRecords.filter(r => r.status === 'Sedang Piket');
            if (sedangPiketRecords.length > 0) {
                console.log(` Still "Sedang Piket" (${sedangPiketRecords.length} records):`);
                sedangPiketRecords.forEach(r => {
                    console.log(`- ${r.nama}: JamDatang: ${r.jamDatang}, JamPulang: ${r.jamPulang}`);
                });
            }
        }
        
    } catch (error) {
        console.error('Error during processing:', error);
    } finally {
        process.exit(0);
    }
}


async function fixSedangPiketRecords() {
    try {
        console.log('Fixing "Sedang Piket" records that should be "Tidak Piket"...');
        
        
        const sedangPiketRecords = await FirebaseService.getDocuments('attendance', [
            { field: 'status', operator: '==', value: 'Sedang Piket' }
        ]);
        
        console.log(`Found ${sedangPiketRecords.length} "Sedang Piket" records`);
        
        let fixed = 0;
        
        for (const record of sedangPiketRecords) {
            const recordDate = record.tanggal;
            const today = moment().tz('Asia/Jakarta').format('YYYY-MM-DD');
            
            
            const isPastDate = moment(recordDate).isBefore(today, 'day');
            const isToday = recordDate === today;
            const currentTime = moment().tz('Asia/Jakarta');
            const cutoffTime = moment(`${recordDate} 18:00:00`).tz('Asia/Jakarta');
            const isPastCutoff = currentTime.isAfter(cutoffTime);
            
            console.log(`${record.nama} (${recordDate}): isPastDate: ${isPastDate}, isToday: ${isToday}, isPastCutoff: ${isPastCutoff}`);
            
            if (isPastDate || (isToday && isPastCutoff)) {
                
                const updateData = {
                    status: 'Tidak Piket',
                    autoCheckedOut: true,
                    autoCheckedOutAt: moment().tz('Asia/Jakarta').toISOString(),
                    autoCheckedOutReason: `Fixed retrospectively - was Sedang Piket past cutoff time for ${recordDate}`,
                    updatedAt: moment().tz('Asia/Jakarta').toISOString()
                };
                
                try {
                    await FirebaseService.updateDocument('attendance', record.id, updateData);
                    fixed++;
                    console.log(`Fixed: ${record.nama} -> "Tidak Piket"`);
                } catch (error) {
                    console.error(`Failed to fix record ${record.id}:`, error.message);
                }
            } else {
                console.log(` Keep as "Sedang Piket" (still valid for today before 18:00)`);
            }
        }
        
        console.log(`\n Fixed ${fixed} "Sedang Piket" records`);
        
    } catch (error) {
        console.error('Error fixing Sedang Piket records:', error);
    }
}


async function main() {
    console.log('Starting comprehensive data fix...\n');
    
    
    await fixSedangPiketRecords();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    
    await processOldDataAndAutoCheckout();
}


main();
