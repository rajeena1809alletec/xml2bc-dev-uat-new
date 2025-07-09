import React, { useState } from 'react'
import * as XLSX from 'xlsx';

const DataConverter = () => {
    const [file, setFile] = useState(null);
    const [dlink, setDlink] = useState(null);
    const [processing, setProcessing] = useState(false);

    const fileChangeHandler = (e) => {
        setFile(e.target.files[0]);
        setDlink(null);
    }

    const processFile = () => {
        if (!file) {
            alert('Please select an XML file first');
            return;
        }

        setProcessing(true);

        const reader = new FileReader();

        reader.onload = function (event) {
            const xmlText = event.target.result;

            const parser = new DOMParser();

            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

            const wbsTags = xmlDoc.getElementsByTagName('ResourceAssignment');

            const data = [];

            for (let i = 0; i < 5000; i++) {
                const wbs = wbsTags[i];
                const row = {};

                for (let j = 0; j < wbs.children.length; j++) {
                    const child = wbs.children[j];
                    row[child.tagName] = child.textContent.trim();

                    // const tagName = child.tagName;
                    // const serialized = new XMLSerializer().serializeToString(child);
                    // row[child.tagName] = serialized;
                }
                data.push(row);
            }

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(wb, ws, 'Activity Data');

            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' })
            const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });

            const url = URL.createObjectURL(blob);

            setDlink(url);
            setProcessing(false);
        }

        reader.readAsText(file);
    }

    const s2ab = (s) =>{
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);

        for(let i=0; i<s.length; i++){
            view[i] = s.charCodeAt(i) & 0xff;
        }
        return buf;

    }


    return (
        <div className="p-4">
      <h2 className="text-xl mb-4 font-semibold">Extract & Export WBS Tags</h2>
      <input type="file" onChange={fileChangeHandler} className="mb-4" />
      <br />
      <button
        onClick={processFile}
        disabled={processing}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {processing ? 'Processing...' : 'Process XML and Export Excel'}
      </button>

      {dlink && (
        <a
          href={dlink}
          download="resourceAssignment_data.xlsx"
          className="block mt-4 text-green-600 underline"
        >
          Download Excel File
        </a>
      )}
    </div>
    )
}

export default DataConverter