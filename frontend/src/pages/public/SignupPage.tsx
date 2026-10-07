import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { LogoMark } from '../../components/ui/Logo'
import { BRAND } from '../../config/brand'

export default function SignupPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const [grade, setGrade] = useState('Grade 10 • Algebra & Applied Modeling')

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    if (role === 'teacher') {
      navigate('/teacher/overview')
    } else {
      navigate('/student/today')
    }
  }

  return (
    <section className="section signup-page" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '520px' }}>
        <Card big tone="white" style={{ border: '3px solid var(--black)', borderRadius: '20px', boxShadow: '6px 6px 0 var(--black)', padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px', display: 'grid', gap: '8px', justifyItems: 'center' }}>
            <div style={{ width: '42px', height: '42px' }}>
              <LogoMark />
            </div>
            <Badge tone="yellow">Demo Profile Setup</Badge>
            <h1 style={{ font: '700 1.8rem/1.2 var(--font-head)', margin: '4px 0 0' }}>Join {BRAND.name}</h1>
            <p className="lead" style={{ fontSize: '0.92rem', color: '#444', margin: 0 }}>
              Set up your perspective to experience the human-development layer.
            </p>
          </div>

          <form onSubmit={handleSignup} style={{ display: 'grid', gap: '16px' }}>
            <div className="field">
              <label className="field__label" htmlFor="name-input">Full Name</label>
              <input
                id="name-input"
                type="text"
                required
                placeholder="e.g. Maya Chen"
                className="field__input"
                style={{ minHeight: '44px' }}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="email-input">Email Address</label>
              <input
                id="email-input"
                type="email"
                required
                placeholder="e.g. maya@student.dtu.ac.in"
                className="field__input"
                style={{ minHeight: '44px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="role-select">Your Role</label>
              <select
                id="role-select"
                className="field__input"
                style={{ minHeight: '44px' }}
                value={role}
                onChange={(e) => setRole(e.target.value as 'student' | 'teacher')}
              >
                <option value="student">Student (Focus on Academic Work & Growth)</option>
                <option value="teacher">Educator / Teacher (Focus on Qualitative Insights)</option>
              </select>
            </div>

            {role === 'student' && (
              <div className="field">
                <label className="field__label" htmlFor="grade-input">Academic Subject / Cohort</label>
                <input
                  id="grade-input"
                  type="text"
                  className="field__input"
                  style={{ minHeight: '44px' }}
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                />
              </div>
            )}

            <Button type="submit" variant="action" size="lg" arrow style={{ width: '100%', marginTop: '8px' }}>
              Launch Experience with Verified Demo Data →
            </Button>
          </form>

          <div style={{ marginTop: '20px', padding: '12px', background: 'var(--soft-yellow)', border: '1.5px solid var(--black)', borderRadius: '10px' }}>
            <p style={{ fontSize: '0.82rem', margin: 0, color: '#222', lineHeight: 1.4 }}>
              <strong>Hackathon Note:</strong> For the Vivekananda Innovation Hackathon prototype, this will initialize your active session using the verified seeded demo environment.
            </p>
          </div>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.84rem', color: '#666' }}>
              Already have an account? <Link to="/login" style={{ color: 'var(--blue)', fontWeight: 700 }}>Sign in</Link> or{' '}
              <Link to="/demo" style={{ color: 'var(--black)', fontWeight: 700, textDecoration: 'underline' }}>Explore Demo Hub</Link>
            </span>
          </div>
        </Card>
      </div>
    </section>
  )
}
