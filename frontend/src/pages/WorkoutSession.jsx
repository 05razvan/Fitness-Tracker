import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getWorkout, updateWorkoutSet } from '../services/api'
import './WorkoutSession.css'

function WorkoutSession() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [workout, setWorkout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadWorkout = async () => {
      try {
        setLoading(true)
        const data = await getWorkout(id)
        setWorkout(data)
      } catch (err) {
        console.error(err)
        setError('Unable to load this workout.')
      } finally {
        setLoading(false)
      }
    }

    loadWorkout()
  }, [id])

  const allSets = useMemo(
    () => workout?.exercises?.flatMap((exercise) => exercise.sets || []) || [],
    [workout],
  )

  const completedSets = allSets.filter(
    (set) => set.weight !== null && set.weight !== undefined,
  ).length

  const progress =
    allSets.length > 0 ? Math.round((completedSets / allSets.length) * 100) : 0

  const handleSetChange = async (setId, field, value) => {
    const numericValue = value === '' ? null : Number(value)

    setWorkout((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) => ({
        ...exercise,
        sets: exercise.sets.map((set) =>
          set.id === setId
            ? { ...set, [field]: numericValue }
            : set,
        ),
      })),
    }))
  }

  const saveSet = async (set) => {
    setSaving(set.id)

    try {
      const updated = await updateWorkoutSet(set.id, {
        weight: set.weight,
        reps: set.reps,
        notes: set.notes || '',
      })

      setWorkout((current) => ({
        ...current,
        exercises: current.exercises.map((exercise) => ({
          ...exercise,
          sets: exercise.sets.map((currentSet) =>
            currentSet.id === updated.id ? updated : currentSet,
          ),
        })),
      }))
    } catch (err) {
      console.error(err)
      setError('Unable to save this set.')
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <main className="session-page">
        <div className="session-loading">
          <span className="loading-dot" />
          Loading workout...
        </div>
      </main>
    )
  }

  if (error || !workout) {
    return (
      <main className="session-page">
        <div className="session-error">
          <p>{error || 'Workout not found.'}</p>
          <button onClick={() => navigate('/workouts')}>
            Back to workouts
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="session-page">
      <header className="session-header">
        <button
          className="back-button"
          onClick={() => navigate('/workouts')}
        >
          ← <span>Workouts</span>
        </button>

        <div className="session-heading">
          <span className="eyebrow">ACTIVE SESSION</span>
          <h1>{workout.name}</h1>
          <p>
            {workout.exercises.length} exercises · {allSets.length} sets
          </p>
        </div>

        <div className="session-progress">
          <div className="progress-label">
            <span>SESSION</span>
            <strong>{progress}%</strong>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <section className="session-content">
        {workout.exercises.map((exercise, exerciseIndex) => (
          <article className="exercise-card" key={exercise.id}>
            <div className="exercise-header">
              <div className="exercise-number">
                {String(exerciseIndex + 1).padStart(2, '0')}
              </div>

              <div>
                <span className="exercise-label">EXERCISE</span>
                <h2>
                  {exercise.exercise_name ||
                    `Exercise ${exercise.exercise_id}`}
                </h2>
              </div>
            </div>

            <div className="sets-header">
              <span>SET</span>
              <span>WEIGHT</span>
              <span>REPS</span>
              <span />
            </div>

            <div className="sets-list">
              {exercise.sets.map((set) => {
                const complete =
                  set.weight !== null &&
                  set.weight !== undefined

                return (
                  <div
                    className={`set-row ${complete ? 'set-complete' : ''}`}
                    key={set.id}
                  >
                    <div className="set-number">
                      {set.set_number}
                    </div>

                    <label>
                      <span className="mobile-label">Weight</span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={set.weight ?? ''}
                        placeholder="—"
                        onChange={(event) =>
                          handleSetChange(
                            set.id,
                            'weight',
                            event.target.value,
                          )
                        }
                      />
                      <span className="unit">kg</span>
                    </label>

                    <label>
                      <span className="mobile-label">Reps</span>
                      <input
                        type="number"
                        min="0"
                        value={set.reps ?? ''}
                        placeholder="—"
                        onChange={(event) =>
                          handleSetChange(
                            set.id,
                            'reps',
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <button
                      className="save-set"
                      onClick={() => saveSet(set)}
                      disabled={saving === set.id}
                    >
                      {saving === set.id ? '...' : complete ? '✓' : 'Save'}
                    </button>
                  </div>
                )
              })}
            </div>
          </article>
        ))}
      </section>

      <footer className="session-footer">
        <button
          className="secondary-action"
          onClick={() => navigate('/workouts')}
        >
          Exit workout
        </button>

        <button className="primary-action">
          Complete workout
        </button>
      </footer>
    </main>
  )
}

export default WorkoutSession
