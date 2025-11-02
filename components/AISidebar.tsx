'use client'

import { useState } from 'react'
import { useStore } from '@/store'
import { Chapter } from '@/store'

interface AISidebarProps {
  onClose: () => void
}

export default function AISidebar({ onClose }: AISidebarProps) {
  const { selectedProject, addChapter, setCharacters } = useStore()
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [response, setResponse] = useState('')

  const handleOrganize = async () => {
    if (!selectedProject || !inputText.trim()) return

    setIsProcessing(true)
    setResponse('')

    try {
      const res = await fetch('/api/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      })

      const data = await res.json()

      if (data.chapters) {
        // Sort: Parts first, then other sections
        const sorted = [...data.chapters].sort((a, b) => {
          if (a.type === 'part' && b.type !== 'part') return -1
          if (a.type !== 'part' && b.type === 'part') return 1
          return (a.order || 0) - (b.order || 0)
        })
        
        // Add chapters to the project
        sorted.forEach((chapter: any) => {
          const newChapter: Chapter = {
            id: chapter.id || Date.now().toString() + Math.random(),
            title: chapter.title,
            content: chapter.content || '',
            hierarchyLabel: chapter.hierarchyLabel,
            contentLabel: chapter.contentLabel,
            type: chapter.type || 'other',
            partId: chapter.partId || null,
            order: chapter.order || 0,
          }
          addChapter(selectedProject, newChapter)
        })

        setResponse('✓ Text organized into parts successfully!')
      } else {
        setResponse('Error: No parts returned from API')
      }
    } catch (error) {
      console.error(error)
      setResponse('Error processing text. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }


  return (
    <div className="absolute right-0 top-16 h-[calc(100vh-4rem)] w-96 bg-[#1f1612] border-l border-orange-900/30 flex flex-col z-20 shadow-2xl animate-sf-slide-in-right">
      <div className="p-4 border-b border-orange-900/30 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-orange-400">🤖 Agent</h3>
        <button
          onClick={onClose}
          className="text-orange-400/60 hover:text-orange-400"
        >
          ✕
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-orange-300/80 mb-2">
            Paste your text here:
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your text with parts, chapters, etc..."
            className="w-full h-48 p-3 bg-orange-900/20 border border-orange-800/30 rounded-lg text-orange-100 placeholder-orange-400/40 focus:outline-none focus:border-orange-600"
          />
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleOrganize}
            disabled={isProcessing || !inputText.trim()}
            className="px-4 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg font-semibold hover:from-orange-700 hover:to-orange-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
          >
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-sf-spin"></div>
              </div>
            )}
            <span className={isProcessing ? 'opacity-0' : ''}>{isProcessing ? 'Organizing...' : 'Organize Text'}</span>
          </button>
        </div>

        {response && (
          <div className="p-3 bg-orange-900/20 border border-orange-800/30 rounded-lg">
            <p className="text-sm text-orange-200 whitespace-pre-line">{response}</p>
          </div>
        )}

        <div className="p-4 bg-gradient-to-br from-orange-900/10 to-orange-800/10 rounded-lg border border-orange-800/20">
          <h4 className="text-sm font-semibold text-orange-300 mb-2">ℹ️ How it works:</h4>
          <ul className="text-xs text-orange-300/70 space-y-1">
            <li>• Paste text from multiple parts</li>
            <li>• Algorithm organizes them automatically</li>
            <li>• AI identifies characters and traits</li>
            <li>• Click characters to see their descriptions</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
