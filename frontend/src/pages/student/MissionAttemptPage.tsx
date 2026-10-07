import { useState } from 'react'
import { useParams } from 'react-router-dom'
import BackLink from '../../components/layout/BackLink'
import AsyncView from '../../components/layout/AsyncView'
import NotFoundState from '../../components/layout/NotFoundState'
import PageHeader from '../../components/layout/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import TextArea from '../../components/ui/TextArea'
import { studentRoutes } from '../../config/routes'
import { actionMessage } from '../../lib/errors'
import { missionService } from '../../services/missionService'
import { useMissionData } from './studentData'

export default function MissionAttemptPage() {
  const { missionId = '' } = useParams()
  const state = useMissionData(missionId)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  async function record() {
    setSaving(true)
    setError(undefined)
    try {
      await missionService.recordAttempt(missionId, note)
      state.reload()
    } catch (err) {
      setError(actionMessage(err, 'We could not record this action. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AsyncView state={state} loadingLabel="Loading your mission…">
      {(data) => {
        if (!data) {
          return (
            <NotFoundState
              title="We couldn't find that mission"
              message="There is nothing to record here."
              backTo={studentRoutes.missions}
              backLabel="Back to Missions"
            />
          )
        }
        const { mission, attempts } = data
        const done = mission.status === 'completed'

        return (
          <>
            <BackLink to={studentRoutes.mission(mission.id)}>Back to mission</BackLink>
            <PageHeader title="Record your action" description={mission.title} />

            <div className="mission-attempt">
              {mission.action && (
                <Card tone="softOrange">
                  <Badge tone="orange">The small action</Badge>
                  <p className="mission-detail__action">{mission.action}</p>
                </Card>
              )}

              {done ? (
                <Card tone="success" big>
                  <Badge tone="success">✓ Action recorded</Badge>
                  {attempts[0] && <p className="mission-attempt__note">{attempts[0].note}</p>}
                  <p>This has been added to your evidence. It is a record of what you did, nothing more.</p>
                  <div className="reflection__links">
                    <Button to={studentRoutes.growthEvidence} variant="action" arrow>See your evidence</Button>
                    <Button to={studentRoutes.missions} variant="light">Back to Missions</Button>
                  </div>
                </Card>
              ) : (
                <Card big>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      void record()
                    }}
                  >
                    <TextArea
                      id="mission-note"
                      label="What did you do?"
                      hint="A sentence or two is enough. Be specific about what you actually tried."
                      value={note}
                      onChange={setNote}
                      rows={5}
                    />
                    <div className="mission-attempt__actions">
                      <Button type="submit" variant="action" disabled={saving || note.trim().length === 0}>
                        {saving ? 'Recording…' : 'Record this action'}
                      </Button>
                    </div>
                    {error && <p role="alert" className="attempt__error">{error}</p>}
                  </form>
                </Card>
              )}
            </div>
          </>
        )
      }}
    </AsyncView>
  )
}
