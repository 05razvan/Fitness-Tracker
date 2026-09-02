import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  createWorkoutPreset,
  deleteWorkoutPreset,
  getExercises,
  getWorkoutPresets,
  startWorkoutFromPreset,
  updateWorkoutPreset,
} from '../services/api'
import PresetEditor from '../components/PresetEditor'

import './StartWorkout.css'

function StartWorkout() {
  const navigate = useNavigate()
  const [presets, setPresets] = useState([])
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [startingId, setStartingId] = useState(null)
  const [error, setError] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [editingPreset, setEditingPreset] = useState(null)
  const [savingPreset, setSavingPreset] = useState(false)
  const [deletingPresetId, setDeletingPresetId] = useState(null)

  useEffect(() => {
    loadPresets()
  }, [])

  async function loadPresets() {
    try {
      setLoading(true)
      setError('')
      const [presetData, exerciseData] = await Promise.all([
        getWorkoutPresets(),
        getExercises(),
      ])
      setPresets(presetData)
      setExercises(exerciseData)
    } catch (requestError) {
      console.error(requestError)
      setError('Unable to load your workout presets.')
    } finally {
      setLoading(false)
    }
  }

  const exerciseNames = useMemo(
    () => new Map(exercises.map((exercise) => [exercise.id, exercise.name])),
    [exercises],
  )

  async function handleStart(preset) {
    if (startingId !== null) return

    try {
      setStartingId(preset.id)
      setError('')
      const workout = await startWorkoutFromPreset(preset.id)
      navigate(`/workouts/${workout.id}`, { replace: true })
    } catch (requestError) {
      console.error(requestError)
      setError(`Unable to start ${preset.name}. Please try again.`)
      setStartingId(null)
    }
  }

  async function handleCreatePreset(data) {
    try {
      setSavingPreset(true)
      setError('')
      const created = await createWorkoutPreset(data)
      setPresets((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)))
      setShowEditor(false)
    } catch (requestError) {
      console.error(requestError)
      setError('Unable to create this preset. Check the exercise targets and try again.')
    } finally {
      setSavingPreset(false)
    }
  }

  async function handleUpdatePreset(data) {
    try {
      setSavingPreset(true)
      setError('')
      const updated = await updateWorkoutPreset(editingPreset.id, data)
      setPresets((current) => current
        .map((preset) => preset.id === updated.id ? updated : preset)
        .sort((a, b) => a.name.localeCompare(b.name)))
      setShowEditor(false)
      setEditingPreset(null)
    } catch (requestError) {
      console.error(requestError)
      setError('Unable to update this preset. Check the exercise targets and try again.')
    } finally {
      setSavingPreset(false)
    }
  }

  async function handleDeletePreset(preset) {
    if (!window.confirm(`Delete ${preset.name}? Existing workout history will not be affected.`)) {
      return
    }

    try {
      setDeletingPresetId(preset.id)
      setError('')
      await deleteWorkoutPreset(preset.id)
      setPresets((current) => current.filter((item) => item.id !== preset.id))
      if (editingPreset?.id === preset.id) {
        setShowEditor(false)
        setEditingPreset(null)
      }
    } catch (requestError) {
      console.error(requestError)
      setError(`Unable to delete ${preset.name}.`)
    } finally {
      setDeletingPresetId(null)
    }
  }

  function openCreateEditor() {
    setEditingPreset(null)
    setShowEditor(true)
  }

  function closeEditor() {
    setShowEditor(false)
    setEditingPreset(null)
  }

  return (
    <main className="page start-workout-page">
      <Link to="/workouts" className="start-back-link">
        ← Training log
      </Link>

      <header className="start-workout-header">
        <div>
          <span className="eyebrow">NEW SESSION</span>
          <h1>Start a workout</h1>
          <p>Choose a training preset or build a new structure for your next session.</p>
        </div>
        <button type="button" className="new-preset-button" onClick={openCreateEditor}>+ New preset</button>
      </header>

      {showEditor && (
        <PresetEditor
          key={editingPreset?.id || 'new'}
          exercises={exercises}
          initialPreset={editingPreset}
          onSave={editingPreset ? handleUpdatePreset : handleCreatePreset}
          onCancel={closeEditor}
          saving={savingPreset}
        />
      )}

      {loading && (
        <div className="start-workout-state">
          <span className="loading-dot" />
          <p>Loading your training presets...</p>
        </div>
      )}

      {!loading && error && (
        <div className="start-error" role="alert">
          <p>{error}</p>
          {startingId === null && (
            <button type="button" onClick={loadPresets}>Try again</button>
          )}
        </div>
      )}

      {!loading && presets.length === 0 && !error && (
        <div className="start-workout-state start-empty">
          <span className="start-empty-mark">+</span>
          <h2>No presets available</h2>
          <p>Create your first reusable training structure to start a session.</p>
          <button type="button" className="secondary-button" onClick={openCreateEditor}>Create preset</button>
        </div>
      )}

      {!loading && presets.length > 0 && (
        <section className="preset-grid" aria-label="Workout presets">
          {presets.map((preset, index) => {
            const setCount = preset.exercises.reduce(
              (total, exercise) => total + (exercise.target_sets || 0),
              0,
            )
            const isStarting = startingId === preset.id
            const isDisabled = startingId !== null

            return (
              <article className="preset-card" key={preset.id}>
                <div className="preset-card-top">
                  <span className="preset-index">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>{preset.exercises.length} exercises · {setCount} sets</span>
                </div>

                <div className="preset-card-copy">
                  <h2>{preset.name}</h2>
                  <p>{preset.description || 'A structured workout ready to begin.'}</p>
                </div>

                <ol className="preset-exercises">
                  {preset.exercises.slice(0, 4).map((exercise) => (
                    <li key={exercise.id}>
                      <span>{exerciseNames.get(exercise.exercise_id) || `Exercise ${exercise.exercise_id}`}</span>
                      <small>{exercise.target_sets || 0} × {exercise.target_reps || '—'}</small>
                    </li>
                  ))}
                </ol>

                {preset.exercises.length > 4 && (
                  <p className="preset-more">+{preset.exercises.length - 4} more exercises</p>
                )}

                <div className="preset-card-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPreset(preset)
                      setShowEditor(true)
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="delete-preset-button"
                    onClick={() => handleDeletePreset(preset)}
                    disabled={deletingPresetId === preset.id}
                  >
                    {deletingPresetId === preset.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>

                <button
                  type="button"
                  className="start-preset-button"
                  disabled={isDisabled}
                  onClick={() => handleStart(preset)}
                >
                  {isStarting ? 'Preparing session...' : `Start ${preset.name}`}
                </button>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}

export default StartWorkout
