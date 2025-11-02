'use client'

import { useState, useRef } from 'react'
import ProjectCard from '@/components/ProjectCard'
import AISidebar from '@/components/AISidebar'
import WritingSpace from '@/components/WritingSpace'
import CharactersSidebar from '@/components/CharactersSidebar'
import Logo from '@/components/Logo'
import { useStore, Project, Chapter } from '@/store'

export default function Home() {
  const { projects, selectedProject, selectProject, addProject, renameProject, addChapter } = useStore()
  const [showAISidebar, setShowAISidebar] = useState(false)
  const [showCharactersSidebar, setShowCharactersSidebar] = useState(false)
  const [isEditingProjectName, setIsEditingProjectName] = useState(false)
  const [editProjectName, setEditProjectName] = useState('')
  const projectNameInputRef = useRef<HTMLInputElement>(null)

  const currentProject = projects.find((p) => p.id === selectedProject)

  const handleProjectNameEdit = () => {
    if (currentProject) {
      setEditProjectName(currentProject.name)
      setIsEditingProjectName(true)
      setTimeout(() => projectNameInputRef.current?.focus(), 0)
    }
  }

  const handleProjectNameSave = () => {
    if (selectedProject && editProjectName.trim()) {
      renameProject(selectedProject, editProjectName.trim())
    }
    setIsEditingProjectName(false)
  }

  const handleProjectNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleProjectNameSave()
    } else if (e.key === 'Escape') {
      setIsEditingProjectName(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Sidebar - Projects */}
      <div className="w-64 bg-[#1f1612] border-r border-orange-900/30 flex flex-col">
        <div className="p-6 border-b border-orange-900/30">
          <Logo />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <button
            onClick={() => {
              const projectId = Date.now().toString()
              const newProject: Project = {
                id: projectId,
                name: `Project ${projects.length + 1}`,
                chapters: [],
                characters: [],
                createdAt: new Date().toISOString(),
              }
              addProject(newProject)
              selectProject(projectId)
              
              // Add default Cover and Table of Contents
              const coverChapter: Chapter = {
                id: `cover-${Date.now()}`,
                title: 'Cover',
                hierarchyLabel: 'Cover',
                contentLabel: '',
                content: '',
                type: 'cover',
                order: -1,
              }
              const tocChapter: Chapter = {
                id: `toc-${Date.now()}-${Math.random()}`,
                title: 'Table of Contents',
                hierarchyLabel: 'Table of Contents',
                contentLabel: '',
                content: '',
                type: 'toc',
                order: 0,
              }
              addChapter(projectId, coverChapter)
              addChapter(projectId, tocChapter)
            }}
            className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg font-semibold hover:from-orange-700 hover:to-orange-800 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            + New Project
          </button>
          <div className="space-y-2">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isSelected={selectedProject === project.id}
                onClick={() => selectProject(project.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-[#1f1612] via-[#2d2119] to-[#3a281f] relative">
        {/* Top Bar */}
        <div className="h-16 border-b border-orange-900/30 flex items-center px-6 justify-between relative z-30 backdrop-blur-sm bg-[#1f1612]/40">
          {isEditingProjectName && currentProject ? (
            <input
              ref={projectNameInputRef}
              value={editProjectName}
              onChange={(e) => setEditProjectName(e.target.value)}
              onBlur={handleProjectNameSave}
              onKeyDown={handleProjectNameKeyDown}
              className="text-xl font-semibold text-orange-400 bg-orange-900/20 border border-orange-600/30 rounded px-3 py-1 focus:outline-none focus:border-orange-500"
              autoFocus
            />
          ) : (
            <h2 
              className="text-xl font-semibold text-orange-400 cursor-pointer hover:text-orange-300 relative z-40"
              onDoubleClick={handleProjectNameEdit}
            >
              {currentProject?.name || 'No Project Selected'}
            </h2>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowCharactersSidebar(false)
                setShowAISidebar(!showAISidebar)
              }}
              className={`relative z-50 px-4 py-2 rounded-lg transition-all border hover:-translate-y-0.5 hover:shadow-md ${
                showAISidebar
                  ? 'bg-orange-600/40 text-orange-300 border-orange-500/50'
                  : 'bg-orange-600/20 text-orange-400 border-orange-700/30 hover:bg-orange-600/30'
              }`}
            >
              🤖 Agent
            </button>
            <button
              onClick={() => {
                setShowAISidebar(false)
                setShowCharactersSidebar(!showCharactersSidebar)
              }}
              className={`px-4 py-2 rounded-lg transition-all border hover:-translate-y-0.5 hover:shadow-md ${
                showCharactersSidebar
                  ? 'bg-orange-600/40 text-orange-300 border-orange-500/50'
                  : 'bg-orange-600/20 text-orange-400 border-orange-700/30 hover:bg-orange-600/30'
              }`}
            >
              👥 Characters
            </button>
          </div>
        </div>

        {/* Writing Space */}
        <WritingSpace />
      </div>

      {/* AI Sidebar */}
      {showAISidebar && (
        <AISidebar onClose={() => setShowAISidebar(false)} />
      )}

      {/* Characters Sidebar */}
      {showCharactersSidebar && (
        <CharactersSidebar onClose={() => setShowCharactersSidebar(false)} />
      )}
    </div>
  )
}
