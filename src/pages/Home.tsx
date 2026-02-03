import React from 'react'
import { Link } from 'react-router-dom'
import './Login.css'

const Home: React.FC = () => {
  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Welcome</h2>
        <p className="hint">You are now on the home page.</p>
        <Link to="/login" style={{ display: 'inline-block', marginTop: 14 }}>Sign out</Link>
      </div>
    </div>
  )
}

export default Home
