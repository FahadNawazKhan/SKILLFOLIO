import React from 'react';
import { Link } from 'react-router-dom';

export default function NavBar(){
  return (
    <header className="nav" style={{background:'#fff', borderBottom:'1px solid #eee'}}>
      <div style={{display:'flex', alignItems:'center', gap:12, paddingLeft:12}}>
        <div className="code">Skillfolio</div>
        <nav style={{display:'flex', alignItems:'center'}}>
          <Link className="link" to="/">Submit</Link>
          <Link className="link" to="/moderator">Moderator</Link>
          <Link className="link" to="/admin">Admin (Import)</Link>
          <Link className="link" to="/verify">Verify</Link>
        </nav>
      </div>
      <div style={{paddingRight:12}} className="small">Demo mode</div>
    </header>
  );
}
