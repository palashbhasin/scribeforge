'use client'

import { useState, useRef, useEffect } from 'react'
import { useStore, Chapter } from '@/store'

export default function WritingSpace() {
  const { projects, selectedProject, updateChapter, renameChapter, deleteChapter, addChapter, updateChapterLabel, reorderChapters, activeChapter, setActiveChapter } = useStore()
  const [editingChapter, setEditingChapter] = useState<string | null>(null)
  const [editingContentLabel, setEditingContentLabel] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const project = projects.find((p) => p.id === selectedProject)
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set())
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const chapter = project?.chapters.find((c) => c.id === activeChapter)
  
  // Organize chapters: Cover -> TOC -> Parts -> Chapters (nested under parts)
  const sortedChapters = [...(project?.chapters || [])].sort((a, b) => {
    // Define type priority: cover (-1), toc (0), part (1), chapter (2), other (3)
    const getTypePriority = (type?: string) => {
      if (type === 'cover') return -1
      if (type === 'toc') return 0
      if (type === 'part') return 1
      if (type === 'chapter') return 2
      return 3
    }
    
    const priorityA = getTypePriority(a.type)
    const priorityB = getTypePriority(b.type)
    
    if (priorityA !== priorityB) return priorityA - priorityB
    
    // Within same type, sort by order
    const orderA = a.order ?? 999
    const orderB = b.order ?? 999
    return orderA - orderB
  })
  
  const coverSection = sortedChapters.find(ch => ch.type === 'cover')
  const tocSection = sortedChapters.find(ch => ch.type === 'toc')
  const parts = sortedChapters.filter(ch => ch.type === 'part').sort((a, b) => (a.order || 0) - (b.order || 0))
  
  // Organize parts with their chapters
  const organizedParts = parts.map(part => ({
    ...part,
    chapters: sortedChapters
      .filter(ch => ch.type === 'chapter' && (ch.partId === part.id || ch.partId === part.title))
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  }))
  
  // Get other sections (prologue, epilogue, etc.)
  const otherSections = sortedChapters.filter(ch => 
    !['cover', 'toc', 'part', 'chapter'].includes(ch.type || 'other')
  )

  useEffect(() => {
    if (project) {
      const partsSet = new Set(parts.map(p => p.id))
      setExpandedParts(partsSet)
    }
  }, [project?.id])

  useEffect(() => {
    if (chapter && textareaRef.current) {
      textareaRef.current.value = chapter.content
    }
  }, [activeChapter, chapter])

  const handleAddSection = (type: 'part' | 'chapter' | 'toc' | 'cover', partId?: string | null) => {
    if (!selectedProject) return
    
    const partCount = parts.length
    const chapterCount = sortedChapters.filter(ch => ch.type === 'chapter').length
    
    let newChapter: Chapter
    if (type === 'part') {
      newChapter = {
        id: Date.now().toString() + Math.random(),
        title: `PART ${partCount + 1}`,
        hierarchyLabel: `Part ${partCount + 1}`,
        contentLabel: '',
        content: '',
        type: 'part',
        order: sortedChapters.filter(ch => ch.type === 'part').length,
      }
    } else if (type === 'chapter') {
      const currentPart = partId ? parts.find(p => p.id === partId) : null
      const chaptersInPart = currentPart ? sortedChapters.filter(ch => ch.type === 'chapter' && ch.partId === currentPart.id).length : 0
      newChapter = {
        id: Date.now().toString() + Math.random(),
        title: `Chapter ${chaptersInPart + 1}`,
        hierarchyLabel: `Chapter ${chaptersInPart + 1}`,
        contentLabel: '',
        content: '',
        type: 'chapter',
        partId: currentPart?.id || null,
        order: sortedChapters.length,
      }
    } else if (type === 'toc') {
      newChapter = {
        id: Date.now().toString() + Math.random(),
        title: 'Table of Contents',
        hierarchyLabel: 'Table of Contents',
        contentLabel: '',
        content: '',
        type: 'toc',
        order: sortedChapters.length,
      }
    } else { // cover
      newChapter = {
        id: Date.now().toString() + Math.random(),
        title: 'Cover',
        hierarchyLabel: 'Cover',
        contentLabel: '',
        content: '',
        type: 'cover',
        order: -1, // Cover always first
      }
    }
    
    addChapter(selectedProject, newChapter)
    if (type === 'part') {
      setExpandedParts(prev => new Set([...prev, newChapter.id]))
    }
    setActiveChapter(newChapter.id)
    setEditingChapter(newChapter.id)
    setEditTitle(newChapter.contentLabel || '')
    setEditingContentLabel(true)
  }

  const handleChapterTitleEdit = (chapterId: string, isContentLabel: boolean = false) => {
    const ch = project?.chapters.find((c) => c.id === chapterId)
    if (ch) {
      setEditTitle(isContentLabel ? (ch.contentLabel || '') : (ch.hierarchyLabel || ch.title))
      setEditingChapter(chapterId)
      setEditingContentLabel(isContentLabel)
    }
  }

  const handleTitleSave = () => {
    if (editingChapter && selectedProject) {
      const ch = project?.chapters.find((c) => c.id === editingChapter)
      if (ch) {
        if (editingContentLabel) {
          updateChapterLabel(selectedProject, editingChapter, undefined, editTitle.trim())
        } else {
          updateChapterLabel(selectedProject, editingChapter, editTitle.trim(), undefined)
        }
      }
    }
    setEditingChapter(null)
    setEditingContentLabel(false)
    setEditTitle('')
  }

  const handleTitleCancel = () => {
    setEditingChapter(null)
    setEditingContentLabel(false)
    setEditTitle('')
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      handleTitleCancel()
    }
  }

  const handleDeleteChapter = (chapterId: string) => {
    if (selectedProject) {
      deleteChapter(selectedProject, chapterId)
      if (activeChapter === chapterId) {
        setActiveChapter(null)
      }
    }
    setDeleteConfirm(null)
  }

  const handleDragStart = (e: React.DragEvent, chapterId: string) => {
    setDraggedItem(chapterId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, chapterId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(chapterId)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedItem || !selectedProject || draggedItem === targetId) {
      setDraggedItem(null)
      setDragOver(null)
      return
    }

    const allChapters = sortedChapters
    const draggedIndex = allChapters.findIndex(c => c.id === draggedItem)
    const targetIndex = allChapters.findIndex(c => c.id === targetId)
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null)
      setDragOver(null)
      return
    }

    const reordered = [...allChapters]
    const [removed] = reordered.splice(draggedIndex, 1)
    reordered.splice(targetIndex, 0, removed)
    
    reorderChapters(selectedProject, reordered.map(c => c.id))
    setDraggedItem(null)
    setDragOver(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOver(null)
  }

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚙️</div>
          <h2 className="text-2xl font-bold text-orange-400 mb-2">Welcome to ScribeForge</h2>
          <p className="text-orange-300/60">Select or create a project to get started</p>
        </div>
      </div>
    )
  }

  const renderSection = (section: Chapter, isNested: boolean = false) => {
    const isPart = section.type === 'part'
    const isExpanded = expandedParts.has(section.id)
    // For parts: always show "Part 1: name" format (single combined display)
    // Combine hierarchy label and content label: "Part 1: The Affair"
    const hierarchyLabel = section.hierarchyLabel || section.title.replace(/^PART\s+/i, 'Part ')
    const contentLabel = section.contentLabel || ''
    // Always combine for parts as "Part 1: name" (never show separately)
    // Only add colon if contentLabel exists (no trailing colon)
    const displayTitle = isPart 
      ? (contentLabel ? `${hierarchyLabel}: ${contentLabel}` : hierarchyLabel)
      : (contentLabel ? `${hierarchyLabel}: ${contentLabel}` : hierarchyLabel)
    const isEditing = editingChapter === section.id
    const isEditingLabel = isEditing && editingContentLabel
    const isEditingHierarchy = isEditing && !editingContentLabel

    return (
      <div 
        key={section.id}
        draggable
        onDragStart={(e) => handleDragStart(e, section.id)}
        onDragOver={(e) => handleDragOver(e, section.id)}
        onDrop={(e) => handleDrop(e, section.id)}
        onDragEnd={handleDragEnd}
        className={`group relative ${draggedItem === section.id ? 'opacity-50' : ''} ${dragOver === section.id ? 'ring-2 ring-orange-400' : ''}`}
      >
        {isEditingLabel ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            className={`w-full ${isPart ? 'p-2' : 'p-2'} bg-orange-600/30 border border-orange-500 rounded text-orange-200 ${isPart ? 'font-semibold text-sm' : 'text-xs'} focus:outline-none focus:border-orange-400`}
            placeholder="Content label (e.g., The Affair)"
            autoFocus
          />
        ) : isEditingHierarchy ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            className={`w-full ${isPart ? 'p-2' : 'p-2'} bg-orange-600/30 border border-orange-500 rounded text-orange-200 ${isPart ? 'font-semibold text-sm' : 'text-xs'} focus:outline-none focus:border-orange-400`}
            placeholder="Hierarchy label (e.g., Part 1)"
            autoFocus
          />
        ) : (
          <div className={`flex items-center gap-1 ${isNested ? 'ml-6' : ''}`}>
            {isPart && (
              <button
                onClick={() => setExpandedParts(prev => {
                  const next = new Set(prev)
                  if (next.has(section.id)) next.delete(section.id)
                  else next.add(section.id)
                  return next
                })}
                className="text-orange-400 hover:text-orange-300 transition-colors w-5 h-5 flex items-center justify-center"
              >
                <svg 
                  className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setActiveChapter(section.id)}
              onDoubleClick={() => handleChapterTitleEdit(section.id, false)}
              className={`flex-1 text-left ${isPart ? 'p-2' : 'p-2'} rounded-lg transition-colors ${
                activeChapter === section.id
                  ? 'bg-orange-600/30 text-orange-200'
                  : isPart 
                    ? 'bg-orange-900/20 text-orange-300 font-semibold text-sm hover:bg-orange-900/30'
                    : 'bg-orange-900/10 text-orange-300/80 text-xs hover:bg-orange-900/20'
              }`}
            >
              <div className="break-words whitespace-normal font-semibold">
                {displayTitle}
              </div>
            </button>
            {section.contentLabel && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleChapterTitleEdit(section.id, true)
                }}
                className="text-orange-400/50 hover:text-orange-400 text-xs px-1"
                title="Edit content label"
              >
                ✎
              </button>
            )}
            {deleteConfirm === section.id ? (
              <div className="flex items-center gap-1">
                <button onClick={() => handleDeleteChapter(section.id)} className="text-red-400 hover:text-red-300 text-xs px-1">✓</button>
                <button onClick={() => setDeleteConfirm(null)} className="text-orange-400 hover:text-orange-300 text-xs px-1">✕</button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirm(section.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 px-1 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sections List */}
      <div className="w-80 border-r border-orange-900/30 bg-[#1f1612] overflow-y-auto no-scrollbar">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-orange-400/80 uppercase tracking-wide">
              Parts
            </h3>
            <div className="flex gap-1">
              <button
                onClick={() => handleAddSection('cover')}
                className="px-2 py-1 bg-orange-700/30 hover:bg-orange-700/50 text-orange-300 text-xs rounded transition-colors"
                title="Add Cover"
              >
                +C
              </button>
              <button
                onClick={() => handleAddSection('toc')}
                className="px-2 py-1 bg-orange-700/30 hover:bg-orange-700/50 text-orange-300 text-xs rounded transition-colors"
                title="Add Table of Contents"
              >
                +TOC
              </button>
              <button
                onClick={() => handleAddSection('part')}
                className="px-2 py-1 bg-orange-700/30 hover:bg-orange-700/50 text-orange-300 text-xs rounded transition-colors"
                title="Add Part"
              >
                +P
              </button>
              <button
                onClick={() => handleAddSection('chapter')}
                className="px-2 py-1 bg-orange-700/30 hover:bg-orange-700/50 text-orange-300 text-xs rounded transition-colors"
                title="Add Chapter"
              >
                +Ch
              </button>
            </div>
          </div>
          <div className="space-y-1">
            {coverSection && renderSection(coverSection)}
            {tocSection && renderSection(tocSection)}
            {organizedParts.map((section) => {
              const isPart = section.type === 'part'
              const isExpanded = expandedParts.has(section.id)
              
              return (
                <div key={section.id} className="space-y-1">
                  {renderSection(section)}
                  {isPart && isExpanded && (
                    <div className="ml-6 space-y-1 border-l border-orange-800/30 pl-2">
                      {section.chapters.map((ch: Chapter) => renderSection(ch, true))}
                      <button
                        onClick={() => handleAddSection('chapter', section.id)}
                        className="w-full text-left p-2 text-orange-400/50 hover:text-orange-400 hover:bg-orange-900/10 rounded text-xs transition-colors"
                      >
                        + Add Chapter
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            {otherSections.map(section => renderSection(section))}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {chapter ? (
          <>
            <div className="p-4 border-b border-orange-900/30">
              <h2 className="text-xl font-semibold text-orange-200">
                {chapter.contentLabel 
                  ? `${chapter.hierarchyLabel || chapter.title}: ${chapter.contentLabel}`
                  : (chapter.hierarchyLabel || chapter.title)
                }
              </h2>
            </div>
            <textarea
              ref={textareaRef}
              className="flex-1 p-6 bg-transparent text-orange-100 placeholder-orange-400/40 focus:outline-none resize-none whitespace-pre-wrap break-words"
              placeholder="Start writing..."
              onChange={(e) => {
                updateChapter(project.id, chapter.id, e.target.value)
              }}
              style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-orange-300/60">Select a part or organize text with AI Agent</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
