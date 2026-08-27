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

function WorkoutCard({ workout }) {
  const exerciseCount = workout.exercises?.length ?? 0

  const setCount =
    workout.exercises?.reduce(
      (total, exercise) => total + (exercise.sets?.length ?? 0),
      0,
    ) ?? 0

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
        <span>{setCount} sets</span>
      </div>
    </Link>
  )
}

function Workouts() {
  const location = useLocation()
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
