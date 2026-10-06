import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import AsyncView from '../../components/layout/AsyncView'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import EvidenceFeed from '../../components/teacher/EvidenceFeed'
import EvidenceFilters from '../../components/teacher/EvidenceFilters'
import { buildFeed, filterFeed, type FeedFilters } from '../../lib/teacher'
import { useEvidenceFeedData, type EvidenceFeedData } from './teacherData'

function EvidenceView({ data }: { data: EvidenceFeedData }) {
  const [params, setParams] = useSearchParams()
  const student = params.get('student') ?? ''
  const activity = params.get('activity') ?? ''
  const dimension = params.get('dimension') ?? ''
  const type = params.get('type') ?? ''
  const filters = useMemo<FeedFilters>(
    () => ({ student, activity, dimension, type }),
    [student, activity, dimension, type],
  )

  const all = useMemo(
    () => buildFeed(data.events, data.observations, data.signals),
    [data.events, data.observations, data.signals],
  )
  const items = useMemo(() => filterFeed(all, filters, data.activityByTask), [all, filters, data.activityByTask])

  function change(next: FeedFilters) {
    const out = new URLSearchParams()
    for (const [key, value] of Object.entries(next)) if (value) out.set(key, value)
    setParams(out)
  }

  return (
    <>
      <EvidenceFilters filters={filters} onChange={change} students={data.students} activities={data.activities} />
      <p role="status" className="note tasks__count">
        Showing {items.length} of {all.length} items
      </p>
      <Card big>
        <EvidenceFeed
          key={JSON.stringify(filters)}
          items={items}
          studentNames={data.studentNames}
          taskTitles={data.taskTitles}
          emptyText="No evidence matches these filters. Try removing one."
        />
      </Card>
    </>
  )
}

export default function EvidencePage() {
  const state = useEvidenceFeedData()

  return (
    <>
      <PageHeader
        title="Evidence"
        description="Observable actions and your own observations, with who, what, when and which task. Evidence is a record of what happened. Signals are interpretations supported by it."
      />
      <AsyncView state={state} loadingLabel="Loading evidence…">
        {(data) => <EvidenceView data={data} />}
      </AsyncView>
    </>
  )
}
