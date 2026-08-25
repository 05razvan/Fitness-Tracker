import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getExercises, getExerciseProgression } from '../services/api'

import './Progress.css'

function Progress() {
  const [exercises, setExercises] = useState([])
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProgress()
  }, [])

  async function loadProgress() {
    try {
      setLoading(true)
      setError('')

      const exerciseData = await getExercises()

      const progressionData = await Promise.all(
        exerciseData.map(async (exercise) => {
          try {
            const data = await getExerciseProgression(exercise.id)

            return {
              ...exercise,
              ...data,
            }
          } catch (err) {
            console.error(
              `Unable to load progression for exercise ${exercise.id}`,
              err,
            )

            return {
              ...exercise,
              sessions: [],
            }
          }
        }),
      )

      setExercises(exerciseData)
      setProgress(progressionData)
    } catch (err) {
      console.error(err)
      setError('Unable to load your progress.')
    } finally {
      setLoading(false)
    }
  }

  const allSessions = progress.flatMap(
    (exercise) => exercise.sessions || [],
  )

  const recordedSessions = allSessions.filter(
    (session) => session.best_estimated_1rm != null,
  )

  const totalVolume = allSessions.reduce(
    (total, session) => total + (session.total_volume || 0),
    0,
  )

  const bestExercise = progress.reduce((best, exercise) => {
    const currentBest = exercise.personal_best_1rm

    if (
      currentBest == null ||
      (best && currentBest <= best.personal_best_1rm)
    ) {
      return best
    }

    return exercise
  }, null)

  const recentSessions = recordedSessions
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6)

  if (loading) {
    return (
      <main className="page progress-page">
        <div className="progress-state">
          <div className="loading-dot" />
          <p>Analysing your training data...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="page progress-page">
        <div className="progress-state">
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button onClick={loadProgress}>Try again</button>
        </div>
      </main>
    )
  }

  return (
    <main className="page progress-page">
      <header className="page-header progress-header">
        <div>
          <span className="eyebrow">PERFORMANCE</span>
          <h1>Progress</h1>
          <p>
            Track how your strength and training volume are changing
            over time.
          </p>
        </div>
      </header>

      <section className="progress-stats">
        <article className="glass-card progress-stat">
          <span>TRAINING VOLUME</span>
          <strong>
            {totalVolume.toLocaleString()} kg
          </strong>
          <small>Total logged volume</small>
        </article>

        <article className="glass-card progress-stat">
          <span>RECORDED SESSIONS</span>
          <strong>{recordedSessions.length}</strong>
          <small>Sessions with performance data</small>
        </article>

        <article className="glass-card progress-stat">
          <span>EXERCISES</span>
          <strong>{exercises.length}</strong>
          <small>Exercises in your library</small>
        </article>

        <article className="glass-card progress-stat highlight-stat">
          <span>BEST ESTIMATED 1RM</span>
          <strong>
            {bestExercise?.personal_best_1rm != null
              ? `${bestExercise.personal_best_1rm} kg`
              : '—'}
          </strong>
          <small>
            {bestExercise?.exercise_name || 'No data yet'}
          </small>
        </article>
      </section>

      <section className="progress-main-grid">
        <article className="glass-card exercise-progress-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">STRENGTH</span>
              <h2>Exercise progression</h2>
            </div>
          </div>

          {progress.filter(
            (exercise) => exercise.personal_best_1rm != null,
          ).length === 0 ? (
            <div className="progress-empty">
              <p>
                Keep logging workouts to see your strength progression
                here.
              </p>
            </div>
          ) : (
            <div className="exercise-progress-list">
              {progress
                .filter(
                  (exercise) =>
                    exercise.personal_best_1rm != null,
                )
                .sort(
                  (a, b) =>
                    (b.personal_best_1rm || 0) -
                    (a.personal_best_1rm || 0),
                )
                .map((exercise) => (
                  <Link
                    key={exercise.id}
                    to={`/exercises/${exercise.id}`}
                    className="exercise-progress-row"
                  >
                    <div className="exercise-progress-name">
                      <strong>{exercise.exercise_name}</strong>
                      <small>
                        {exercise.sessions?.filter(
                          (session) =>
                            session.best_estimated_1rm != null,
                        ).length || 0}{' '}
                        sessions
                      </small>
                    </div>

                    <div className="exercise-progress-value">
                      <strong>
                        {exercise.personal_best_1rm} kg
                      </strong>

                      {exercise.improvement_percentage != null && (
                        <span
                          className={
                            exercise.improvement_percentage > 0
                              ? 'improvement-positive'
                              : 'improvement-neutral'
                          }
                        >
                          {exercise.improvement_percentage > 0
                            ? '+'
                            : ''}
                          {exercise.improvement_percentage}%
                        </span>
                      )}
                    </div>

                    <span className="progress-arrow">↗</span>
                  </Link>
                ))}
            </div>
          )}
        </article>

        <article className="glass-card recent-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">RECENT</span>
              <h2>Latest sessions</h2>
            </div>
          </div>

          {recentSessions.length === 0 ? (
            <div className="progress-empty">
              <p>No recorded sessions yet.</p>
            </div>
          ) : (
            <div className="recent-list">
              {recentSessions.map((session, index) => (
                <div
                  className="recent-row"
                  key={`${session.workout_id}-${index}`}
                >
                  <div>
                    <strong>
                      {new Date(session.date).toLocaleDateString(
                        undefined,
                        {
                          day: 'numeric',
                          month: 'short',
                        },
                      )}
                    </strong>

                    <small>
                      {session.best_weight} kg × {session.best_reps}
                    </small>
                  </div>

                  <div className="recent-value">
                    {session.best_estimated_1rm} kg
                    {session.is_pr && (
                      <span className="pr-badge">PR</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </main>
  )
}

export default Progress
