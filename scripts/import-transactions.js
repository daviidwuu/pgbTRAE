const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
// Make sure you have your service account key file
const serviceAccount = require('../firebase-service-account.json'); // You'll need to add this file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://piggybankpwa-default-rtdb.firebaseio.com" // Replace with your project URL
});

const db = admin.firestore();

// User ID to import data to
const userId = 'YTWwna3U9HgSS1aJAR4Kg0bTYmu1';

// Transaction data to import
const transactions = [
  {
    "id": "txn_001",
    "Date": "2025-09-30T09:42:00.000Z",
    "Amount": 6,
    "Type": "Expense",
    "Category": "Dad",
    "Notes": "7-11 Monster"
  },
  {
    "id": "txn_002",
    "Date": "2025-09-30T09:31:00.000Z",
    "Amount": 18,
    "Type": "Expense",
    "Category": "F&B",
    "Notes": "macs"
  },
  {
    "id": "txn_003",
    "Date": "2025-09-30T10:14:00.000Z",
    "Amount": 301,
    "Type": "Expense",
    "Category": "Others",
    "Notes": "vape"
  },
  {
    "id": "txn_004",
    "Date": "2025-09-30T21:51:00.000Z",
    "Amount": 5,
    "Type": "Expense",
    "Category": "Transport",
    "Notes": "JB CP to LOKLOK"
  },
  {
    "id": "txn_005",
    "Date": "2025-09-30T21:54:00.000Z",
    "Amount": 1,
    "Type": "Expense",
    "Category": "F&B",
    "Notes": "JB coke"
  },
  {
    "id": "txn_006",
    "Date": "2025-09-30T23:13:00.000Z",
    "Amount": 2,
    "Type": "Expense",
    "Category": "Transport",
    "Notes": "JB Ride to bnb"
  },
  {
    "id": "txn_007",
    "Date": "2025-10-01T03:22:00.000Z",
    "Amount": 21,
    "Type": "Expense",
    "Category": "F&B",
    "Notes": "JB Frog Porridge"
  },
  {
    "id": "txn_008",
    "Date": "2025-10-01T03:25:00.000Z",
    "Amount": 127,
    "Type": "Expense",
    "Category": "Shopping",
    "Notes": "Shopee Paylater"
  },
  {
    "id": "txn_009",
    "Date": "2025-10-01T11:31:00.000Z",
    "Amount": 3,
    "Type": "Expense",
    "Category": "Transport",
    "Notes": "JB to Cafe"
  },
  {
    "id": "txn_010",
    "Date": "2025-10-01T12:15:00.000Z",
    "Amount": 2,
    "Type": "Expense",
    "Category": "Transport",
    "Notes": "JB Ride to KSL"
  },
  {
    "id": "txn_011",
    "Date": "2025-10-01T14:05:00.000Z",
    "Amount": 23,
    "Type": "Expense",
    "Category": "Shopping",
    "Notes": "JB Dad Nike Black Socks"
  },
  {
    "id": "txn_012",
    "Date": "2025-10-01T12:15:00.000Z",
    "Amount": 32,
    "Type": "Expense",
    "Category": "F&B",
    "Notes": "JB KBBQ"
  },
  {
    "id": "txn_013",
    "Date": "2025-10-01T12:15:00.000Z",
    "Amount": 5,
    "Type": "Expense",
    "Category": "F&B",
    "Notes": "JB Chagee"
  },
  {
    "id": "txn_014",
    "Date": "2025-10-01T12:15:00.000Z",
    "Amount": 6,
    "Type": "Expense",
    "Category": "Transport",
    "Notes": "JB Grab"
  },
  {
    "id": "txn_015",
    "Date": "2025-10-01T12:15:00.000Z",
    "Amount": 37,
    "Type": "Expense",
    "Category": "Girlfriend",
    "Notes": "JB Hotel"
  },
  {
    "id": "txn_016",
    "Date": "2025-10-02T01:37:00.000Z",
    "Amount": 23,
    "Type": "Expense",
    "Category": "F&B",
    "Notes": "JB Mc Supper"
  },
  {
    "id": "txn_017",
    "Date": "2025-10-02T12:54:00.000Z",
    "Amount": 2,
    "Type": "Expense",
    "Category": "Transport",
    "Notes": "JB to Dim Sum"
  },
  {
    "id": "txn_018",
    "Date": "2025-10-02T13:42:00.000Z",
    "Amount": 28.2,
    "Type": "Expense",
    "Category": "Dad",
    "Notes": "JB Dim Sum"
  },
  {
    "id": "txn_019",
    "Date": "2025-10-02T13:55:00.000Z",
    "Amount": 8,
    "Type": "Expense",
    "Category": "Transport",
    "Notes": "JB to Mid Valley"
  },
  {
    "id": "txn_020",
    "Date": "2025-10-02T16:48:00.000Z",
    "Amount": 16.3,
    "Type": "Expense",
    "Category": "Dad",
    "Notes": "JB Axololt"
  },
  {
    "id": "txn_021",
    "Date": "2025-10-02T17:37:00.000Z",
    "Amount": 10,
    "Type": "Expense",
    "Category": "Dad",
    "Notes": "JB Watson"
  },
  {
    "id": "txn_022",
    "Date": "2025-10-02T18:59:00.000Z",
    "Amount": 4,
    "Type": "Expense",
    "Category": "Transport",
    "Notes": "JB to Tulang"
  },
  {
    "id": "txn_023",
    "Date": "2025-10-02T20:48:00.000Z",
    "Amount": 26.4,
    "Type": "Expense",
    "Category": "F&B",
    "Notes": "JB Tulang"
  },
  {
    "id": "txn_024",
    "Date": "2025-10-02T20:50:00.000Z",
    "Amount": 3,
    "Type": "Expense",
    "Category": "Transport",
    "Notes": "JB to City Square"
  },
  {
    "id": "txn_025",
    "Date": "2025-10-02T21:17:00.000Z",
    "Amount": 50,
    "Type": "Expense",
    "Category": "Dad",
    "Notes": "Uniqlo Jeans"
  },
  {
    "id": "txn_026",
    "Date": "2025-10-02T21:28:00.000Z",
    "Amount": 2,
    "Type": "Expense",
    "Category": "Dad",
    "Notes": "JB Drinks"
  },
  {
    "id": "txn_027",
    "Date": "2025-10-03T04:03:00.000Z",
    "Amount": 11,
    "Type": "Expense",
    "Category": "Dad",
    "Notes": "7-11 Supper"
  },
  {
    "id": "txn_028",
    "Date": "2025-10-03T07:27:00.000Z",
    "Amount": 1.19,
    "Type": "Expense",
    "Category": "Dad",
    "Notes": "SMRT"
  },
  {
    "id": "txn_029",
    "Date": "2025-10-03T20:24:00.000Z",
    "Amount": 6.3,
    "Type": "Expense",
    "Category": "Dad",
    "Notes": "Pre Gym"
  },
  {
    "id": "txn_030",
    "Date": "2025-10-03T21:34:00.000Z",
    "Amount": 60,
    "Type": "Expense",
    "Category": "Girlfriend",
    "Notes": "Pokemon Cards"
  },
  {
    "id": "txn_031",
    "Date": "2025-10-04T14:58:00.000Z",
    "Amount": 1,
    "Type": "Expense",
    "Category": "Others",
    "Notes": "test"
  },
  {
    "id": "txn_032",
    "Date": "2025-10-04T15:07:00.000Z",
    "Amount": 1.4,
    "Type": "Expense",
    "Category": "F&B",
    "Notes": "Can 2"
  },
  {
    "id": "txn_033",
    "Date": "2025-10-04T15:10:00.000Z",
    "Amount": 9,
    "Type": "Expense",
    "Category": "F&B",
    "Notes": "Acai"
  },
  {
    "id": "txn_034",
    "Date": "2025-10-04T22:59:00.000Z",
    "Amount": 12.1,
    "Type": "Expense",
    "Category": "Dad",
    "Notes": "7-11"
  },
  {
    "id": "txn_035",
    "Date": "2025-10-05T01:16:00.000Z",
    "Amount": 42,
    "Type": "Expense",
    "Category": "Dad",
    "Notes": "Food"
  }
];

async function importTransactions() {
  try {
    console.log(`Starting import for user: ${userId}`);
    console.log(`Total transactions to import: ${transactions.length}`);

    // First, update user categories to include new ones
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      const existingCategories = userData.categories || [];
      const newCategories = ['Dad', 'Girlfriend', 'Others'];
      
      // Add new categories if they don't exist
      const updatedCategories = [...new Set([...existingCategories, ...newCategories])];
      
      await userRef.update({
        categories: updatedCategories,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('Updated user categories:', updatedCategories);
    }

    // Import transactions in batches
    const batch = db.batch();
    let batchCount = 0;
    
    for (const transaction of transactions) {
      const transactionRef = db.collection('users').doc(userId).collection('transactions').doc(transaction.id);
      
      // Convert date string to Firestore timestamp
      const transactionData = {
        ...transaction,
        Date: admin.firestore.Timestamp.fromDate(new Date(transaction.Date)),
        userId: userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      batch.set(transactionRef, transactionData);
      batchCount++;
      
      // Firestore batch limit is 500, commit every 400 to be safe
      if (batchCount >= 400) {
        await batch.commit();
        console.log(`Committed batch of ${batchCount} transactions`);
        batchCount = 0;
      }
    }
    
    // Commit remaining transactions
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} transactions`);
    }
    
    console.log('✅ Successfully imported all transactions!');
    console.log(`📊 Summary:`);
    console.log(`   - User ID: ${userId}`);
    console.log(`   - Total transactions: ${transactions.length}`);
    console.log(`   - Total amount: $${transactions.reduce((sum, t) => sum + t.Amount, 0).toFixed(2)}`);
    console.log(`   - Date range: Sep 30 - Oct 5, 2025`);
    
  } catch (error) {
    console.error('❌ Error importing transactions:', error);
  } finally {
    // Close the admin app
    admin.app().delete();
  }
}

// Run the import
importTransactions();