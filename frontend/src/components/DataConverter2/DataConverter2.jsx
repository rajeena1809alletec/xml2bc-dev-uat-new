import React, { useState } from 'react';

const DataConverter2 = () => {
  const [status, setStatus] = useState('');
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatus('File selected. Ready to process.');
  };

  const handleProcessFile = async () => {
    if (!file) {
      setStatus('Please select a file first.');
      return;
    }

    setStatus('Reading file...');

    const text = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'application/xml');

    const projectNodes = xmlDoc.getElementsByTagName('WBS');
    if (projectNodes.length === 0) {
      setStatus('No <Project> nodes found.');
      return;
    }

    const projects = Array.from(projectNodes).map((node, i) => {
      const obj = {
        objectId: parseInt(node.getElementsByTagName('ObjectId')[0]?.textContent || 0),
        wbsObjectId: parseInt(node.getElementsByTagName('Code')[0]?.textContent || 0),
        actDefCalendarObjectId: parseInt(node.getElementsByTagName('Name')[0]?.textContent || 0),
      };
      // console.log(`Project ${i}:`, obj);
      return obj;
    });

    setStatus('Fetching access token...');
    console.log("projectNodes: ",projectNodes)

    let token;
    try {
      const res = await fetch('http://localhost:3001/getToken');
      const data = await res.json();
      token = data.access_token;
    } catch (error) {
      setStatus('Failed to fetch access token.');
      return;
    }

    setStatus('Sending data to Business Central...');

    const endpoint = 'https://api.businesscentral.dynamics.com/v2.0/50b7a7db-965b-4a2e-8f58-39e635bf39b5/UAT/api/alletec/primavera/v2.0/companies(f08e82f1-72e8-ef11-9345-6045bd14c5d0)/projects';

    // try {
    //   for (const project of projects) {
    //     const response = await fetch(endpoint, {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${token}`,
    //       },
    //       body: JSON.stringify(project),
    //     });

    //     if (!response.ok) {
    //       const error = await response.text();
    //       console.error('Error:', error);
    //       setStatus(`Failed to send project with objectId ${project.objectId}`);
    //       return;
    //     }
    //   }
    //   setStatus('All projects sent successfully!');
    // } catch (error) {
    //   console.error('Submission Error:', error);
    //   setStatus('Error sending data to Business Central.');
    // }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Upload XML File</h2>
      <input type="file" onChange={handleFileChange} />
      <button
        onClick={handleProcessFile}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Send to Business Central
      </button>
      <p className="mt-4">{status}</p>
    </div>
  );
};

export default DataConverter2;
