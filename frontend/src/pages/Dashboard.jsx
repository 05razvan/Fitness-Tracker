import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  getExerciseProgression,
  getExerciseRecommendation,
  getExercises,
  getWorkouts,
} from '../services/api'

import './Dashboard.css'

const formatKg = (value) =>
  value == null
    ? '—'
    : `${Number(value).toLocaleString(undefined, {
        maximumFractionDigits: 1,
      })} kg`

function MiniTrendChart({ sessions }) {
  const data = sessions
    .filter((session) => session.best_estimated_1rm != null)
    .slice(-8)

  if (data.length < 2) {
    return (
      <div className="dashboard-chart-empty">
        Log at least two sessions for this exercise to reveal its trend.
      </div>
    )
  }

  const width = 820
  const height = 180
  const inset = 14
  const values = data.map((session) => session.best_estimated_1rm)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const range = Math.max(maxValue - minValue, 4)
  const min = Math.max(0, minValue - range * 0.2)
  const max = maxValue + range * 0.2
  const x = (index) => inset + (index / (data.length - 1)) * (width - inset * 2)
  const y = (value) => inset + ((max - value) / (max - min)) * (height - inset * 2 - 24)
  const points = data.map((session, index) => `${x(index)},${y(session.best_estimated_1rm)}`).join(' ')
  const area = `${inset},${height - 24} ${points} ${width - inset},${height - 24}`

  return (
    <svg className="dashboard-trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Estimated one rep max trend from ${formatKg(values[0])} to ${formatKg(values.at(-1))}`}>
      <line className="dashboard-chart-grid" x1={inset} x2={width - inset} y1={height - 24} y2={height - 24} />
      <polygon className="dashboard-chart-area" points={area} />
      <polyline className="dashboard-chart-line" points={points} />
      {data.map((session, index) => (
        <circle key={`${session.workout_id}-${session.date}`} className={session.is_pr ? 'dashboard-chart-point dashboard-chart-pr' : 'dashboard-chart-point'} cx={x(index)} cy={y(session.best_estimated_1rm)} r={session.is_pr ? 5 : 3.5}>
          <title>{`${new Date(session.date).toLocaleDateString()}: ${formatKg(session.best_estimated_1rm)}${session.is_pr ? ' (PR)' : ''}`}</title>
        </circle>
      ))}
      <text className="dashboard-chart-date" x={inset} y={height - 5}>{new Date(data[0].date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</text>
      <text className="dashboard-chart-date" x={width - inset} y={height - 5} textAnchor="end">{new Date(data.at(-1).date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</text>
    </svg>
  )
}

function Dashboard() {
  const [workouts, setWorkouts] = useState([])
  const [progressions, setProgressions] = useState([])
  const [recommendation, setRecommendation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { loadDashboard() }, [])

  async function loadDashboard() {
    try {
      setLoading(true)
      setError('')
      const [workoutData, exerciseData] = await Promise.all([
        getWorkouts(),
        getExercises(),
      ])
      setWorkouts(workoutData)

      const trainedIds = new Set(
        workoutData.flatMap((workout) =>
          (workout.exercises || []).map((exercise) => exercise.exercise_id),
        ),
      )
      const trainedExercises = exerciseData.filter((exercise) => trainedIds.has(exercise.id))
      const progressionData = (await Promise.all(
        trainedExercises.map(async (exercise) => {
          try {
            return { ...exercise, ...(await getExerciseProgression(exercise.id)) }
          } catch (requestError) {
            console.error(`Unable to load dashboard progression for exercise ${exercise.id}`, requestError)
            return null
          }
        }),
      )).filter(Boolean)
      setProgressions(progressionData)

      const latestProgression = progressionData
        .filter((item) => item.sessions?.some((session) => session.best_estimated_1rm != null))
        .sort((a, b) => new Date(b.sessions.at(-1).date) - new Date(a.sessions.at(-1).date))[0]

      if (latestProgression) {
        try {
          setRecommendation(await getExerciseRecommendation(latestProgression.exercise_id))
        } catch (requestError) {
          console.error('Unable to load dashboard recommendation', requestError)
          setRecommendation(null)
        }
      } else {
        setRecommendation(null)
      }
    } catch (requestError) {
      console.error('Failed to load dashboard:', requestError)
      setError('Unable to load your training overview.')
    } finally {
      setLoading(false)
    }
  }

  const completedWorkouts = workouts.filter((workout) => workout.completed_at)
  const activeWorkouts = workouts.filter((workout) => !workout.completed_at)
  const recentWorkouts = workouts.slice(0, 5)
  const totalVolume = workouts.reduce(
    (workoutTotal, workout) => workoutTotal + (workout.exercises || []).reduce(
      (exerciseTotal, exercise) => exerciseTotal + (exercise.sets || []).reduce(
        (setTotal, set) => setTotal + ((set.weight || 0) * (set.reps || 0)), 0,
      ), 0,
    ), 0,
  )
  const strongestExercise = progressions.reduce(
    (best, item) => item.personal_best_1rm != null && (!best || item.personal_best_1rm > best.personal_best_1rm) ? item : best,
    null,
  )
  const featuredProgression = recommendation
    ? progressions.find((item) => item.exercise_id === recommendation.exercise_id)
    : progressions[0]
  const featuredSessions = featuredProgression?.sessions?.filter((session) => session.best_estimated_1rm != null) || []
  const firstStrength = featuredSessions[0]?.best_estimated_1rm
  const latestStrength = featuredSessions.at(-1)?.best_estimated_1rm
  const strengthChange = firstStrength > 0 && latestStrength != null
    ? ((latestStrength - firstStrength) / firstStrength) * 100
    : null

  if (loading) {
    return <div className="dashboard-loading"><span className="loading-dot" />Loading intelligence...</div>
  }

  if (error) {
    return (
      <div className="dashboard-loading dashboard-error">
        <p>{error}</p>
        <button type="button" onClick={loadDashboard}>Try again</button>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div><span className="eyebrow">OVERVIEW</span><h1>Your training, <span>adapted.</span></h1><p>Track performance, understand progression and train with data-driven recommendations.</p></div>
        <Link to="/workouts/new" className="primary-button">+ Start Workout</Link>
      </header>

      <section className="stats-grid" aria-label="Training statistics">
        <article className="stat-card"><span className="stat-label">COMPLETED WORKOUTS</span><strong>{completedWorkouts.length}</strong><span className="stat-description">{activeWorkouts.length} currently in progress</span></article>
        <article className="stat-card highlighted"><span className="stat-label">BEST ESTIMATED 1RM</span><strong>{formatKg(strongestExercise?.personal_best_1rm)}</strong><span className="stat-description">{strongestExercise?.exercise_name || 'No strength data yet'}</span></article>
        <article className="stat-card"><span className="stat-label">TRAINING VOLUME</span><strong>{formatKg(totalVolume)}</strong><span className="stat-description">Across all logged sets</span></article>
        <article className="stat-card"><span className="stat-label">TRACKED EXERCISES</span><strong>{progressions.filter((item) => item.personal_best_1rm != null).length}</strong><span className="stat-description">With recorded performance</span></article>
      </section>

      <section className="dashboard-grid">
        <article className="glass-card recent-card">
          <div className="card-header"><div><span className="eyebrow">TRAINING LOG</span><h2>Recent workouts</h2></div><Link to="/workouts" className="ghost-button">View all</Link></div>
          {recentWorkouts.length === 0 ? <div className="empty-state"><span className="empty-icon">◈</span><h3>No workouts yet</h3><p>Start your first workout to begin building your performance history.</p></div> : (
            <div className="workout-list">{recentWorkouts.map((workout) => (
              <Link to={`/workouts/${workout.id}`} className="workout-row" key={workout.id}><div className="workout-icon">◈</div><div className="workout-info"><strong>{workout.name || 'Workout'}</strong><span>{new Date(workout.started_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} · {workout.exercises?.length || 0} exercises</span></div><div className={workout.completed_at ? 'workout-status workout-completed' : 'workout-status'}>{workout.completed_at ? 'COMPLETED' : 'IN PROGRESS'}</div></Link>
            ))}</div>
          )}
        </article>

        <article className="glass-card intelligence-card">
          <div className="card-header"><div><span className="eyebrow">RULE-BASED INTELLIGENCE</span><h2>Next session</h2></div><div className="intelligence-indicator"><span /></div></div>
          <div className="recommendation-content">
            <span className="recommendation-label">{recommendation?.exercise_name?.toUpperCase() || 'AWAITING TRAINING DATA'}</span>
            <h3>{recommendation?.recommendation || 'Keep building your performance history.'}</h3>
            <p>{recommendation?.reason || 'Log a working set to generate your next progression target.'}</p>
            {recommendation?.recommended_weight != null && <div className="recommendation-value"><span>{recommendation.target_sets} sets · {recommendation.target_reps_min}–{recommendation.target_reps_max} reps</span><strong>{formatKg(recommendation.recommended_weight)}</strong></div>}
          </div>
        </article>
      </section>

      <section className="progression-card glass-card">
        <div className="card-header"><div><span className="eyebrow">PERFORMANCE</span><h2>Latest strength trend</h2></div>{featuredProgression && <Link to={`/exercises/${featuredProgression.exercise_id}`} className="card-meta">{featuredProgression.exercise_name.toUpperCase()} ↗</Link>}</div>
        <MiniTrendChart sessions={featuredSessions} />
        <div className="dashboard-chart-footer"><span>{featuredSessions.length} recorded sessions</span><strong className={strengthChange > 0 ? 'trend-positive' : ''}>{strengthChange == null ? 'Trend pending' : `${strengthChange > 0 ? '+' : ''}${strengthChange.toFixed(1)}% since first session`}</strong></div>
      </section>
    </div>
  )
}

export default Dashboard
