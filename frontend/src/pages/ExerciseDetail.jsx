import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getExercisePlateau,
  getExerciseProgression,
  getExerciseRecommendation,
} from '../services/api'
import './ExerciseDetail.css'

function ExerciseDetail() {
  const { exerciseId } = useParams()

  const [progression, setProgression] = useState(null)
  const [plateau, setPlateau] = useState(null)
  const [recommendation, setRecommendation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadExerciseData()
  }, [exerciseId])

  async function loadExerciseData() {
    try {
      setLoading(true)
      setError('')

      const [progressionData, plateauData, recommendationData] =
        await Promise.all([
          getExerciseProgression(exerciseId),
          getExercisePlateau(exerciseId),
          getExerciseRecommendation(exerciseId),
        ])

      setProgression(progressionData)
      setPlateau(plateauData)
      setRecommendation(recommendationData)
    } catch (err) {
      console.error(err)
      setError('Unable to load exercise data.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="page exercise-detail-page">
        <div className="exercise-detail-state">
          <div className="loading-dot" />
          <p>Loading exercise intelligence...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="page exercise-detail-page">
        <div className="exercise-detail-state">
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button onClick={loadExerciseData}>Try again</button>
        </div>
      </main>
    )
  }

  const exerciseName =
    progression?.exercise_name ||
    plateau?.exercise_name ||
    recommendation?.exercise_name ||
    'Exercise'

  const progressionEntries =
    progression?.progression ||
    progression?.entries ||
    progression?.data ||
    []

  return (
    <main className="page exercise-detail-page">
      <Link to="/exercises" className="back-link">
        ← Exercise library
      </Link>

      <header className="exercise-detail-header">
        <div>
          <span className="eyebrow">EXERCISE INTELLIGENCE</span>
          <h1>{exerciseName}</h1>
          <p>
            Performance history, progression and adaptive training
            recommendations.
          </p>
        </div>
      </header>

      <section className="intelligence-grid">
        <article className="glass-card stat-card">
          <span className="stat-label">CURRENT 1RM</span>

          <strong>
            {plateau?.current_1rm != null
              ? `${plateau.current_1rm} kg`
              : '—'}
          </strong>

          <span className="stat-description">
            Estimated one-rep max
          </span>
        </article>

        <article className="glass-card stat-card">
          <span className="stat-label">BEST 1RM</span>

          <strong>
            {plateau?.best_1rm != null
              ? `${plateau.best_1rm} kg`
              : '—'}
          </strong>

          <span className="stat-description">
            Best recorded performance
          </span>
        </article>

        <article className="glass-card stat-card">
          <span className="stat-label">SESSIONS</span>

          <strong>
            {plateau?.sessions_analyzed ?? 0}
          </strong>

          <span className="stat-description">
            Sessions analysed
          </span>
        </article>
      </section>

      <section className="exercise-detail-grid">
        <article className="glass-card recommendation-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">ADAPTIVE INTELLIGENCE</span>
              <h2>Next session</h2>
            </div>

            <span className="amber-dot" />
          </div>

          {recommendation?.recommended_weight != null ? (
            <div className="recommendation-main">
              <span className="recommendation-label">
                RECOMMENDED WEIGHT
              </span>

              <strong>
                {recommendation.recommended_weight} kg
              </strong>

              <div className="recommendation-target">
                <span>
                  {recommendation.target_reps_min}–
                  {recommendation.target_reps_max} reps
                </span>

                <span>
                  {recommendation.target_sets} sets
                </span>
              </div>
            </div>
          ) : (
            <div className="recommendation-empty">
              <span className="recommendation-line" />

              <h3>
                {recommendation?.recommendation ||
                  'Not enough data yet'}
              </h3>

              <p>
                {recommendation?.reason ||
                  'Continue logging your workouts to generate adaptive recommendations.'}
              </p>
            </div>
          )}
        </article>

        <article
          className={`glass-card plateau-card ${
            plateau?.is_plateau ? 'plateau-active' : ''
          }`}
        >
          <div className="card-heading">
            <div>
              <span className="eyebrow">PERFORMANCE SIGNAL</span>
              <h2>Plateau analysis</h2>
            </div>
          </div>

          <div className="plateau-status">
            <div className="status-indicator">
              <span />
            </div>

            <div>
              <strong>
                {plateau?.is_plateau
                  ? 'Potential plateau'
                  : 'Progressing'}
              </strong>

              <p>{plateau?.message}</p>
            </div>
          </div>

          <div className="plateau-meta">
            <span>
              {plateau?.sessions_analyzed ?? 0} sessions analysed
            </span>

            {plateau?.best_1rm != null && (
              <span>
                Best: {plateau.best_1rm} kg
              </span>
            )}
          </div>
        </article>
      </section>

      <section className="glass-card progression-card">
        <div className="card-heading">
          <div>
            <span className="eyebrow">HISTORY</span>
            <h2>Progression</h2>
          </div>
        </div>

        {progressionEntries.length === 0 ? (
          <div className="progression-empty">
            <p>
              Keep logging this exercise to build your progression
              history.
            </p>
          </div>
        ) : (
          <div className="progression-list">
            {progressionEntries.map((entry, index) => (
              <div
                className="progression-row"
                key={entry.id || entry.date || index}
              >
                <div className="progression-session">
                  <span>
                    Session {index + 1}
                  </span>

                  {entry.date && (
                    <small>
                      {new Date(entry.date).toLocaleDateString()}
                    </small>
                  )}
                </div>

                <div className="progression-value">
                  {entry.best_estimated_1rm != null ? (
                    <>
                      <strong>
                        {entry.best_estimated_1rm} kg
                      </strong>

                      <small>estimated 1RM</small>
                    </>
                  ) : (
                    <span>—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default ExerciseDetail