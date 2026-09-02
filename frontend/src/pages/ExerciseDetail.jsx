import { useCallback, useEffect, useState } from 'react'
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

  const loadExerciseData = useCallback(async () => {
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
  }, [exerciseId])

  useEffect(() => {
    loadExerciseData()
  }, [loadExerciseData])

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

  const sessions = progression?.sessions || []

  const sessionsWithData = sessions.filter(
    (session) => session.best_estimated_1rm != null,
  )

  const personalBest = progression?.personal_best_1rm

  const previousBest = progression?.previous_best_1rm

  const improvement = progression?.improvement_percentage

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
          <span className="stat-label">PERSONAL BEST</span>

          <strong>
            {personalBest != null ? `${personalBest} kg` : '—'}
          </strong>

          <span className="stat-description">
            Best estimated 1RM
          </span>
        </article>

        <article className="glass-card stat-card">
          <span className="stat-label">IMPROVEMENT</span>

          <strong>
            {improvement != null ? `${improvement}%` : '—'}
          </strong>

          <span className="stat-description">
            Compared with previous best
          </span>
        </article>

        <article className="glass-card stat-card">
          <span className="stat-label">SESSIONS</span>

          <strong>{sessionsWithData.length}</strong>

          <span className="stat-description">
            Sessions with recorded performance
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

              {recommendation.recommendation && (
                <p className="recommendation-reason">
                  {recommendation.recommendation}
                </p>
              )}

              {recommendation.reason && (
                <p className="recommendation-reason">
                  {recommendation.reason}
                </p>
              )}
            </div>
          ) : (
            <div className="recommendation-empty">
              <span className="recommendation-line" />

              <h3>Not enough data yet</h3>

              <p>
                Continue logging your workouts to generate adaptive
                recommendations.
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

              <p>
                {plateau?.message ||
                  'Keep logging workouts to analyse your progression.'}
              </p>
            </div>
          </div>

          <div className="plateau-meta">
            <span>
              {plateau?.sessions_analyzed ??
                sessionsWithData.length}{' '}
              sessions analysed
            </span>

            {personalBest != null && (
              <span>
                Best: {personalBest} kg
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

          {previousBest != null && (
            <span className="progression-summary">
              Previous best: {previousBest} kg
            </span>
          )}
        </div>

        {sessionsWithData.length === 0 ? (
          <div className="progression-empty">
            <p>
              Keep logging this exercise to build your progression
              history.
            </p>
          </div>
        ) : (
          <div className="progression-list">
            {sessionsWithData
              .slice()
              .reverse()
              .map((entry, index) => (
                <div
                  className="progression-row"
                  key={entry.workout_id || entry.date || index}
                >
                  <div className="progression-session">
                    <span>
                      Session {sessionsWithData.length - index}
                    </span>

                    {entry.date && (
                      <small>
                        {new Date(entry.date).toLocaleDateString(
                          undefined,
                          {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          },
                        )}
                      </small>
                    )}
                  </div>

                  <div className="progression-performance">
                    <div>
                      <strong>
                        {entry.best_weight} kg × {entry.best_reps}
                      </strong>

                      <small>
                        {entry.best_estimated_1rm} kg estimated 1RM
                      </small>
                    </div>

                    {entry.is_pr && (
                      <span className="pr-badge">PR</span>
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
