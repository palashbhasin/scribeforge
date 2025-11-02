'use client'

import { useStore } from '@/store'
import { useState } from 'react'

interface CharactersSidebarProps {
  onClose: () => void
}

export default function CharactersSidebar({ onClose }: CharactersSidebarProps) {
  const { projects, selectedProject, activeChapter, setSectionCharacters } = useStore()
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeResponse, setAnalyzeResponse] = useState('')
  
  const project = projects.find((p) => p.id === selectedProject)
  const characters = project?.characters || []
  const analyzedSections = project?.analyzedSections || {}
  
  // Get the selected section/chapter
  const selectedSection = project?.chapters.find(ch => ch.id === activeChapter)

  const handleAnalyzeCharacters = async () => {
    if (!selectedProject) return

    // Check if a section is selected
    if (!activeChapter || !selectedSection) {
      setAnalyzeResponse('⚠️ Please select a section (Part or Chapter) to analyze first.')
      return
    }

    // Don't analyze parts (they have no content)
    if (selectedSection.type === 'part') {
      setAnalyzeResponse('⚠️ Parts cannot be analyzed. Please select a Chapter or other section with content.')
      return
    }

    // Check if section has content
    if (!selectedSection.content || selectedSection.content.trim().length === 0) {
      setAnalyzeResponse('⚠️ Selected section has no content to analyze.')
      return
    }

    setIsAnalyzing(true)
    setAnalyzeResponse('')

    try {
      // Analyze only the selected section's content
      const sectionContent = selectedSection.content
      const sectionName = selectedSection.hierarchyLabel && selectedSection.contentLabel
        ? `${selectedSection.hierarchyLabel}: ${selectedSection.contentLabel}`
        : selectedSection.hierarchyLabel || selectedSection.title
      
      const res = await fetch('/api/identify-characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sectionContent }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Extract detailed error from API response
        const errorMsg = data.error || 'Unknown error'
        const details = data.details || ''
        const hint = data.hint || ''
        throw new Error(`${errorMsg}${details ? ` - ${details}` : ''}${hint ? ` (${hint})` : ''}`)
      }

      if (data.characters && Array.isArray(data.characters)) {
        // Use setSectionCharacters to merge with other analyzed sections
        setSectionCharacters(selectedProject, activeChapter, data.characters)
        
        // Count total characters after merge
        const totalCharacters = Object.values({ ...analyzedSections, [activeChapter]: data.characters })
          .flat()
          .reduce((acc, char) => {
            const key = char.name.toLowerCase()
            if (!acc.has(key)) acc.set(key, char)
            return acc
          }, new Map()).size
        
        const isReanalyzing = activeChapter in analyzedSections
        setAnalyzeResponse(
          isReanalyzing
            ? `✓ Re-analyzed "${sectionName}". Found ${data.characters.length} characters. Total: ${totalCharacters} characters across all analyzed sections.`
            : `✓ Analyzed "${sectionName}". Found ${data.characters.length} characters. Total: ${totalCharacters} characters across all analyzed sections.`
        )
      } else {
        setAnalyzeResponse('No characters found in the selected section.')
      }
    } catch (error: any) {
      console.error('Character analysis error:', error)
      const errorMessage = error.message || 'Failed to analyze characters'
      
      // Show helpful message based on error type
      if (errorMessage.includes('API key') || errorMessage.includes('OPENAI_API_KEY')) {
        setAnalyzeResponse(`Error: API key not configured. Please add OPENAI_API_KEY to .env.local file and restart the server.`)
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        setAnalyzeResponse(`Error: Rate limit exceeded. Please wait a moment and try again.`)
      } else if (errorMessage.includes('context length') || errorMessage.includes('tokens')) {
        setAnalyzeResponse(`Error: Section is too long. Please select a shorter section to analyze.`)
      } else {
        setAnalyzeResponse(`Error: ${errorMessage}`)
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (!project) {
    return (
      <div className="w-96 bg-[#1f1612] border-l border-orange-900/30 flex flex-col">
        <div className="p-4 border-b border-orange-900/30 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-orange-400 relative z-50">👥 Characters</h3>
          <button onClick={onClose} className="text-orange-400/60 hover:text-orange-400">
            ✕
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-orange-300/60">No project selected</p>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute right-0 top-16 h-[calc(100vh-4rem)] w-96 bg-[#1f1612] border-l border-orange-900/30 flex z-20 shadow-2xl animate-sf-slide-in-right">
      {/* Character List */}
      <div className="w-48 border-r border-orange-900/30 flex flex-col">
        <div className="p-4 border-b border-orange-900/30 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wide">
            Characters
          </h3>
          <button onClick={onClose} className="text-orange-400/60 hover:text-orange-400 text-xs">
            ✕
          </button>
        </div>
        <div className="p-3 border-b border-orange-900/20">
          {activeChapter && selectedSection && selectedSection.type !== 'part' && (
            <div className="mb-2 text-xs text-orange-400/70">
              Analyzing: <span className="font-semibold text-orange-300">
                {selectedSection.hierarchyLabel && selectedSection.contentLabel
                  ? `${selectedSection.hierarchyLabel}: ${selectedSection.contentLabel}`
                  : selectedSection.hierarchyLabel || selectedSection.title}
              </span>
            </div>
          )}
          <button
            onClick={handleAnalyzeCharacters}
            disabled={isAnalyzing || !project || !activeChapter || !selectedSection || selectedSection.type === 'part'}
            className="w-full px-3 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg text-sm font-semibold hover:from-orange-700 hover:to-orange-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
          >
            {isAnalyzing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-sf-spin"></div>
              </div>
            )}
            <span className={isAnalyzing ? 'opacity-0' : ''}>{isAnalyzing ? 'Analyzing...' : 'Analyze Characters'}</span>
          </button>
          {analyzeResponse && (
            <p className="mt-2 text-xs text-orange-300/80 leading-relaxed">{analyzeResponse}</p>
          )}
          {Object.keys(analyzedSections).length > 0 && (
            <div className="mt-3 pt-3 border-t border-orange-900/20">
              <p className="text-xs text-orange-400/60 mb-1">Analyzed sections:</p>
              <div className="space-y-1">
                {Object.keys(analyzedSections).map((sectionId) => {
                  const section = project?.chapters.find(ch => ch.id === sectionId)
                  if (!section) return null
                  const sectionName = section.hierarchyLabel && section.contentLabel
                    ? `${section.hierarchyLabel}: ${section.contentLabel}`
                    : section.hierarchyLabel || section.title
                  return (
                    <div key={sectionId} className="text-xs text-orange-300/50 flex items-center gap-1">
                      <span className="text-orange-400/40">✓</span>
                      <span className="truncate">{sectionName}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {characters.length === 0 ? (
            <div className="text-center mt-8">
              <p className="text-xs text-orange-300/60">No characters yet</p>
              <p className="text-xs text-orange-400/40 mt-2">Click "Analyze Characters" above</p>
            </div>
          ) : (
            <div className="space-y-1">
              {characters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => setSelectedCharacter(character.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedCharacter === character.id
                      ? 'bg-orange-600/30 text-orange-200'
                      : 'bg-orange-900/10 text-orange-300/80 hover:bg-orange-900/20'
                  }`}
                >
                  <div className="font-medium text-sm truncate">{character.name}</div>
                  <div className="text-xs text-orange-400/50 mt-1">
                    {character.traits.length} traits
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Character Details */}
      <div className="flex-1 overflow-y-auto p-4">
        {!selectedCharacter ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-5xl mb-3">👤</div>
              <p className="text-orange-300/60 text-sm">Select a character to view details</p>
            </div>
          </div>
        ) : (
          (() => {
            const character = characters.find((c) => c.id === selectedCharacter)
            if (!character) return null

            return (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-orange-300 mb-2">{character.name}</h2>
                  <p className="text-sm text-orange-200 whitespace-pre-wrap break-words">{character.description}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-orange-400 mb-2 uppercase tracking-wide">
                    Traits
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {character.traits.map((trait, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-orange-900/30 border border-orange-800/30 rounded-full text-xs text-orange-300 whitespace-normal"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()
        )}
      </div>
    </div>
  )
}
