import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createExercise, getExercises } from '../services/api'
import ExerciseEditor from '../components/ExerciseEditor'
import './Exercises.css'

function Exercises() {
  const [exercises, setExercises] = useState([])
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [savingExercise, setSavingExercise] = useState(false)

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
          <button type="button" onClick={() => setShowEditor(true)}>+ Add exercise</button>
        </div>
      </div>

      {showEditor && (
        <ExerciseEditor
          onSave={handleCreateExercise}
          onCancel={() => setShowEditor(false)}
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
            <Link
              key={exercise.id}
              to={`/exercises/${exercise.id}`}
              className="exercise-card"
            >
              <div className="exercise-card-top">
                <span className="exercise-number">
                  {String(exercise.id).padStart(2, '0')}
                </span>

                <span className="arrow">↗</span>
              </div>

              <div className="exercise-card-content">
                <h2>{exercise.name}</h2>

                {exercise.primary_muscle && (
                  <span className="muscle-tag">
                    {exercise.primary_muscle}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  )
}

export default Exercises
