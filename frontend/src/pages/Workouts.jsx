import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getWorkouts } from '../services/api'
import './Workouts.css'

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatVolume(value) {
  return `${Math.round(value).toLocaleString('en-GB')} kg`
}

function formatDuration(minutes) {
  if (minutes == null) return null
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`
}

function getWorkoutMetrics(workout) {
  const sets = workout.exercises?.flatMap((exercise) => exercise.sets || []) || []
  const completedSets = sets.filter(
    (set) => Number(set.weight) > 0 && Number(set.reps) > 0,
  )
  const volume = completedSets.reduce(
    (total, set) => total + Number(set.weight) * Number(set.reps),
    0,
  )
  const duration = workout.completed_at
    ? Math.max(
        1,
        Math.round(
          (new Date(workout.completed_at) - new Date(workout.started_at)) / 60000,
        ),
      )
    : null

  return {
    totalSets: sets.length,
    completedSets: completedSets.length,
    volume,
    duration,
  }
}

function WorkoutCard({ workout }) {
  const exerciseCount = workout.exercises?.length ?? 0
  const metrics = getWorkoutMetrics(workout)

  return (
    <Link to={`/workouts/${workout.id}`} className="workout-card">
      <div className="workout-card-main">
        <div>
          <span className="eyebrow">WORKOUT</span>
          <h2>{workout.name}</h2>
        </div>

        <div className="workout-card-status">
          <span className={workout.completed_at ? 'status-pill status-completed' : 'status-pill'}>
            {workout.completed_at ? 'COMPLETED' : 'IN PROGRESS'}
          </span>
          <span className="workout-arrow" aria-hidden="true">→</span>
        </div>
      </div>

      <div className="workout-card-meta">
        <span>{formatDate(workout.started_at)}</span>
        <span className="meta-separator">·</span>
        <span>{exerciseCount} exercises</span>
        <span className="meta-separator">·</span>
        <span>{metrics.completedSets}/{metrics.totalSets} sets logged</span>
        {metrics.volume > 0 && (
          <><span className="meta-separator">·</span><span>{formatVolume(metrics.volume)} volume</span></>
        )}
        {metrics.duration != null && (
          <><span className="meta-separator">·</span><span>{formatDuration(metrics.duration)}</span></>
        )}
        {workout.body_weight != null && (
          <><span className="meta-separator">·</span><span>{workout.body_weight} kg body weight</span></>
        )}
      </div>
    </Link>
  )
}

function Workouts() {
  const location = useLocation()
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const workoutMetrics = workouts.map(getWorkoutMetrics)
  const completedWorkoutCount = workouts.filter((workout) => workout.completed_at).length
  const totalCompletedSets = workoutMetrics.reduce(
    (total, metrics) => total + metrics.completedSets,
    0,
  )
  const totalVolume = workoutMetrics.reduce(
    (total, metrics) => total + metrics.volume,
    0,
  )
  const totalDuration = workoutMetrics.reduce(
    (total, metrics) => total + (metrics.duration || 0),
    0,
  )

  useEffect(() => {
    async function loadWorkouts() {
      try {
        setWorkouts(await getWorkouts())
      } catch (err) {
        console.error(err)
        setError('Unable to load your workouts.')
      } finally {
        setLoading(false)
      }
    }

    loadWorkouts()
  }, [])

  return (
    <main className="page workouts-page">
      {location.state?.completedWorkout && (
        <div className="completion-banner" role="status">
          <span>✓</span>
          <p><strong>{location.state.completedWorkout}</strong> completed and added to your training history.</p>
        </div>
      )}
      <div className="page-header">
        <div>
          <span className="eyebrow">TRAINING LOG</span>
          <h1>Workouts</h1>
          <p>Review your training history and track your progress.</p>
        </div>

        <Link to="/workouts/new" className="primary-button">
          + Start Workout
        </Link>
      </div>

      {!loading && !error && workouts.length > 0 && (
        <section className="training-log-summary" aria-label="Training log summary">
          <article><span>COMPLETED</span><strong>{completedWorkoutCount}</strong><small>sessions</small></article>
          <article><span>WORKING SETS</span><strong>{totalCompletedSets}</strong><small>recorded</small></article>
          <article><span>TOTAL VOLUME</span><strong>{formatVolume(totalVolume)}</strong><small>logged load</small></article>
          <article><span>TRAINING TIME</span><strong>{formatDuration(totalDuration) || '—'}</strong><small>completed sessions</small></article>
        </section>
      )}

      <section className="workouts-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">HISTORY</span>
            <h2>Recent workouts</h2>
          </div>

          {!loading && !error && (
            <span className="workout-count">
              {workouts.length} {workouts.length === 1 ? 'session' : 'sessions'}
            </span>
          )}
        </div>

        {loading && (
          <div className="empty-state">
            <span className="loading-dot" />
            <p>Loading your workouts...</p>
          </div>
        )}

        {error && (
          <div className="empty-state error-state">
            <p>{error}</p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && workouts.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">+</span>
            <h3>No workouts yet</h3>
            <p>
              Start your first workout and your training history will appear
              here.
            </p>
            <Link to="/workouts/new" className="primary-button">
              Start Workout
            </Link>
          </div>
        )}

        {!loading && !error && workouts.length > 0 && (
          <div className="workout-list">
            {workouts.map((workout) => (
              <WorkoutCard key={workout.id} workout={workout} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default Workouts
