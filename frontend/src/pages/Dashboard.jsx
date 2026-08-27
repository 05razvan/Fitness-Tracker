import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import './Dashboard.css'

const API_URL = 'http://127.0.0.1:8000'

function Dashboard() {
  const [workouts, setWorkouts] = useState([])
  const [recommendation, setRecommendation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [workoutsResponse, recommendationResponse] =
          await Promise.all([
            axios.get(`${API_URL}/workouts/`),
            axios.get(`${API_URL}/recommendations/exercise/1`),
          ])

        setWorkouts(workoutsResponse.data)
        setRecommendation(recommendationResponse.data)
      } catch (error) {
        console.error('Failed to load dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const completedWorkouts = workouts.filter(
    (workout) => workout.completed_at
  )

  const recentWorkouts = workouts.slice(0, 5)

  if (loading) {
    return (
      <div className="dashboard-loading">
        <span className="loading-dot" />
        Loading intelligence...
      </div>
    )
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">OVERVIEW</span>
          <h1>Your training, <span>adapted.</span></h1>
          <p>
            Track performance, understand progression and train with
            data-driven recommendations.
          </p>
        </div>

        <Link to="/workouts/new" className="primary-button">
          + Start Workout
        </Link>
      </header>

      <section className="stats-grid" aria-label="Training statistics">
        <article className="stat-card">
          <span className="stat-label">TOTAL WORKOUTS</span>
          <strong>{workouts.length}</strong>
          <span className="stat-description">
            {completedWorkouts.length} completed
          </span>
        </article>

        <article className="stat-card highlighted">
          <span className="stat-label">EST. 1RM</span>
          <strong>
            {recommendation?.recommended_weight
              ? `${recommendation.recommended_weight} kg`
              : '101.3 kg'}
          </strong>
          <span className="stat-description">
            Barbell Bench Press
          </span>
        </article>

        <article className="stat-card">
          <span className="stat-label">TARGET REPS</span>
          <strong>
            {recommendation
              ? `${recommendation.target_reps_min}-${recommendation.target_reps_max}`
              : '8-12'}
          </strong>
          <span className="stat-description">
            Recommended range
          </span>
        </article>

        <article className="stat-card">
          <span className="stat-label">SETS / WORKOUT</span>
          <strong>
            {recommendation?.target_sets || 3}
          </strong>
          <span className="stat-description">
            Current target
          </span>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="glass-card recent-card">
          <div className="card-header">
            <div>
              <span className="eyebrow">TRAINING LOG</span>
              <h2>Recent workouts</h2>
            </div>

            <button className="ghost-button">
              View all
            </button>
          </div>

          {recentWorkouts.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">◈</span>
              <h3>No workouts yet</h3>
              <p>
                Start your first workout to begin building your
                performance history.
              </p>
            </div>
          ) : (
            <div className="workout-list">
              {recentWorkouts.map((workout) => (
                <div className="workout-row" key={workout.id}>
                  <div className="workout-icon">◈</div>

                  <div className="workout-info">
                    <strong>{workout.name}</strong>
                    <span>
                      {new Date(workout.started_at).toLocaleDateString(
                        undefined,
                        {
                          day: 'numeric',
                          month: 'short',
                        }
                      )}
                    </span>
                  </div>

                  <div className="workout-status">
                    {workout.completed_at ? 'COMPLETED' : 'IN PROGRESS'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="glass-card intelligence-card">
          <div className="card-header">
            <div>
              <span className="eyebrow">INTELLIGENCE</span>
              <h2>Next session</h2>
            </div>

            <div className="intelligence-indicator">
              <span />
            </div>
          </div>

          <div className="recommendation-content">
            <span className="recommendation-label">
              BARBELL BENCH PRESS
            </span>

            <h3>
              {recommendation?.recommendation ||
                'Keep building your performance history.'}
            </h3>

            <p>
              {recommendation?.reason ||
                'Your training data will be analysed to generate personalised recommendations.'}
            </p>

            {recommendation?.recommended_weight && (
              <div className="recommendation-value">
                <span>Recommended weight</span>
                <strong>
                  {recommendation.recommended_weight} kg
                </strong>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="progression-card glass-card">
        <div className="card-header">
          <div>
            <span className="eyebrow">PERFORMANCE</span>
            <h2>Progression</h2>
          </div>

          <span className="card-meta">BENCH PRESS</span>
        </div>

        <div className="progression-placeholder">
          <div className="progression-line">
            <span className="progression-point point-one" />
            <span className="progression-point point-two" />
            <span className="progression-point point-three" />
          </div>

          <div className="progression-labels">
            <span>Session 1</span>
            <span>Session 2</span>
            <span>Session 3</span>
          </div>
        </div>

        <p className="chart-note">
          Performance visualisation will become more detailed as
          additional training sessions are recorded.
        </p>
      </section>
    </div>
  )
}

export default Dashboard
