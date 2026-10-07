import Card from '../ui/Card'
import Badge from '../ui/Badge'

interface Props {
  actionText?: string
  evidenceText?: string
  signalText?: string
}

export default function ActionEvidenceSignalFlow({
  actionText = 'Saved attempt after error & asked mentor',
  evidenceText = 'Perseverance rule PE-01 satisfied (continued after difficulty)',
  signalText = 'Perseverance: Improving trend based on 4 recent events',
}: Props) {
  return (
    <Card tone="softYellow" className="flow-explainer-card">
      <div className="flow-explainer__header">
        <Badge tone="yellow">How AAROH Derives Development</Badge>
        <h4>Action → Evidence → Development Signal Pipeline</h4>
      </div>

      <div className="flow-diagram">
        {/* Step 1 */}
        <div className="flow-step flow-step--action">
          <div className="flow-step__tag">Step 1 • Observable Action</div>
          <div className="flow-step__content">
            <span className="flow-step__icon">⚡</span>
            <div>
              <strong>Student Behavior</strong>
              <p>{actionText}</p>
            </div>
          </div>
        </div>

        <div className="flow-arrow">→</div>

        {/* Step 2 */}
        <div className="flow-step flow-step--evidence">
          <div className="flow-step__tag">Step 2 • Evidence Engine</div>
          <div className="flow-step__content">
            <span className="flow-step__icon">🔍</span>
            <div>
              <strong>Verified Evidence</strong>
              <p>{evidenceText}</p>
            </div>
          </div>
        </div>

        <div className="flow-arrow">→</div>

        {/* Step 3 */}
        <div className="flow-step flow-step--signal">
          <div className="flow-step__tag">Step 3 • Growth Signal</div>
          <div className="flow-step__content">
            <span className="flow-step__icon">🌱</span>
            <div>
              <strong>Development Signal</strong>
              <p>{signalText}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
