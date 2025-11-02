'use client'

import { useState, useRef, useEffect } from 'react'
import { Project, useStore } from '@/store'

interface ProjectCardProps {
  project: Project
  isSelected: boolean
  onClick: () => void
}

export default function ProjectCard({ project, isSelected, onClick }: ProjectCardProps) {
  const { renameProject, deleteProject } = useStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(project.name)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }

  const handleSave = () => {
    if (editName.trim()) {
      renameProject(project.id, editName.trim())
    } else {
      setEditName(project.name)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditName(project.name)
      setIsEditing(false)
    }
  }

  const handleBlur = () => {
    handleSave()
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteProject(project.id)
    setShowDeleteConfirm(false)
  }

  return (
    <div
      className={`w-full text-left p-4 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
        isSelected
          ? 'bg-gradient-to-r from-orange-600/30 to-orange-700/30 border border-orange-600/50 shadow-[0_0_0_1px_rgba(234,88,12,0.25)]'
          : 'bg-orange-900/10 hover:bg-orange-900/20 border border-transparent hover:border-orange-900/30'
      }`}
    >
      <div className="flex items-center justify-between mb-1 group">
        {isEditing ? (
          <input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-orange-800/50 border border-orange-600/50 rounded px-2 py-1 text-orange-200 font-semibold focus:outline-none focus:border-orange-500"
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="flex items-center justify-between flex-1">
            <h3 
              className="font-semibold text-orange-200 cursor-pointer flex-1"
              onDoubleClick={handleDoubleClick}
              onClick={(e) => {
                e.stopPropagation()
                onClick()
              }}
            >
              {project.name}
            </h3>
            {!showDeleteConfirm ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDeleteConfirm(true)
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 ml-2"
              >
                ✕
              </button>
            ) : (
              <div className="flex items-center gap-1 ml-2">
                <span className="text-xs text-orange-300">Delete?</span>
                <button
                  onClick={handleDelete}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  ✓
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDeleteConfirm(false)
                  }}
                  className="text-orange-400 hover:text-orange-300 text-sm"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div 
        className="text-sm text-orange-400/60 space-y-1 cursor-pointer"
        onClick={onClick}
      >
        <p>{project.chapters.length} Parts</p>
        <p>{project.characters.length} Characters</p>
      </div>
    </div>
  )
}
