// app.tsx:
// import React, { useRef, useState } from 'react';
// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
 
// function App() {
//   const workerRef = useRef<Worker | null>(null);
//   const [message, setMessage] = useState('');
//   const [loading, setLoading] = useState(false);
 
//   // Fetch OAuth access token from your proxy server
//   async function getAccessToken(): Promise<string> {
//     const response = await fetch('http://localhost:3001/token', {
//       method: 'POST',
//     });
//     if (!response.ok) throw new Error('Failed to get access token');
//     const data = await response.json();
//     return data.access_token;
//   }
 
//   // Recursively clean objects with { "@_xsi:nil": "true" }
//   function deepClean(obj: any): any {
//     if (Array.isArray(obj)) {
//       return obj.map(deepClean);
//     }
//     if (typeof obj === 'object' && obj !== null) {
//       if (Object.keys(obj).length === 1 && obj['@_xsi:nil'] === 'true') {
//         return null;
//       }
//       const cleaned: any = {};
//       for (const key in obj) {
//         if (Object.prototype.hasOwnProperty.call(obj, key)) {
//           cleaned[key] = deepClean(obj[key]);
//         }
//       }
//       return cleaned;
//     }
//     return obj;
//   }
 
//   // Extract and convert required fields from WBS record
//   function extractWBSFields(record: any) {
//     if (!record) return null;
 
//     const objId = record.ObjectId;
//     const code = record.Code;
//     const name = record.Name;
//     const parentId = record.ParentObjectId ?? null;
//     const sequenceNumber = record.SequenceNumber ?? null;
//     const obsObjectId = record.OBSObjectId ?? null;
//     const projectObjectId = record.ProjectObjectId ?? null;
//     const status = record.Status ?? null;
 
//     if (!objId || !code || !name) return null;
 
//     return {
//       ObjectId: objId !== null ? String(objId) : null,
//       Code: code !== null ? String(code) : null,
//       Name: name !== null ? String(name) : null,
//       ParentObjectId: parentId !== null ? String(parentId) : null,
//       SequenceNumber: sequenceNumber !== null ? String(sequenceNumber) : null,
//       OBSObjectId: obsObjectId !== null ? String(obsObjectId) : null,
//       ProjectObjectId: projectObjectId !== null ? String(projectObjectId) : null,
//       Status: status !== null ? String(status) : null,
//     };
//   }
 
//   // Send single WBS record to Business Central API
//   async function sendWBSRecord(record: any, token: string) {
//     const response = await fetch(
//       'https://api.businesscentral.dynamics.com/v2.0/50b7a7db-965b-4a2e-8f58-39e635bf39b5/UAT/api/alletec/primavera/v2.0/companies(f08e82f1-72e8-ef11-9345-6045bd14c5d0)/wbss',
//       {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(record),
//       }
//     );
 
//     if (!response.ok) {
//       const errorText = await response.text();
//       throw new Error(`Failed to send WBS record: ${errorText}`);
//     }
 
//     return response.json();
//   }
 
//   // Handle XML file upload and parse
//   const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;
 
//     setMessage('Parsing XML file... Please wait.');
//     setLoading(true);
 
//     // Initialize web worker
//     if (!workerRef.current) {
//       workerRef.current = new Worker(new URL('./xmlWorker.ts', import.meta.url), {
//         type: 'module',
//       });
 
//       workerRef.current.onerror = (e) => {
//         console.error('Worker error:', e.message);
//         setMessage(`Worker error: ${e.message}`);
//         setLoading(false);
//       };
//     }
 
//     // Handle parsed XML response from worker
//     workerRef.current.onmessage = async (event) => {
//       const { status, data, message: errorMsg } = event.data;
 
//       if (status === 'success') {
//         setMessage('Parsed XML. Cleaning data...');
//         const cleanedData = deepClean(data);
//         const wbsArray = Array.isArray(cleanedData) ? cleanedData : [];
 
//         if (wbsArray.length === 0) {
//           setMessage('No records found in XML.');
//           setLoading(false);
//           return;
//         }
 
//         try {
//           setMessage('Fetching access token...');
//           const token = await getAccessToken();
 
//           setMessage('Sending data to Business Central...');
//           const recordsToSend: any[] = [];
 
//           for (const rawRecord of wbsArray) {
//             const trimmedRecord = extractWBSFields(rawRecord);
//             if (!trimmedRecord) continue;
 
//             try {
//               await sendWBSRecord(trimmedRecord, token);
//               recordsToSend.push(trimmedRecord);
//             } catch (err: any) {
//               console.error(err);
//               setMessage(`Error sending record: ${err.message}`);
//               setLoading(false);
//               return;
//             }
//           }
 
//           setMessage('Data sent. Creating Excel...');
 
//           const workbook = new ExcelJS.Workbook();
//           const sheet = workbook.addWorksheet('WBS Data');
 
//           if (recordsToSend.length > 0) {
//             sheet.columns = Object.keys(recordsToSend[0]).map((key) => ({
//               header: key,
//               key,
//               width: 25,
//             }));
 
//             recordsToSend.forEach((row) => sheet.addRow(row));
//           }
 
//           const buffer = await workbook.xlsx.writeBuffer();
//           saveAs(new Blob([buffer]), 'WBS.xlsx');
//           setMessage('Excel file downloaded! All done.');
//         } catch (error: any) {
//           console.error(error);
//           setMessage('Error: ' + error.message);
//         }
//       } else {
//         setMessage('XML Parse Error: ' + errorMsg);
//       }
 
//       setLoading(false);
//     };
 
//     // Start the web worker
//     workerRef.current.postMessage(file);
//   };
 
//   return (
//     <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
//       <h1>XML to Excel & BC API Uploader</h1>
//       <input type="file" accept=".xml" onChange={handleFileUpload} />
//       {loading && <p style={{ color: 'blue' }}>Working...</p>}
//       {message && <p>{message}</p>}
//     </div>
//   );
// }
 
// export default App;
 