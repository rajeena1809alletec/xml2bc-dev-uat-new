import React, { useState } from 'react';

const ResourceDataConverter = () => {
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

        const resourceNodes = xmlDoc.getElementsByTagName('Resource');
        if (resourceNodes.length === 0) {
            setStatus('No <Resource> nodes found.');
            return;
        }

        const parseBool = (val) => val === '1';
        const parseFloatOrNull = (val) => val ? parseFloat(val) : null;
        const parseIntOrNull = (val) => val ? parseInt(val) : null;


        const resources = Array.from(resourceNodes).map((node, i) => {
            const obj = {
                objectId: parseIntOrNull(node.getElementsByTagName('ObjectId')[0]?.textContent),
                autoComputeActuals: parseBool(node.getElementsByTagName('AutoComputeActuals')[0]?.textContent),
                calculateCostFromUnits: parseBool(node.getElementsByTagName('CalculateCostFromUnits')[0]?.textContent),
                calendarObjectId: parseIntOrNull(node.getElementsByTagName('CalendarObjectId')[0]?.textContent),
                currencyObjectId: parseIntOrNull(node.getElementsByTagName('CurrencyObjectId')[0]?.textContent),
                defaultUnitsPerTime: parseFloatOrNull(node.getElementsByTagName('DefaultUnitsPerTime')[0]?.textContent),
                emailAddress: node.getElementsByTagName('EmailAddress')[0]?.textContent || null,
                employeeId: node.getElementsByTagName('EmployeeId')[0]?.textContent || null,
                guid: node.getElementsByTagName('GUID')[0]?.textContent || null,
                id: node.getElementsByTagName('Id')[0]?.textContent || null,
                isActive: parseBool(node.getElementsByTagName('IsActive')[0]?.textContent),
                isOverTimeAllowed: parseBool(node.getElementsByTagName('IsOverTimeAllowed')[0]?.textContent),
                name: node.getElementsByTagName('Name')[0]?.textContent || null,
                officePhone: node.getElementsByTagName('OfficePhone')[0]?.textContent || null,
                otherPhone: node.getElementsByTagName('OtherPhone')[0]?.textContent || null,
                overtimeFactor: parseFloatOrNull(node.getElementsByTagName('OvertimeFactor')[0]?.textContent),
                parentObjectId: parseIntOrNull(node.getElementsByTagName('ParentObjectId')[0]?.textContent),
                primaryRoleObjectId: parseIntOrNull(node.getElementsByTagName('PrimaryRoleObjectId')[0]?.textContent),
                resourceNotes: node.getElementsByTagName('ResourceNotes')[0]?.textContent || null,
                resourceType: node.getElementsByTagName('ResourceType')[0]?.textContent || null,
                sequenceNumber: parseIntOrNull(node.getElementsByTagName('SequenceNumber')[0]?.textContent),
                shiftObjectId: parseIntOrNull(node.getElementsByTagName('ShiftObjectId')[0]?.textContent),
                timesheetApprMngrObjectId: parseIntOrNull(node.getElementsByTagName('TimesheetApprovalManagerObjectId')[0]?.textContent),
                title: node.getElementsByTagName('Title')[0]?.textContent || null,
                unitOfMeasureObjectId: parseIntOrNull(node.getElementsByTagName('UnitOfMeasureObjectId')[0]?.textContent),
                uploadDate: new Date().toISOString().split('T')[0],  // Current date as YYYY-MM-DD
                useTimesheets: parseBool(node.getElementsByTagName('UseTimesheets')[0]?.textContent),
                userObjectId: parseIntOrNull(node.getElementsByTagName('UserObjectId')[0]?.textContent),
            };
            // console.log(`Project ${i}:`, obj);
            return obj;
        });

        setStatus('Fetching access token...');
        // console.log("resourceNodes: ", resourceNodes)

        let token;
        try {
            const res = await fetch('https://xml-data-extraction-backend.onrender.com/getToken');
            const data = await res.json();
            token = data.access_token;
            // console.log("token:  ", token)
        } catch (error) {
            setStatus('Failed to fetch access token.');
            return;
        }

        setStatus('Sending data to Business Central...');

        const endpoint = 'https://api.businesscentral.dynamics.com/v2.0/50b7a7db-965b-4a2e-8f58-39e635bf39b5/UAT/api/alletec/primavera/v2.0/companies(f08e82f1-72e8-ef11-9345-6045bd14c5d0)/resources';

        try {
          for (const resource of resources) {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify(resource),
            });

            if (!response.ok) {
              const error = await response.text();
              console.error('Error:', error);
              setStatus(`Failed to send resource with objectId ${resource.objectId}`);
              return;
            }
          }
          setStatus('All resources sent successfully!');
        } catch (error) {
          console.error('Submission Error:', error);
          setStatus('Error sending data to Business Central.');
        }
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

export default ResourceDataConverter;
