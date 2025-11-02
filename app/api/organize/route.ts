import { NextRequest, NextResponse } from 'next/server'

function parseSections(text: string): any[] {
  const sections: any[] = []
  const lines = text.split('\n')
  
  // Utilities
  const isAllCapsTitle = (s: string) => s.length > 0 && s === s.toUpperCase() && /[A-Z]/.test(s)
  const isLikelyTitle = (s: string) => isAllCapsTitle(s) || /^[A-Z][^.!?]{0,80}$/.test(s)
  const isBlank = (s: string) => s.trim().length === 0
  const takeBlock = (start: number, until: (l: string, idx: number) => boolean) => {
    let i = start
    let buf: string[] = []
    while (i < lines.length) {
      const raw = lines[i]
      const l = raw.trim()
      if (until(l, i)) break
      buf.push(raw)
      i++
    }
    return { end: i, content: buf.join('\n') }
  }

  // Detect Cover (title/author) before first major section
  let idx = 0
  let coverTitle = ''
  let coverAuthor = ''
  let coverStart = 0
  while (idx < lines.length && idx < 80) {
    const l = lines[idx].trim()
    if (!isBlank(l)) {
      if (!coverTitle && isLikelyTitle(l)) coverTitle = l
      else if (!coverAuthor && /^by\s+.+/i.test(l)) coverAuthor = l
      // stop scanning cover at first obvious section heading
      if (/^(table\s+of\s+contents|contents|part|chapter|prologue|foreword|dedication|acknowledg(e)ments?|credits?|copyright|license|epilogue)\b/i.test(l)) {
        break
      }
    }
    idx++
  }
  if (coverTitle || coverAuthor) {
    const { content } = takeBlock(0, (l) => /^(table\s+of\s+contents|contents|part|chapter|prologue|foreword|dedication|acknowledg(e)ments?|credits?|copyright|license|epilogue)\b/i.test(l))
    // Only add Cover if it doesn't already exist
    if (!sections.some(s => s.type === 'cover' || s.title?.toLowerCase() === 'cover')) {
      sections.push({ 
        id: `cover-${Date.now()}`,
        title: 'Cover', 
        hierarchyLabel: 'Cover',
        contentLabel: '',
        content,
        type: 'cover',
        order: -1
      })
    }
    coverStart = content.split('\n').length
  }

  // Reset index after cover block
  idx = coverStart

  // Patterns - fixed to detect "PART 1: THE AFFAIR" format
  const partHeader = /^part\s+(?:([ivxlcdm]+|\d+|one|two|three|four|five|six|seven|eight|nine|ten))\s*:?\s*(.+)?$/i
  const chapterHeader = new RegExp(
    '^(?:chapter|ch\.|chap\.|book)\s+(?:([ivxlcdm]+|\d+))(?:\s*[:-]\s*(.+))?$',
    'i'
  )
  const markdownChapterHeader = /^(?:#\s+)?chapter\s+(\d+)(?:\s*[:-]\s*(.+))?/i
  const simpleH2Header = /^##\s+(.+)/
  const prologueLike = /^(prologue|foreword|preface|introduction|epigraph)\b/i
  const epilogueLike = /^(epilogue|afterword|postscript)\b/i
  const dedicationLike = /^dedication\b/i
  const tocHeader = /^(table\s+of\s+contents|contents)\b/i
  const creditsLike = /^(acknowledg(e)ments?|credits?|thanks|copyright|license)\b/i

  // Helpers to push a section
  let current: any = null
  const flush = () => { 
    if (current) { 
      current.id = `section-${Date.now()}-${Math.random()}`
      current.order = sections.length
      sections.push(current)
      current = null 
    } 
  }

  // If a ToC exists, extract it as a block
  for (let i = idx; i < lines.length; i++) {
    const l = lines[i].trim()
    if (tocHeader.test(l)) {
      const { end, content } = takeBlock(i, (line) => isBlank(line))
      // Only add TOC if it doesn't already exist
      if (!sections.some(s => s.type === 'toc' || s.title?.toLowerCase() === 'table of contents')) {
        sections.push({ 
          id: `toc-${Date.now()}-${Math.random()}`,
          title: 'Table of Contents', 
          hierarchyLabel: 'Table of Contents',
          contentLabel: '',
          content,
          type: 'toc',
          order: 0
        })
      }
      idx = Math.max(idx, end)
      break
    }
  }

  // Iterate remaining lines and build sections
  for (let i = idx; i < lines.length; i++) {
    const raw = lines[i]
    const l = raw.trim()

    // New section starts
    let m: RegExpMatchArray | null
    if ((m = l.match(partHeader))) {
      flush()
      const num = m[1] || ''
      const sub = (m[2] || '').trim()
      const partNum = num ? num : sections.filter(s => s.type === 'part').length + 1
      // Separate hierarchy label (Part 1) from content label (The Affair)
      const partId = `part-${Date.now()}-${Math.random()}`
      current = { 
        id: partId,
        title: `PART ${partNum.toString().toUpperCase()}${sub ? ': ' + sub : ''}`,
        hierarchyLabel: `Part ${partNum.toString()}`,
        contentLabel: sub || '',
        content: '',  // Parts have no content
        type: 'part',
        order: sections.filter(s => s.type === 'part').length
      }
      flush() // Immediately flush part so it's in sections array
      continue
    }
    if ((m = l.match(chapterHeader)) || (m = l.match(markdownChapterHeader))) {
      flush()
      const num = m[1]
      const sub = (m[2] || '').trim()
      const displayNum = num ? num.toString() : sections.filter(s => s.type === 'chapter').length + 1
      // Find the most recent part
      const currentPart = sections.filter(s => s.type === 'part').slice(-1)[0] || null
      // Separate hierarchy label (Chapter 1) from content label (The Wife)
      current = { 
        title: `Chapter ${displayNum}${sub ? ' - ' + sub : ''}`,
        hierarchyLabel: `Chapter ${displayNum}`,
        contentLabel: sub || '',
        content: '',
        type: 'chapter',
        partId: currentPart ? (currentPart.id || null) : null,
        order: sections.length
      }
      continue
    }
    if (simpleH2Header.test(l)) {
      flush()
      const t = (l.match(simpleH2Header) as RegExpMatchArray)[1].trim()
      current = { title: t, content: '' }
      continue
    }
    if (prologueLike.test(l)) {
      flush(); current = { title: l, content: '' }; continue
    }
    if (epilogueLike.test(l)) {
      flush(); current = { title: l, content: '' }; continue
    }
    if (dedicationLike.test(l)) {
      flush(); current = { title: 'Dedication', content: '' }; continue
    }
    if (creditsLike.test(l)) {
      flush(); current = { title: l, content: '' }; continue
    }
    // Otherwise, accumulate content into current section
    if (current) {
      // Only add content if current section is not a part (parts have no content)
      if (current.type !== 'part') {
        current.content += (current.content ? '\n' : '') + raw
      }
    } else {
      // No current section - check if we already have a part or any sections
      // If we already have sections, accumulate to the last non-part section
      // If no sections yet, create a default chapter (not Part 1 to avoid duplicates)
      if (sections.length > 0) {
        // Append to the last section that can have content
        const lastSection = sections[sections.length - 1]
        if (lastSection && lastSection.type !== 'part') {
          lastSection.content += (lastSection.content ? '\n' : '') + raw
        }
      } else {
        // Only create default if truly no sections exist yet
        current = { 
          title: 'Chapter 1',
          hierarchyLabel: 'Chapter 1',
          contentLabel: '',
          content: raw,
          type: 'chapter',
          order: 0
        }
      }
    }
  }

  flush()

  // Remove duplicates - keep first occurrence
  // For Cover/TOC, unique by type. For parts, unique by hierarchyLabel. For others, by type+hierarchyLabel
  const seen = new Set<string>()
  const uniqueSections = sections.filter(s => {
    let key: string
    if (s.type === 'cover' || s.type === 'toc') {
      key = s.type // Cover and TOC are unique by type only
    } else if (s.type === 'part') {
      // Parts are unique by hierarchyLabel (e.g., "Part 1", "Part 2")
      key = `part-${s.hierarchyLabel || s.title}`
    } else {
      key = `${s.type}-${s.hierarchyLabel || s.title}`
    }
    if (seen.has(key)) {
      console.log(`Removing duplicate: ${key}`)
      return false
    }
    seen.add(key)
    return true
  })

  // Ensure at least one section if completely empty (but don't create Part 1 to avoid duplicates)
  if (uniqueSections.length === 0) {
    uniqueSections.push({ 
      id: `section-${Date.now()}`,
      title: 'Chapter 1', 
      hierarchyLabel: 'Chapter 1',
      contentLabel: '',
      content: text,
      type: 'chapter',
      order: 0
    })
  }
  
  return uniqueSections
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // Use deterministic algorithm to detect sections (Cover, ToC, Parts, Chapters, Credits, etc.)
    const chapters = parseSections(text)

    // Character analysis is now manual-only via the Analyze Characters button
    return NextResponse.json({ chapters, characters: [] })
  } catch (error: any) {
    console.error('Error organizing text:', error)
    return NextResponse.json(
      { error: 'Failed to organize text', details: error.message },
      { status: 500 }
    )
  }
}
