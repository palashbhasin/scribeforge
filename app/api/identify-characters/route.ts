import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const openai = OPENAI_API_KEY
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
  : null

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // Check for API key with better error messaging
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey.trim().length === 0) {
      console.error('OPENAI_API_KEY is missing or empty')
      return NextResponse.json(
        { 
          error: 'OpenAI API key not configured', 
          details: 'Please set OPENAI_API_KEY environment variable in .env.local file',
          hint: 'Create .env.local in the project root with: OPENAI_API_KEY=your_key_here'
        },
        { status: 500 }
      )
    }

    if (!openai) {
      return NextResponse.json(
        { error: 'Failed to initialize OpenAI client', details: 'API key format may be invalid' },
        { status: 500 }
      )
    }

    // Smart text truncation: gpt-3.5-turbo has 16385 token context limit
    // Rough estimate: 1 token ≈ 4 characters, so safe limit is ~60k chars for input
    // Reserve ~4000 tokens for system message + response, so ~50k chars for user content
    const maxInputChars = 50000 // Safe limit for user content
    let processedText = text
    
    if (text.length > maxInputChars) {
      // Take first 60% and last 20% to capture beginning and recent context
      const firstPart = text.substring(0, Math.floor(maxInputChars * 0.6))
      const lastPart = text.substring(text.length - Math.floor(maxInputChars * 0.2))
      processedText = `${firstPart}\n\n[...middle content truncated for token efficiency...]\n\n${lastPart}`
    }

    let completion
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Higher TPM limits (1M+ TPM vs 10k for gpt-4o-mini)
        messages: [
          {
            role: 'system',
            content: `You are a literary analyst. Identify all unique characters from the text. Return a JSON object with a "characters" array containing objects with this structure:
{
  "characters": [
    {
      "name": "Character Name",
      "description": "Brief description of the character including their role, appearance, and key personality traits",
      "traits": ["trait1", "trait2", "trait3"]
    }
  ]
}

Extract distinctive personality traits, physical characteristics, and role in the story. Include all unique characters mentioned.
Only include actual characters (people, beings, etc.), not abstract concepts.
Respond ONLY with valid JSON, no other text.`,
          },
          {
            role: 'user',
            content: processedText.length > 0 ? processedText : text.substring(0, 1000), // Fallback if processedText is empty
          },
        ],
        temperature: 0.2,
        max_tokens: 4000, // Limit response tokens
        response_format: { type: 'json_object' }, // Ensure JSON response
      })
    } catch (apiError: any) {
      console.error('OpenAI API error:', apiError)
      const errorMessage = apiError?.message || 'Unknown API error'
      const statusCode = apiError?.status || apiError?.response?.status || 500
      
      // Provide helpful error messages for common issues
      if (errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('authentication')) {
        return NextResponse.json(
          { 
            error: 'Invalid API key', 
            details: 'The OpenAI API key is invalid or expired',
            hint: 'Please check your OPENAI_API_KEY in .env.local'
          },
          { status: 500 }
        )
      }
      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded', 
            details: 'Too many requests to OpenAI API',
            hint: 'Please wait a moment and try again'
          },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'OpenAI API error', 
          details: errorMessage,
          statusCode: statusCode
        },
        { status: 500 }
      )
    }

    const responseText = completion.choices[0]?.message?.content || '{"characters": []}'
    let characters = []
    
    try {
      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Empty response from OpenAI')
      }
      
      let parsed = JSON.parse(responseText)
      
      // Handle both array and object formats
      let charsArray: any[] = []
      if (Array.isArray(parsed)) {
        charsArray = parsed
      } else if (parsed && typeof parsed === 'object') {
        charsArray = parsed.characters || parsed.character || []
      }
      
      characters = charsArray
        .filter((char: any) => char && (char.name || char.Name))
        .map((char: any, index: number) => ({
          id: `char-${Date.now()}-${index}`,
          name: (char.name || char.Name || `Character ${index + 1}`).trim(),
          description: (char.description || char.Description || '').trim(),
          traits: Array.isArray(char.traits || char.Traits) ? (char.traits || char.Traits) : [],
        }))
        .filter((char: any) => char.name && char.name.trim() && char.name !== `Character ${char.id}`)
    } catch (e: any) {
      console.error('Failed to parse characters:', e)
      console.error('Response text:', responseText?.substring(0, 500))
      characters = []
    }

    return NextResponse.json({ characters })
  } catch (error: any) {
    console.error('Error identifying characters:', error)
    console.error('Error stack:', error.stack)
    
    // Provide more specific error information
    let errorDetails = error.message || 'Unknown error'
    if (error.response) {
      errorDetails = `${errorDetails} (Status: ${error.response.status})`
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to identify characters', 
        details: errorDetails,
        type: error.name || 'Error'
      },
      { status: 500 }
    )
  }
}
