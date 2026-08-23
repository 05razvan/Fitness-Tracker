import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getExercises } from '../services/api'
import './Exercises.css'

function Exercises() {
  const [exercises, setExercises] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadExercises = async () => {
      try {
        setLoading(true)
        const data = await getExercises({
          search: search || undefined,
        })
        setExercises(data)
      } catch (err) {
        console.error(err)
        setError('Unable to load exercises.')
      } finally {
        setLoading(false)
      }
    }

    const timeout = setTimeout(loadExercises, 250)

    return () => clearTimeout(timeout)
  }, [search])

  return (
    <main className="exercises-page">
      <header className="exercises-header">
        <div>
          <span className="eyebrow">LIBRARY</span>
          <h1>Exercises</h1>
          <p>
            Your exercise library and performance history.
          </p>
        </div>

        <div className="exercise-count">
          <strong>{exercises.length}</strong>
          <span>EXERCISES</span>
        </div>
      </header>

      <section className="exercise-toolbar">
        <div className="search-wrapper">
          <span className="search-icon">⌕</span>
          <input
            type="search"
            placeholder="Search exercises..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search exercises"
          />
        </div>
      </section>

      {loading ? (
        <div className="exercise-state">
          <span className="loading-dot" />
          Loading exercises...
        </div>
      ) : error ? (
        <div className="exercise-state error">
          {error}
        </div>
      ) : exercises.length === 0 ? (
        <div className="exercise-state">
          No exercises found.
        </div>
      ) : (
        <section className="exercise-grid">
          {exercises.map((exercise) => (
            <Link
              to={`/exercises/${exercise.id}`}
              className="exercise-library-card"
              key={exercise.id}
            >
              <div className="exercise-card-top">
                <span className="exercise-id">
                  {String(exercise.id).padStart(3, '0')}
                </span>

                <span className="exercise-arrow">↗</span>
              </div>

              <div className="exercise-card-content">
                <h2>{exercise.name}</h2>

                <div className="exercise-meta">
                  {exercise.primary_muscle && (
                    <span>{exercise.primary_muscle}</span>
                  )}

                  {exercise.category && (
                    <span>{exercise.category}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  )
}

export default Exercises
