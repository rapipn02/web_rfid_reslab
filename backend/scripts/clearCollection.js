const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyB6-iFaq4yYvjytbzvei4_VPggyf97oZ8s",
  authDomain: "absensi-reslab-db.firebaseapp.com",
  projectId: "absensi-reslab-db",
  storageBucket: "absensi-reslab-db.firebasestorage.app",
  messagingSenderId: "15706123253",
  appId: "1:15706123253:web:0b7b210384d34cf85f8ebc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearCollection(collectionName) {
  console.log(`\n WARNING: Deleting all documents in "${collectionName}"`);
  console.log('Collection structure will be preserved\n');
  
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log(`Clearing collection: ${collectionName}\n`);
  
  try {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    
    if (snapshot.empty) {
      console.log('Collection is already empty');
      process.exit(0);
    }
    
    console.log(`Found ${snapshot.size} documents to delete\n`);
    
    let deleted = 0;
    const deletePromises = [];
    
    snapshot.forEach((document) => {
      deletePromises.push(
        deleteDoc(doc(db, collectionName, document.id))
          .then(() => {
            deleted++;
            console.log(`Deleted: ${document.id} (${deleted}/${snapshot.size})`);
          })
      );
    });
    
    await Promise.all(deletePromises);
    
    console.log(`\n Successfully cleared collection: ${collectionName}`);
    console.log(`Total documents deleted: ${deleted}`);
    console.log(`Collection "${collectionName}" still exists (empty)\n`);
    
  } catch (error) {
    console.error('\n Error clearing collection:', error.message);
    
    if (error.code === 'permission-denied') {
      console.log('\n Permission denied! Update Firestore Rules:');
      console.log('https://console.firebase.google.com/project/absensi-reslab-db/firestore/rules\n');
    }
    
    process.exit(1);
  }
  
  process.exit(0);
}


const collectionName = process.argv[2];

if (!collectionName) {
  console.log('\n Usage: node scripts/clearCollection-client.js <collection-name>');
  console.log('\nExamples:');
  console.log('node scripts/clearCollection-client.js rfid_scans');
  console.log('node scripts/clearCollection-client.js attendance');
  console.log('node scripts/clearCollection-client.js members\n');
  process.exit(1);
}

clearCollection(collectionName);