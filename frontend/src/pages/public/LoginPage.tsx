import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { LogoMark } from '../../components/ui/Logo'
import { BRAND } from '../../config/brand'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('maya.chen@student.local')
  const [password, setPassword] = useState('••••••••••••')
  const [role, setRole] = useState<'student' | 'teacher'>('student')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (role === 'teacher') {
      navigate('/teacher/overview')
    } else {
      navigate('/student/today')
    }
  }

  return (
    <section className="section login-page" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '480px' }}>
        <Card big tone="white" style={{ border: '3px solid var(--black)', borderRadius: '20px', boxShadow: '6px 6px 0 var(--black)', padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px', display: 'grid', gap: '8px', justifyItems: 'center' }}>
            <div style={{ width: '42px', height: '42px' }}>
              <LogoMark />
            </div>
            <Badge tone="yellow">Demo Authentication</Badge>
            <h1 style={{ font: '700 1.8rem/1.2 var(--font-head)', margin: '4px 0 0' }}>Sign in to {BRAND.name}</h1>
            <p className="lead" style={{ fontSize: '0.92rem', color: '#444', margin: 0 }}>
              Enter your credentials or choose a verified demo persona below.
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'grid', gap: '16px' }}>
            <div className="field">
              <label className="field__label" htmlFor="role-select">Select Persona Role</label>
              <select
                id="role-select"
                className="field__input"
                style={{ minHeight: '44px' }}
                value={role}
                onChange={(e) => setRole(e.target.value as 'student' | 'teacher')}
              >
                <option value="student">Student Persona (Maya Chen • student-maya)</option>
                <option value="teacher">Educator Persona (Dr. Sarah Adams • prof-teacher-1)</option>
              </select>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="email-input">Email Address</label>
              <input
                id="email-input"
                type="email"
                required
                className="field__input"
                style={{ minHeight: '44px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="password-input">Password</label>
              <input
                id="password-input"
                type="password"
                required
                className="field__input"
                style={{ minHeight: '44px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" variant="action" size="lg" arrow style={{ width: '100%', marginTop: '4px' }}>
              Sign In →
            </Button>
          </form>

          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '2px solid var(--black)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#333', marginBottom: '12px' }}>
              Want to see role details and hackathon presets?
            </p>
            <Button to="/demo" variant="light" size="md" style={{ width: '100%' }}>
              Open Demo Persona Hub →
            </Button>
          </div>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.84rem', color: '#666' }}>
              New to AAROH? <Link to="/signup" style={{ color: 'var(--blue)', fontWeight: 700 }}>Create a demo profile</Link>
            </span>
          </div>
        </Card>
      </div>
    </section>
  )
}
