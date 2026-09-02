import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { getProgressionOverview } from '../services/api'

import './Progress.css'

const formatKg = (value) =>
  value == null
    ? '—'
    : `${Number(value).toLocaleString(undefined, {
        maximumFractionDigits: 1,
      })} kg`

function getWeekStart(value) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  const day = date.getDay()
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1))
  return date
}

function buildWeeklyVolume(sessions, weekCount = 8) {
  const currentWeek = getWeekStart(new Date())
  const weeks = Array.from({ length: weekCount }, (_, index) => {
    const start = new Date(currentWeek)
    start.setDate(start.getDate() - (weekCount - 1 - index) * 7)
    return { start, volume: 0, workoutIds: new Set() }
  })
  const weekByTimestamp = new Map(
    weeks.map((week) => [week.start.getTime(), week]),
  )

  sessions.forEach((session) => {
    const week = weekByTimestamp.get(getWeekStart(session.date).getTime())
    if (!week) return
    week.volume += session.total_volume || 0
    week.workoutIds.add(session.workout_id)
  })

  return weeks.map((week) => ({
    start: week.start,
    volume: week.volume,
    workouts: week.workoutIds.size,
  }))
}

function WeeklyVolumeChart({ weeks }) {
  const maxVolume = Math.max(...weeks.map((week) => week.volume), 1)

  return (
    <div className="weekly-volume-chart" role="img" aria-label="Training volume over the last eight weeks">
      {weeks.map((week) => (
        <div className="weekly-volume-column" key={week.start.toISOString()}>
          <div className="weekly-volume-value">{week.volume > 0 ? formatKg(week.volume) : '—'}</div>
          <div className="weekly-volume-bar-track">
            <div
              className="weekly-volume-bar"
              style={{ height: `${(week.volume / maxVolume) * 100}%` }}
              title={`${week.workouts} workouts · ${formatKg(week.volume)}`}
            />
          </div>
          <span>{week.start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
        </div>
      ))}
    </div>
  )
}

function TrendChart({ sessions }) {
  const data = sessions.filter(
    (session) => session.best_estimated_1rm != null,
  )

  if (data.length < 2) {
    return (
      <div className="chart-empty">
        Log at least two sessions to reveal your strength trend.
      </div>
    )
  }

  const width = 720
  const height = 240
  const inset = { top: 18, right: 18, bottom: 34, left: 48 }
  const values = data.map((session) => session.best_estimated_1rm)
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const padding = Math.max((rawMax - rawMin) * 0.2, 2)
  const min = Math.max(0, rawMin - padding)
  const max = rawMax + padding
  const x = (index) =>
    inset.left +
    (index / (data.length - 1)) * (width - inset.left - inset.right)
  const y = (value) =>
    inset.top +
    ((max - value) / (max - min)) * (height - inset.top - inset.bottom)
  const points = data
    .map((session, index) =>
      `${x(index)},${y(session.best_estimated_1rm)}`,
    )
    .join(' ')
  const areaPoints = `${inset.left},${height - inset.bottom} ${points} ${x(data.length - 1)},${height - inset.bottom}`
  const labelIndexes = [
    ...new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]),
  ]

  return (
    <div className="trend-chart-wrap">
      <svg
        className="trend-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Estimated one rep max trend from ${formatKg(values[0])} to ${formatKg(values.at(-1))}`}
      >
        {[0, 0.5, 1].map((position) => {
          const lineY =
            inset.top + position * (height - inset.top - inset.bottom)
          const label = max - position * (max - min)
          return (
            <g key={position}>
              <line className="chart-grid-line" x1={inset.left} x2={width - inset.right} y1={lineY} y2={lineY} />
              <text className="chart-axis-label" x={inset.left - 9} y={lineY + 4} textAnchor="end">{label.toFixed(0)}</text>
            </g>
          )
        })}
        <polygon className="chart-area" points={areaPoints} />
        <polyline className="chart-line" points={points} />
        {data.map((session, index) => (
          <circle key={`${session.workout_id}-${session.date}`} className={session.is_pr ? 'chart-point chart-point-pr' : 'chart-point'} cx={x(index)} cy={y(session.best_estimated_1rm)} r={session.is_pr ? 5 : 3.5}>
            <title>{`${new Date(session.date).toLocaleDateString()}: ${formatKg(session.best_estimated_1rm)}${session.is_pr ? ' (PR)' : ''}`}</title>
          </circle>
        ))}
        {labelIndexes.map((index) => (
          <text key={index} className="chart-date-label" x={x(index)} y={height - 8} textAnchor={index === 0 ? 'start' : index === data.length - 1 ? 'end' : 'middle'}>
            {new Date(data[index].date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
          </text>
        ))}
      </svg>
    </div>
  )
}

function Progress() {
  const [exercises, setExercises] = useState([])
  const [progress, setProgress] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { loadProgress() }, [])

  async function loadProgress() {
    try {
      setLoading(true)
      setError('')
      const progressionData = await getProgressionOverview()

      setExercises(progressionData)
      setProgress(progressionData)
      setSelectedId((current) => {
        if (current) return current
        const firstTracked = progressionData.find((item) =>
          item.sessions?.some((session) => session.best_estimated_1rm != null),
        )
        return String(firstTracked?.id ?? progressionData[0]?.id ?? '')
      })
    } catch (requestError) {
      console.error(requestError)
      setError('Unable to load your progress.')
    } finally {
      setLoading(false)
    }
  }

  const selected = progress.find((item) => String(item.id) === selectedId)
  const selectedSessions = selected?.sessions?.filter(
    (session) => session.best_estimated_1rm != null,
  ) || []
  const selectedVolume = selectedSessions.reduce(
    (total, session) => total + (session.total_volume || 0), 0,
  )
  const firstEstimate = selectedSessions[0]?.best_estimated_1rm
  const latestEstimate = selectedSessions.at(-1)?.best_estimated_1rm
  const trendPercentage = firstEstimate > 0 && latestEstimate != null
    ? ((latestEstimate - firstEstimate) / firstEstimate) * 100
    : null

  const allSessions = useMemo(
    () => progress.flatMap((exercise) =>
      (exercise.sessions || []).map((session) => ({
        ...session,
        exerciseName: exercise.exercise_name || exercise.name,
      })),
    ), [progress],
  )
  const weeklyVolume = useMemo(
    () => buildWeeklyVolume(allSessions),
    [allSessions],
  )
  const recordedSessions = allSessions.filter(
    (session) => session.best_estimated_1rm != null,
  )
  const totalVolume = allSessions.reduce(
    (total, session) => total + (session.total_volume || 0), 0,
  )
  const trackedExercises = progress.filter(
    (exercise) => exercise.personal_best_1rm != null,
  )
  const bestExercise = trackedExercises.reduce(
    (best, exercise) =>
      !best || exercise.personal_best_1rm > best.personal_best_1rm
        ? exercise : best, null,
  )
  const recentSessions = recordedSessions.slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6)
  const activeWeeks = weeklyVolume.filter((week) => week.workouts > 0).length
  const completedWorkouts = weeklyVolume.reduce((total, week) => total + week.workouts, 0)
  const recentVolume = weeklyVolume.reduce((total, week) => total + week.volume, 0)
  const averageWeeklyVolume = activeWeeks > 0 ? recentVolume / activeWeeks : 0

  const insight = selectedSessions.length < 2
    ? 'Log another working session to establish a meaningful strength trend.'
    : trendPercentage > 2
      ? `Estimated strength has risen ${trendPercentage.toFixed(1)}% since your first recorded session. Your current progression is positive.`
      : trendPercentage < -2
        ? `Estimated strength is ${Math.abs(trendPercentage).toFixed(1)}% below your first recorded session. Review recovery and recent training load.`
        : 'Estimated strength is holding steady. A small load or repetition increase may help create a new progression signal.'

  if (loading || error) {
    return (
      <main className="page progress-page">
        <div className="progress-state">
          {loading ? <><div className="loading-dot" /><p>Analysing your training data...</p></> : <><h2>Something went wrong</h2><p>{error}</p><button onClick={loadProgress}>Try again</button></>}
        </div>
      </main>
    )
  }

  return (
    <main className="page progress-page">
      <header className="page-header progress-header">
        <div><span className="eyebrow">PERFORMANCE</span><h1>Progress</h1><p>Track how your strength and training volume are changing over time.</p></div>
      </header>

      <section className="progress-stats">
        <article className="glass-card progress-stat"><span>TRAINING VOLUME</span><strong>{formatKg(totalVolume)}</strong><small>Total logged volume</small></article>
        <article className="glass-card progress-stat"><span>RECORDED SESSIONS</span><strong>{recordedSessions.length}</strong><small>Exercise performances</small></article>
        <article className="glass-card progress-stat"><span>TRACKED EXERCISES</span><strong>{trackedExercises.length}</strong><small>of {exercises.length} in your library</small></article>
        <article className="glass-card progress-stat highlight-stat"><span>BEST ESTIMATED 1RM</span><strong>{formatKg(bestExercise?.personal_best_1rm)}</strong><small>{bestExercise?.exercise_name || 'No data yet'}</small></article>
      </section>

      <section className="glass-card weekly-load-card">
        <div className="weekly-load-heading">
          <div><span className="eyebrow">CONSISTENCY</span><h2>Eight-week training load</h2></div>
          <div className="weekly-load-stats">
            <div><span>ACTIVE WEEKS</span><strong>{activeWeeks}/8</strong></div>
            <div><span>WORKOUTS</span><strong>{completedWorkouts}</strong></div>
            <div><span>AVG ACTIVE WEEK</span><strong>{formatKg(averageWeeklyVolume)}</strong></div>
          </div>
        </div>
        <WeeklyVolumeChart weeks={weeklyVolume} />
      </section>

      <section className="glass-card analytics-card">
        <div className="analytics-heading">
          <div><span className="eyebrow">STRENGTH ANALYTICS</span><h2>Exercise trend</h2></div>
          <label className="exercise-selector"><span>Exercise</span><select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{progress.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.exercise_name || exercise.name}</option>)}</select></label>
        </div>

        {selected ? <>
          <div className="selected-stats">
            <div><span>BEST 1RM</span><strong>{formatKg(selected.personal_best_1rm)}</strong></div>
            <div><span>TOTAL VOLUME</span><strong>{formatKg(selectedVolume)}</strong></div>
            <div><span>SESSIONS</span><strong>{selectedSessions.length}</strong></div>
            <div><span>STRENGTH TREND</span><strong className={trendPercentage > 0 ? 'positive-value' : ''}>{trendPercentage == null ? '—' : `${trendPercentage > 0 ? '+' : ''}${trendPercentage.toFixed(1)}%`}</strong></div>
          </div>
          <TrendChart sessions={selectedSessions} />
          <div className="training-insight"><span className="insight-mark">i</span><div><strong>Training insight</strong><p>{insight}</p></div></div>
        </> : <div className="chart-empty">Add an exercise to begin tracking progress.</div>}
      </section>

      <section className="progress-main-grid">
        <article className="glass-card exercise-progress-card">
          <div className="card-heading"><div><span className="eyebrow">LEADERBOARD</span><h2>Exercise progression</h2></div></div>
          {trackedExercises.length === 0 ? <div className="progress-empty"><p>Keep logging workouts to see your strength progression here.</p></div> : <div className="exercise-progress-list">{trackedExercises.slice().sort((a, b) => b.personal_best_1rm - a.personal_best_1rm).map((exercise) => (
            <Link key={exercise.id} to={`/exercises/${exercise.id}`} className="exercise-progress-row"><div className="exercise-progress-name"><strong>{exercise.exercise_name}</strong><small>{exercise.sessions?.filter((session) => session.best_estimated_1rm != null).length || 0} sessions</small></div><div className="exercise-progress-value"><strong>{formatKg(exercise.personal_best_1rm)}</strong>{exercise.improvement_percentage != null && <span className={exercise.improvement_percentage > 0 ? 'improvement-positive' : 'improvement-neutral'}>{exercise.improvement_percentage > 0 ? '+' : ''}{exercise.improvement_percentage}%</span>}</div><span className="progress-arrow">↗</span></Link>
          ))}</div>}
        </article>

        <article className="glass-card recent-card">
          <div className="card-heading"><div><span className="eyebrow">RECENT</span><h2>Latest performances</h2></div></div>
          {recentSessions.length === 0 ? <div className="progress-empty"><p>No recorded sessions yet.</p></div> : <div className="recent-list">{recentSessions.map((session, index) => (
            <div className="recent-row" key={`${session.workout_id}-${session.exerciseName}-${index}`}><div><strong>{session.exerciseName}</strong><small>{new Date(session.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} · {session.best_weight} kg × {session.best_reps}</small></div><div className="recent-value">{formatKg(session.best_estimated_1rm)}{session.is_pr && <span className="pr-badge">PR</span>}</div></div>
          ))}</div>}
        </article>
      </section>
    </main>
  )
}

export default Progress
