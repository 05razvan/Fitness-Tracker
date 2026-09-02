import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  addWorkoutSet,
  completeWorkout,
  deleteWorkoutSet,
  getWorkout,
  updateWorkout,
  updateWorkoutSet,
} from '../services/api'
import './WorkoutSession.css'

const formatPreviousSet = (set) =>
  `${Number(set.weight).toLocaleString(undefined, { maximumFractionDigits: 1 })} kg × ${set.reps}`

function WorkoutSession() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [workout, setWorkout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingIds, setSavingIds] = useState(new Set())
  const [dirtyIds, setDirtyIds] = useState(new Set())
  const [dirtyMetadata, setDirtyMetadata] = useState(new Set())
  const [savingMetadata, setSavingMetadata] = useState(new Set())
  const [modifyingExerciseIds, setModifyingExerciseIds] = useState(new Set())
  const [completing, setCompleting] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [saveError, setSaveError] = useState('')
  const [completionError, setCompletionError] = useState('')

  useEffect(() => {
    const loadWorkout = async () => {
      try {
        setLoading(true)
        const data = await getWorkout(id)
        setWorkout(data)
      } catch (err) {
        console.error(err)
        setLoadError('Unable to load this workout.')
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

  const isSetComplete = (set) =>
    set.weight !== null &&
    set.weight !== undefined &&
    set.weight > 0 &&
    set.reps !== null &&
    set.reps !== undefined &&
    set.reps > 0

  const completedSets = allSets.filter(isSetComplete).length
  const incompleteSets = allSets.length - completedSets
  const isCompleted = Boolean(workout?.completed_at)

  const progress =
    allSets.length > 0 ? Math.round((completedSets / allSets.length) * 100) : 0

  useEffect(() => {
    if (dirtyIds.size === 0 && dirtyMetadata.size === 0) return undefined

    const warnBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [dirtyIds, dirtyMetadata])

  const handleWorkoutFieldChange = (field, value) => {
    if (isCompleted) return
    setWorkout((current) => ({ ...current, [field]: value }))
    setDirtyMetadata((current) => new Set(current).add(field))
    setSaveError('')
  }

  const saveWorkoutField = async (field) => {
    if (isCompleted || savingMetadata.has(field) || !dirtyMetadata.has(field)) {
      return true
    }

    const rawValue = workout[field]
    const value = field === 'body_weight'
      ? rawValue === '' || rawValue == null ? null : Number(rawValue)
      : rawValue === '' ? null : rawValue
    setSavingMetadata((current) => new Set(current).add(field))

    try {
      await updateWorkout(workout.id, { [field]: value })
      setDirtyMetadata((current) => {
        const next = new Set(current)
        next.delete(field)
        return next
      })
      setSaveError('')
      return true
    } catch (err) {
      console.error(err)
      setSaveError('Unable to save session details. Please try again.')
      return false
    } finally {
      setSavingMetadata((current) => {
        const next = new Set(current)
        next.delete(field)
        return next
      })
    }
  }

  const handleSetChange = async (setId, field, value) => {
    if (isCompleted) return

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
    setDirtyIds((current) => new Set(current).add(setId))
    setSaveError('')
  }

  const saveSet = async (set) => {
    if (isCompleted || savingIds.has(set.id) || !dirtyIds.has(set.id)) {
      return true
    }

    setSavingIds((current) => new Set(current).add(set.id))

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
      setDirtyIds((current) => {
        const next = new Set(current)
        next.delete(set.id)
        return next
      })
      setSaveError('')
      return true
    } catch (err) {
      console.error(err)
      setSaveError('Unable to save this set. Check your connection and try again.')
      return false
    } finally {
      setSavingIds((current) => {
        const next = new Set(current)
        next.delete(set.id)
        return next
      })
    }
  }

  const savePendingSets = async () => {
    const unsavedSets = allSets.filter((set) => dirtyIds.has(set.id))
    const saveResults = await Promise.all(unsavedSets.map(saveSet))
    return saveResults.every(Boolean)
  }

  const savePendingMetadata = async () => {
    const results = await Promise.all([...dirtyMetadata].map(saveWorkoutField))
    return results.every(Boolean)
  }

  const handleExitWorkout = async () => {
    if (isCompleted || (dirtyIds.size === 0 && dirtyMetadata.size === 0)) {
      navigate('/workouts')
      return
    }

    const [setsSaved, metadataSaved] = await Promise.all([
      savePendingSets(),
      savePendingMetadata(),
    ])

    if (setsSaved && metadataSaved) {
      navigate('/workouts')
    }
  }

  const handleCompleteWorkout = async () => {
    if (isCompleted || completing) return

    if (incompleteSets > 0) {
      const shouldComplete = window.confirm(
        `${incompleteSets} ${incompleteSets === 1 ? 'set is' : 'sets are'} incomplete. Complete this workout anyway?`,
      )

      if (!shouldComplete) return
    }

    try {
      setCompleting(true)
      setCompletionError('')
      const [setsSaved, metadataSaved] = await Promise.all([
        savePendingSets(),
        savePendingMetadata(),
      ])

      if (!setsSaved || !metadataSaved) {
        setCompletionError(
          'The workout was not completed because some sets could not be saved.',
        )
        return
      }

      const completedWorkout = await completeWorkout(workout.id)
      setWorkout(completedWorkout)
      navigate('/workouts', {
        replace: true,
        state: {
          completedWorkout: completedWorkout.name || 'Workout',
        },
      })
    } catch (err) {
      console.error(err)
      setCompletionError(
        'Unable to complete this workout. Your saved sets are still available.',
      )
    } finally {
      setCompleting(false)
    }
  }

  const addSet = async (workoutExerciseId) => {
    setModifyingExerciseIds((current) => new Set(current).add(workoutExerciseId))
    setSaveError('')

    try {
      const newSet = await addWorkoutSet(workoutExerciseId)
      setWorkout((current) => ({
        ...current,
        exercises: current.exercises.map((exercise) =>
          exercise.id === workoutExerciseId
            ? { ...exercise, sets: [...exercise.sets, newSet] }
            : exercise,
        ),
      }))
    } catch (err) {
      console.error(err)
      setSaveError('Unable to add a set. Please try again.')
    } finally {
      setModifyingExerciseIds((current) => {
        const next = new Set(current)
        next.delete(workoutExerciseId)
        return next
      })
    }
  }

  const removeSet = async (exercise, set) => {
    const hasPerformance = set.weight > 0 || set.reps > 0
    if (hasPerformance && !window.confirm(`Remove set ${set.set_number} and its recorded values?`)) {
      return
    }

    setModifyingExerciseIds((current) => new Set(current).add(exercise.id))
    setSaveError('')

    try {
      await deleteWorkoutSet(set.id)
      setDirtyIds((current) => {
        const next = new Set(current)
        next.delete(set.id)
        return next
      })
      setWorkout((current) => ({
        ...current,
        exercises: current.exercises.map((currentExercise) =>
          currentExercise.id === exercise.id
            ? {
                ...currentExercise,
                sets: currentExercise.sets
                  .filter((currentSet) => currentSet.id !== set.id)
                  .map((currentSet, index) => ({
                    ...currentSet,
                    set_number: index + 1,
                  })),
              }
            : currentExercise,
        ),
      }))
    } catch (err) {
      console.error(err)
      setSaveError('Unable to remove this set. Please try again.')
    } finally {
      setModifyingExerciseIds((current) => {
        const next = new Set(current)
        next.delete(exercise.id)
        return next
      })
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

  if (loadError || !workout) {
    return (
      <main className="session-page">
        <div className="session-error">
          <p>{loadError || 'Workout not found.'}</p>
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
          <span className="eyebrow">
            {isCompleted ? 'COMPLETED SESSION' : 'ACTIVE SESSION'}
          </span>
          <h1>{workout.name}</h1>
          <p>
            {workout.exercises.length} exercises · {allSets.length} sets
          </p>
        </div>

        <div className="session-progress">
          <div className="progress-label">
            <span>SESSION</span>
              <strong>{isCompleted ? 'DONE' : `${progress}%`}</strong>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${isCompleted ? 100 : progress}%` }}
            />
          </div>
        </div>
      </header>

      <section className="session-details" aria-label="Session details">
        <label>
          <span>BODY WEIGHT</span>
          <div className="body-weight-input">
            <input
              type="number"
              min="1"
              max="500"
              step="0.1"
              value={workout.body_weight ?? ''}
              placeholder="Optional"
              onChange={(event) => handleWorkoutFieldChange('body_weight', event.target.value)}
              onBlur={() => saveWorkoutField('body_weight')}
              disabled={isCompleted}
            />
            <small>kg</small>
          </div>
        </label>
        <label className="session-notes-field">
          <span>SESSION NOTES</span>
          <textarea
            value={workout.notes ?? ''}
            placeholder="Energy, recovery, technique cues..."
            maxLength={2000}
            rows={2}
            onChange={(event) => handleWorkoutFieldChange('notes', event.target.value)}
            onBlur={() => saveWorkoutField('notes')}
            disabled={isCompleted}
          />
        </label>
        <p className="metadata-save-status">
          {savingMetadata.size > 0
            ? 'Saving details...'
            : dirtyMetadata.size > 0
              ? 'Unsaved changes'
              : 'Details save automatically'}
        </p>
      </section>

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
                {exercise.previous_sets?.length > 0 && (
                  <p className="previous-performance">
                    <span>LAST SESSION</span>
                    {exercise.previous_sets.map(formatPreviousSet).join(' · ')}
                  </p>
                )}
              </div>
            </div>

            <div className="sets-header">
              <span>SET</span>
              <span>WEIGHT</span>
              <span>REPS</span>
              <span>ACTION</span>
            </div>

            <div className="sets-list">
              {exercise.sets.map((set) => {
                const complete = isSetComplete(set)

                return (
                  <div
                    className={`set-row ${complete ? 'set-complete' : ''}`}
                    key={set.id}
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget)) {
                        saveSet(set)
                      }
                    }}
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
                        disabled={isCompleted}
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
                        disabled={isCompleted}
                      />
                    </label>

                    {isCompleted ? (
                      <span className="set-locked">
                        {complete ? '✓' : '—'}
                      </span>
                    ) : (
                      <div className="set-actions">
                        <button
                          className="save-set"
                          onClick={() => saveSet(set)}
                          disabled={savingIds.has(set.id) || !dirtyIds.has(set.id)}
                        >
                          {savingIds.has(set.id)
                            ? 'Saving'
                            : dirtyIds.has(set.id)
                              ? 'Save'
                              : complete
                                ? '✓'
                                : '—'}
                        </button>
                        <button
                          type="button"
                          className="remove-set"
                          aria-label={`Remove set ${set.set_number}`}
                          onClick={() => removeSet(exercise, set)}
                          disabled={modifyingExerciseIds.has(exercise.id) || savingIds.has(set.id)}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {!isCompleted && (
              <button
                type="button"
                className="add-set"
                onClick={() => addSet(exercise.id)}
                disabled={modifyingExerciseIds.has(exercise.id)}
              >
                {modifyingExerciseIds.has(exercise.id) ? 'Updating sets...' : '+ Add set'}
              </button>
            )}
          </article>
        ))}
      </section>

      <footer className="session-footer">
        {saveError && (
          <p className="completion-error" role="alert">
            {saveError}
          </p>
        )}

        {completionError && (
          <p className="completion-error" role="alert">
            {completionError}
          </p>
        )}

        <button
          className="secondary-action"
          onClick={handleExitWorkout}
          disabled={savingIds.size > 0 || savingMetadata.size > 0 || completing}
        >
          {isCompleted ? 'Back to workouts' : 'Exit workout'}
        </button>

        {!isCompleted && (
          <button
            className="primary-action"
            onClick={handleCompleteWorkout}
            disabled={completing || savingIds.size > 0 || savingMetadata.size > 0}
          >
            {completing ? 'Completing...' : 'Complete workout'}
          </button>
        )}
      </footer>
    </main>
  )
}

export default WorkoutSession
