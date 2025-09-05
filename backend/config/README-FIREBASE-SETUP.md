# Firebase Setup Guide

## Setup Firebase Service Account

1. Copy `firebase-service-account.template.json` to `firebase-service-account.json`
2. Replace the placeholder values with your actual Firebase service account credentials
3. Update `firebase.js` to use the new filename if needed

## Important Security Notes

- Never commit the actual service account JSON file to version control
- The `.gitignore` file is configured to ignore Firebase credential files
- Keep your service account credentials secure and private

## Environment Variables Alternative

For better security, consider using environment variables instead of JSON files:

```javascript
// In firebase.js
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: "googleapis.com"
};
```
