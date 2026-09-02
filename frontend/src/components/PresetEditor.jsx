import { useMemo, useState } from 'react'

const emptyExercise = () => ({ exercise_id: '', target_sets: 3, target_reps: 8 })

function PresetEditor({ exercises, initialPreset = null, onSave, onCancel, saving }) {
  const [name, setName] = useState(initialPreset?.name || '')
  const [description, setDescription] = useState(initialPreset?.description || '')
  const [rows, setRows] = useState(
    initialPreset?.exercises?.length
      ? initialPreset.exercises.map((exercise) => ({
          exercise_id: String(exercise.exercise_id),
          target_sets: exercise.target_sets || 3,
          target_reps: exercise.target_reps || 8,
        }))
      : [emptyExercise()],
  )

  const selectedIds = useMemo(
    () => new Set(rows.map((row) => row.exercise_id).filter(Boolean)),
    [rows],
  )
  const canSave = name.trim() && rows.length > 0 && rows.every((row) => row.exercise_id)

  const updateRow = (index, field, value) => {
    setRows((current) => current.map((row, rowIndex) =>
      rowIndex === index ? { ...row, [field]: value } : row,
    ))
  }

  const moveRow = (index, direction) => {
    const target = index + direction
    if (target < 0 || target >= rows.length) return
    setRows((current) => {
      const reordered = [...current]
      const moved = reordered[index]
      reordered[index] = reordered[target]
      reordered[target] = moved
      return reordered
    })
  }

  const removeRow = (index) => {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!canSave || saving) return
    onSave({
      name: name.trim(),
      description: description.trim() || null,
      exercises: rows.map((row, index) => ({
        exercise_id: Number(row.exercise_id),
        order: index + 1,
        target_sets: Number(row.target_sets),
        target_reps: Number(row.target_reps),
      })),
    })
  }

  return (
    <form className="preset-editor" onSubmit={handleSubmit}>
      <div className="preset-editor-heading">
        <div>
          <span className="eyebrow">{initialPreset ? 'EDIT PRESET' : 'NEW PRESET'}</span>
          <h2>{initialPreset ? `Update ${initialPreset.name}` : 'Build a workout preset'}</h2>
        </div>
        <button type="button" className="preset-editor-close" onClick={onCancel}>×</button>
      </div>

      <div className="preset-editor-fields">
        <label>
          <span>NAME</span>
          <input value={name} maxLength={150} onChange={(event) => setName(event.target.value)} placeholder="Upper Body Strength" autoFocus />
        </label>
        <label>
          <span>DESCRIPTION</span>
          <input value={description} maxLength={1000} onChange={(event) => setDescription(event.target.value)} placeholder="Optional training focus" />
        </label>
      </div>

      <div className="preset-editor-exercises">
        <div className="preset-editor-labels"><span>ORDER</span><span>EXERCISE</span><span>SETS</span><span>REPS</span><span>ACTIONS</span></div>
        {rows.map((row, index) => (
          <div className="preset-editor-row" key={`${index}-${row.exercise_id}`}>
            <strong>{String(index + 1).padStart(2, '0')}</strong>
            <select value={row.exercise_id} onChange={(event) => updateRow(index, 'exercise_id', event.target.value)}>
              <option value="">Choose exercise</option>
              {exercises.map((exercise) => (
                <option
                  value={exercise.id}
                  disabled={selectedIds.has(String(exercise.id)) && row.exercise_id !== String(exercise.id)}
                  key={exercise.id}
                >
                  {exercise.name}
                </option>
              ))}
            </select>
            <input type="number" min="1" max="10" value={row.target_sets} onChange={(event) => updateRow(index, 'target_sets', event.target.value)} aria-label={`Sets for exercise ${index + 1}`} />
            <input type="number" min="1" max="100" value={row.target_reps} onChange={(event) => updateRow(index, 'target_reps', event.target.value)} aria-label={`Reps for exercise ${index + 1}`} />
            <div className="preset-row-actions">
              <button type="button" onClick={() => moveRow(index, -1)} disabled={index === 0} aria-label="Move exercise up">↑</button>
              <button type="button" onClick={() => moveRow(index, 1)} disabled={index === rows.length - 1} aria-label="Move exercise down">↓</button>
              <button type="button" className="preset-row-remove" onClick={() => removeRow(index)} disabled={rows.length === 1} aria-label="Remove exercise">×</button>
            </div>
          </div>
        ))}
      </div>

      <div className="preset-editor-footer">
        <button type="button" className="preset-add-exercise" onClick={() => setRows((current) => [...current, emptyExercise()])} disabled={rows.length >= exercises.length}>+ Add exercise</button>
        <div>
          <button type="button" className="preset-cancel" onClick={onCancel}>Cancel</button>
          <button type="submit" className="preset-save" disabled={!canSave || saving}>{saving ? 'Saving...' : initialPreset ? 'Save changes' : 'Create preset'}</button>
        </div>
      </div>
    </form>
  )
}

export default PresetEditor
