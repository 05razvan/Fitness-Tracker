import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createExercise,
  deleteExercise,
  getExercises,
  updateExercise,
} from '../services/api'
import ExerciseEditor from '../components/ExerciseEditor'
import './Exercises.css'

function Exercises() {
  const [exercises, setExercises] = useState([])
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [editingExercise, setEditingExercise] = useState(null)
  const [savingExercise, setSavingExercise] = useState(false)
  const [deletingExerciseId, setDeletingExerciseId] = useState(null)

  useEffect(() => {
    loadExercises()
  }, [])

  async function loadExercises() {
    try {
      setLoading(true)
      setError('')

      const data = await getExercises()
      setExercises(data)
    } catch (err) {
      console.error(err)
      setError('Unable to load exercises.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateExercise(data) {
    try {
      setSavingExercise(true)
      setError('')
      const created = await createExercise(data)
      setExercises((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)))
      setShowEditor(false)
    } catch (err) {
      console.error(err)
      setError('Unable to create this exercise. The name may already exist.')
    } finally {
      setSavingExercise(false)
    }
  }

  async function handleUpdateExercise(data) {
    try {
      setSavingExercise(true)
      setError('')
      const updated = await updateExercise(editingExercise.id, data)
      setExercises((current) => current
        .map((exercise) => exercise.id === updated.id ? updated : exercise)
        .sort((a, b) => a.name.localeCompare(b.name)))
      closeEditor()
    } catch (err) {
      console.error(err)
      setError('Unable to update this exercise. The name may already exist.')
    } finally {
      setSavingExercise(false)
    }
  }

  async function handleDeleteExercise(exercise) {
    if (!window.confirm(`Delete ${exercise.name} from the exercise library?`)) return
    setDeletingExerciseId(exercise.id)
    setError('')

    try {
      await deleteExercise(exercise.id)
      setExercises((current) => current.filter((item) => item.id !== exercise.id))
      if (editingExercise?.id === exercise.id) closeEditor()
    } catch (err) {
      console.error(err)
      setError(
        err.response?.status === 409
          ? `${exercise.name} cannot be deleted because it is used by workout history or a preset.`
          : `Unable to delete ${exercise.name}.`,
      )
    } finally {
      setDeletingExerciseId(null)
    }
  }

  function openCreateEditor() {
    setEditingExercise(null)
    setShowEditor(true)
  }

  function closeEditor() {
    setShowEditor(false)
    setEditingExercise(null)
  }

  const muscles = [
    ...new Set(
      exercises
        .map((exercise) => exercise.primary_muscle)
        .filter(Boolean),
    ),
  ]

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.name
      ?.toLowerCase()
      .includes(search.toLowerCase())

    const matchesMuscle =
      !muscle || exercise.primary_muscle === muscle

    return matchesSearch && matchesMuscle
  })

  return (
    <main className="page exercises-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">LIBRARY</span>
          <h1>Exercises</h1>
          <p>
            Browse your exercise library and track individual
            movements over time.
          </p>
        </div>

        <div className="exercise-header-actions">
          <div className="exercise-count"><span>{filteredExercises.length}</span><small>exercises</small></div>
          <button type="button" onClick={openCreateEditor}>+ Add exercise</button>
        </div>
      </div>

      {showEditor && (
        <ExerciseEditor
          key={editingExercise?.id || 'new'}
          initialExercise={editingExercise}
          onSave={editingExercise ? handleUpdateExercise : handleCreateExercise}
          onCancel={closeEditor}
          saving={savingExercise}
        />
      )}

      <section className="exercise-toolbar">
        <div className="search-wrapper">
          <span className="search-icon">⌕</span>

          <input
            type="search"
            placeholder="Search exercises..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          value={muscle}
          onChange={(event) => setMuscle(event.target.value)}
        >
          <option value="">All muscles</option>

          {muscles.map((muscleName) => (
            <option key={muscleName} value={muscleName}>
              {muscleName}
            </option>
          ))}
        </select>
      </section>

      {loading && (
        <div className="exercise-state">
          <div className="loading-dot" />
          <p>Loading exercise library...</p>
        </div>
      )}

      {error && (
        <div className="exercise-state error-state">
          <p>{error}</p>

          <button onClick={loadExercises}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && filteredExercises.length === 0 && (
        <div className="exercise-state">
          <span className="empty-icon">⌕</span>
          <h3>No exercises found</h3>
          <p>
            Try changing your search or muscle filter.
          </p>
        </div>
      )}

      {!loading && !error && filteredExercises.length > 0 && (
        <section className="exercise-grid">
          {filteredExercises.map((exercise) => (
            <article className="exercise-card" key={exercise.id}>
              <Link to={`/exercises/${exercise.id}`} className="exercise-card-link">
                <div className="exercise-card-top"><span className="exercise-number">{String(exercise.id).padStart(2, '0')}</span><span className="arrow">↗</span></div>
                <div className="exercise-card-content"><h2>{exercise.name}</h2>{exercise.primary_muscle && <span className="muscle-tag">{exercise.primary_muscle}</span>}</div>
              </Link>
              <div className="exercise-card-actions">
                <button type="button" onClick={() => { setEditingExercise(exercise); setShowEditor(true) }}>Edit</button>
                <button type="button" className="exercise-delete-button" onClick={() => handleDeleteExercise(exercise)} disabled={deletingExerciseId === exercise.id}>{deletingExerciseId === exercise.id ? 'Deleting...' : 'Delete'}</button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}

export default Exercises
