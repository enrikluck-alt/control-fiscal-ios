/* Optional backend for FUTURE admin push notifications.
 * NOT deployed and NOT connected to the R26 iOS build.
 * Before use: configure APNs/FCM in signed native apps; register ONLY
 * administrator device FCM tokens after server-side Firebase Auth verification.
 * Set CF_ADMIN_UID in the deployed Functions environment.
 * Never store fiscal invoices, Google Drive data or user refresh tokens here.
 */
'use strict';
const {onDocumentCreated}=require('firebase-functions/v2/firestore');
const {initializeApp,getApps}=require('firebase-admin/app');
const {getFirestore}=require('firebase-admin/firestore');
const {getMessaging}=require('firebase-admin/messaging');
if(!getApps().length)initializeApp();
exports.notifyAdminOfSuggestion=onDocumentCreated({region:'europe-west1',document:'control_fiscal_sugerencias/{suggestionId}'},async(event)=>{
  if(!event.data)return;
  const uid=String(process.env.CF_ADMIN_UID||'');
  if(!/^[A-Za-z0-9_-]{12,128}$/.test(uid))return;
  const snapshot=await getFirestore().collection('control_fiscal_admin_devices').doc(uid).collection('tokens').limit(300).get();
  const tokens=[...new Set(snapshot.docs.map(doc=>String(doc.data().fcmToken||'')).filter(value=>value.length>=32))];
  if(!tokens.length)return;
  await getMessaging().sendEachForMulticast({tokens,notification:{title:'Control Fiscal',body:'Hay una nueva sugerencia para revisar.'},data:{destination:'suggestions'}});
});
