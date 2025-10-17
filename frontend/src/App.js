import React from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import StudentForm from './pages/StudentForm';
import ModeratorDashboard from './pages/ModeratorDashboard';
import VerificationPage from './pages/VerificationPage';
import AdminImport from './pages/AdminImport';

export default function App(){
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<StudentForm />} />
        <Route path="/moderator" element={<ModeratorDashboard />} />
        <Route path="/verify" element={<VerificationPage />} />
        <Route path="/admin" element={<AdminImport />} />
      </Routes>
    </>
  )
}
