import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface Character {
  id: string
  name: string
  description: string
  traits: string[]
  occurrences?: number
}

export interface Chapter {
  id: string
  title: string
  content: string
  hierarchyLabel?: string  // e.g., "Part 1", "Chapter 1"
  contentLabel?: string    // e.g., "The Affair", "The Wife"
  type?: 'part' | 'chapter' | 'toc' | 'cover' | 'other'
  partId?: string | null   // For chapters, which part they belong to
  order?: number           // For drag and drop reordering
}

export interface Project {
  id: string
  name: string
  chapters: Chapter[]
  characters: Character[]
  analyzedSections?: Record<string, Character[]> // sectionId -> characters from that section
  createdAt: string
}

interface Store {
  projects: Project[]
  selectedProject: string | null
  activeChapter: string | null
  setActiveChapter: (chapterId: string | null) => void
  addProject: (project: Project) => void
  renameProject: (projectId: string, newName: string) => void
  deleteProject: (projectId: string) => void
  selectProject: (projectId: string) => void
  addChapter: (projectId: string, chapter: Chapter) => void
  deleteChapter: (projectId: string, chapterId: string) => void
  updateChapter: (projectId: string, chapterId: string, content: string) => void
  renameChapter: (projectId: string, chapterId: string, newTitle: string) => void
  updateChapterLabel: (projectId: string, chapterId: string, hierarchyLabel?: string, contentLabel?: string) => void
  reorderChapters: (projectId: string, chapterIds: string[]) => void
  addCharacter: (projectId: string, character: Character) => void
  setCharacters: (projectId: string, characters: Character[]) => void
  setSectionCharacters: (projectId: string, sectionId: string, characters: Character[]) => void
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      projects: [],
      selectedProject: null,
      activeChapter: null,
      setActiveChapter: (chapterId) => set({ activeChapter: chapterId }),
      addProject: (project) =>
        set((state) => ({
          projects: [...state.projects, project],
        })),
      renameProject: (projectId, newName) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, name: newName } : p
          ),
        })),
      deleteProject: (projectId) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          selectedProject: state.selectedProject === projectId ? null : state.selectedProject,
        })),
      selectProject: (projectId) =>
        set({ selectedProject: projectId, activeChapter: null }), // Clear active chapter when switching projects
      addChapter: (projectId, chapter) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, chapters: [...p.chapters, chapter] }
              : p
          ),
        })),
      updateChapter: (projectId, chapterId, content) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  chapters: p.chapters.map((c) =>
                    c.id === chapterId ? { ...c, content } : c
                  ),
                }
              : p
          ),
        })),
      renameChapter: (projectId, chapterId, newTitle) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  chapters: p.chapters.map((c) =>
                    c.id === chapterId ? { ...c, title: newTitle } : c
                  ),
                }
              : p
          ),
        })),
      deleteChapter: (projectId, chapterId) =>
        set((state) => {
          const project = state.projects.find((p) => p.id === projectId)
          if (!project) return state
          
          // Remove from analyzed sections if it was analyzed
          const remainingAnalyzed = Object.fromEntries(
            Object.entries(project.analyzedSections || {}).filter(([id]) => id !== chapterId)
          )
          
          // Re-merge characters from remaining analyzed sections
          const characterMap = new Map<string, Character>()
          Object.values(remainingAnalyzed).forEach((sectionChars) => {
            sectionChars.forEach((char) => {
              const existing = characterMap.get(char.name.toLowerCase())
              if (!existing || !char.description || char.description.length > existing.description.length) {
                characterMap.set(char.name.toLowerCase(), char)
              }
            })
          })
          const mergedCharacters = Array.from(characterMap.values())
          
          return {
            projects: state.projects.map((p) =>
              p.id === projectId
                ? {
                    ...p,
                    chapters: p.chapters.filter((c) => c.id !== chapterId),
                    analyzedSections: remainingAnalyzed,
                    characters: mergedCharacters,
                  }
                : p
            ),
            // Clear active chapter if it was deleted
            activeChapter: state.activeChapter === chapterId ? null : state.activeChapter,
          }
        }),
      updateChapterLabel: (projectId, chapterId, hierarchyLabel, contentLabel) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  chapters: p.chapters.map((c) =>
                    c.id === chapterId
                      ? {
                          ...c,
                          hierarchyLabel: hierarchyLabel !== undefined ? hierarchyLabel : c.hierarchyLabel,
                          contentLabel: contentLabel !== undefined ? contentLabel : c.contentLabel,
                        }
                      : c
                  ),
                }
              : p
          ),
        })),
      reorderChapters: (projectId, chapterIds) =>
        set((state) => {
          const project = state.projects.find((p) => p.id === projectId)
          if (!project) return state
          
          const chapterMap = new Map(project.chapters.map((c) => [c.id, c]))
          const reordered = chapterIds.map((id, index) => {
            const chapter = chapterMap.get(id)
            return chapter ? { ...chapter, order: index } : null
          }).filter(Boolean) as Chapter[]
          
          // Add any chapters not in the reordered list
          const remainingIds = new Set(chapterIds)
          project.chapters.forEach((c) => {
            if (!remainingIds.has(c.id)) {
              reordered.push({ ...c, order: reordered.length })
            }
          })
          
          return {
            projects: state.projects.map((p) =>
              p.id === projectId ? { ...p, chapters: reordered } : p
            ),
          }
        }),
      addCharacter: (projectId, character) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  characters: [...p.characters.filter((ch) => ch.id !== character.id), character],
                }
              : p
          ),
        })),
      setCharacters: (projectId, characters) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, characters } : p
          ),
        })),
      // Set characters for a specific section, then merge all analyzed sections
      setSectionCharacters: (projectId, sectionId, characters) =>
        set((state) => {
          const project = state.projects.find((p) => p.id === projectId)
          if (!project) return state
          
          // Update analyzed sections - replace if section already analyzed
          const analyzedSections = { ...(project.analyzedSections || {}), [sectionId]: characters }
          
          // Merge all characters from all analyzed sections
          // Use a map to deduplicate by name (keep most recent description)
          const characterMap = new Map<string, Character>()
          
          Object.values(analyzedSections).forEach((sectionChars) => {
            sectionChars.forEach((char) => {
              const existing = characterMap.get(char.name.toLowerCase())
              if (!existing || !char.description || char.description.length > existing.description.length) {
                characterMap.set(char.name.toLowerCase(), char)
              }
            })
          })
          
          const mergedCharacters = Array.from(characterMap.values())
          
          return {
            projects: state.projects.map((p) =>
              p.id === projectId
                ? { ...p, characters: mergedCharacters, analyzedSections }
                : p
            ),
          }
        }),
    }),
    {
      name: 'scribeforge-storage',
      storage: typeof window !== 'undefined' ? createJSONStorage(() => localStorage) : undefined,
    }
  )
)
