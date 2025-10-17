import React, { useState } from 'react';
import Papa from 'papaparse';
import { api } from '../services/api';

export default function AdminImport(){
  const [file, setFile] = useState(null);
  const [log, setLog] = useState([]);

  async function handleImportStudents() {
    if (!file) return alert('Choose a CSV first');
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const rows = results.data;
        let success = 0;
        for (const r of rows) {
          try {
            // call backend create student (you must implement POST /api/students if desired)
            await api.post('/students', r);
            success++;
          } catch (e) {
            setLog(prev => [...prev, `Err for ${r.student_id}: ${e.message}`]);
          }
        }
        alert(`Imported ${success}/${rows.length} students (server attempts)`);
      }
    });
  }

  return (
    <div className="container">
      <h1>Admin — CSV Import (students)</h1>
      <p className="small">Upload CSV with columns: student_id,name,email,program,year</p>
      <div className="form-row">
        <input type="file" accept=".csv" onChange={e=>setFile(e.target.files[0])} />
      </div>
      <div className="form-row">
        <button onClick={handleImportStudents}>Import Students</button>
      </div>

      {log.length > 0 && <div style={{marginTop:12}}>
        <h3>Log</h3>
        <pre style={{maxHeight:200, overflow:'auto'}}>{log.join('\n')}</pre>
      </div>}
    </div>
  );
}
