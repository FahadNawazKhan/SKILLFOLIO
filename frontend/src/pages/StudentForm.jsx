import React from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../services/api';

export default function StudentForm(){
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data) => {
    try {
      // ensure date is ISO
      if (data.date) data.date = new Date(data.date).toISOString();
      const res = await api.post('/activities', data);
      alert('Activity submitted and is now pending review.');
      reset();
    } catch (err) {
      console.error(err);
      alert('Submission failed: ' + (err.response?.data?.error || err.message));
    }
  }

  return (
    <div className="container">
      <h1>Submit Activity</h1>
      <p className="small">Create a demo activity. Use a student_id from the imported CSV (e.g., 2025CS001)</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-row">
          <label className="small">Student ID</label>
          <input {...register('student_id', { required:true })} placeholder="e.g. 2025CS001" />
        </div>
        <div className="form-row">
          <label className="small">Activity Title</label>
          <input {...register('title', { required:true })} placeholder="Internship at ACME" />
        </div>
        <div className="form-row" style={{display:'flex', gap:12}}>
          <div style={{flex:1}}>
            <label className="small">Date</label>
            <input type="date" {...register('date', { required:true })} />
          </div>
          <div style={{width:120}}>
            <label className="small">Hours</label>
            <input type="number" {...register('hours')} placeholder="e.g. 40" />
          </div>
        </div>
        <div className="form-row">
          <label className="small">Type</label>
          <select {...register('type')}>
            <option value="internship">Internship</option>
            <option value="club">Club role</option>
            <option value="certificate">Certificate</option>
            <option value="volunteer">Volunteer</option>
            <option value="project">Project</option>
          </select>
        </div>

        <div className="form-row">
          <label className="small">Description</label>
          <textarea {...register('description')} rows={4} />
        </div>

        <div className="form-row">
          <label className="small">Evidence URL</label>
          <input {...register('evidence_url')} placeholder="https://drive.google.com/..." />
        </div>

        <button type="submit">Submit Activity</button>
      </form>
    </div>
  );
}
