import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * Sortable item component for drag-and-drop
 */
function SortableItem({ id, value, isDistractor, index }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 mb-2 rounded border cursor-move select-none ${
        isDistractor
          ? 'bg-red-50 border-red-300 text-red-800'
          : 'bg-white border-gray-300 hover:border-blue-400 hover:shadow-md'
      } ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-mono">{value}</span>
        {isDistractor && (
          <span className="text-xs text-red-600 font-semibold ml-2">(distractor)</span>
        )}
      </div>
    </div>
  );
}

/**
 * WebParsons Editor Component
 */
function WebParsonsEditor({ puzzle, onOrderChange, onStepLog }) {
  const [items, setItems] = useState([]);
  const [distractors, setDistractors] = useState([]);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (puzzle) {
      // Combine lines and distractors, then shuffle
      const allItems = [...(puzzle.lines || []), ...(puzzle.distractors || [])];
      const shuffled = [...allItems].sort(() => Math.random() - 0.5);
      
      setItems(shuffled);
      setDistractors(puzzle.distractors || []);
    }
  }, [puzzle]);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Log the move event
        const stepLog = {
          timestamp: new Date().toISOString(),
          action: 'move',
          from: oldIndex,
          to: newIndex,
          item: active.id,
        };
        
        if (onStepLog) {
          onStepLog(stepLog);
        }
        
        // Calculate current order (only for non-distractors)
        const currentOrder = newItems
          .map((item, index) => ({ item, index }))
          .filter(({ item }) => !distractors.includes(item))
          .map(({ item }) => (puzzle.lines || []).indexOf(item))
          .filter(idx => idx !== -1);
        
        if (onOrderChange) {
          onOrderChange(currentOrder);
        }
        
        return newItems;
      });
    }
  };

  return (
    <div className="webparsons-editor">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-2">
          <div className="text-sm text-gray-600 mb-3">
            Drag and drop the code lines into the correct order. Red items are distractors.
          </div>
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            {items.map((item, index) => (
              <SortableItem
                key={item}
                id={item}
                value={item}
                isDistractor={distractors.includes(item)}
                index={index}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>
    </div>
  );
}

/**
 * Play Page Component
 */
export default function Play() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [puzzle, setPuzzle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  
  // Track puzzle attempt state
  const startTimeRef = useRef(null);
  const stepsLogRef = useRef([]);
  const attemptsCountRef = useRef(1);
  const currentOrderRef = useRef([]);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    loadPuzzle();
  }, [id]);

  const loadPuzzle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/api/v1/puzzle/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load puzzle: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform backend response to expected format
      const puzzleData = {
        id: data.puzzle?.id || data.id,
        title: data.puzzle?.title || data.title,
        description: data.puzzle?.description || data.description,
        difficulty: data.puzzle?.difficulty || data.difficulty,
        category: data.puzzle?.category || data.category,
        lines: data.puzzle?.segments || data.segments || [],
        distractors: data.puzzle?.distractors || data.distractors || [],
        correctOrder: data.puzzle?.correct_order || data.correct_order || [],
        language: data.puzzle?.language || data.language || 'python',
      };
      
      setPuzzle(puzzleData);
      startTimeRef.current = new Date().toISOString();
      stepsLogRef.current = [];
      currentOrderRef.current = [];
    } catch (err) {
      console.error('Error loading puzzle:', err);
      setError(err.message || 'Failed to load puzzle');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderChange = (newOrder) => {
    currentOrderRef.current = newOrder;
  };

  const handleStepLog = (stepLog) => {
    stepsLogRef.current.push(stepLog);
  };

  const handleSubmit = async () => {
    if (!puzzle) return;

    try {
      setSubmitting(true);
      setError(null);

      const endTime = new Date().toISOString();
      
      const submitData = {
        steps_log: stepsLogRef.current,
        end_time: endTime,
        attempts_count: attemptsCountRef.current,
        start_time: startTimeRef.current,
        solution_order: currentOrderRef.current,
      };

      const response = await fetch(`${API_BASE}/api/v1/puzzle/${id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Submission failed: ${response.statusText}`);
      }

      const result = await response.json();
      setSubmitResult(result);
      
      // Increment attempts count for next attempt
      attemptsCountRef.current += 1;
      
    } catch (err) {
      console.error('Error submitting puzzle:', err);
      setError(err.message || 'Failed to submit puzzle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTryAgain = () => {
    setSubmitResult(null);
    stepsLogRef.current = [];
    startTimeRef.current = new Date().toISOString();
    // Reload puzzle to reset order
    loadPuzzle();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading puzzle...</div>
        </div>
      </div>
    );
  }

  if (error && !puzzle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 text-lg mb-4">Error</div>
          <div className="text-gray-700 mb-4">{error}</div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {puzzle?.title || 'Puzzle'}
          </h1>
          {puzzle?.description && (
            <p className="text-gray-600 mb-2">{puzzle.description}</p>
          )}
          <div className="flex gap-4 text-sm text-gray-500">
            {puzzle?.difficulty && (
              <span className="capitalize">Difficulty: {puzzle.difficulty}</span>
            )}
            {puzzle?.category && <span>Category: {puzzle.category}</span>}
            {puzzle?.language && <span>Language: {puzzle.language}</span>}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {/* Submit Result */}
        {submitResult && (
          <div className={`mb-4 p-4 rounded border ${
            submitResult.correct || submitResult.is_correct
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            <div className="font-semibold mb-2">
              {submitResult.correct || submitResult.is_correct ? '✓ Correct!' : 'Not quite right'}
            </div>
            {submitResult.feedback && (
              <div className="text-sm mb-2">{submitResult.feedback}</div>
            )}
            {submitResult.score !== undefined && (
              <div className="text-sm">Score: {submitResult.score}/100</div>
            )}
            <button
              onClick={handleTryAgain}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* WebParsons Editor */}
        {puzzle && !submitResult && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <WebParsonsEditor
              puzzle={puzzle}
              onOrderChange={handleOrderChange}
              onStepLog={handleStepLog}
            />
          </div>
        )}

        {/* Submit Button */}
        {puzzle && !submitResult && (
          <div className="flex justify-end gap-4">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
            >
              {submitting ? 'Submitting...' : 'Submit Solution'}
            </button>
          </div>
        )}

        {/* Debug Info (remove in production) */}
        {import.meta.env.DEV && (
          <div className="mt-8 p-4 bg-gray-100 rounded text-xs font-mono">
            <div>Attempts: {attemptsCountRef.current}</div>
            <div>Steps Logged: {stepsLogRef.current.length}</div>
            <div>Current Order: {JSON.stringify(currentOrderRef.current)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

