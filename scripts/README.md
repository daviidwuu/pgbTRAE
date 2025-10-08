# Transaction Import Script

This script imports transaction data to a specific user in your Firebase Firestore database.

## Setup Instructions

### 1. Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (piggybankpwa)
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file and save it as `firebase-service-account.json` in the project root

### 2. Install Dependencies

```bash
npm install firebase-admin
```

### 3. Update Database URL (if needed)

In `import-transactions.js`, update the `databaseURL` to match your project:
```javascript
databaseURL: "https://piggybankpwa-default-rtdb.firebaseio.com"
```

### 4. Run the Import Script

```bash
node scripts/import-transactions.js
```

## What the Script Does

1. **Updates User Categories**: Adds new categories (Dad, Girlfriend, Others) to the user's profile
2. **Imports Transactions**: Adds all 35 transactions to the user's transaction collection
3. **Batch Processing**: Uses Firestore batches for efficient bulk operations
4. **Proper Timestamps**: Converts date strings to Firestore timestamps
5. **Metadata**: Adds userId, createdAt, and updatedAt fields

## Data Summary

- **User ID**: YTWwna3U9HgSS1aJAR4Kg0bTYmu1
- **Total Transactions**: 35
- **Total Amount**: $934.89
- **Date Range**: September 30 - October 5, 2025
- **Categories**: F&B, Transport, Shopping, Dad, Girlfriend, Others

## Security Notes

⚠️ **Important**: 
- Never commit the `firebase-service-account.json` file to version control
- Add it to your `.gitignore` file
- Keep the service account key secure and private

## Troubleshooting

If you encounter errors:
1. Verify the service account key file exists and is valid
2. Check that the user ID exists in your database
3. Ensure you have proper Firestore permissions
4. Verify the database URL is correct for your project