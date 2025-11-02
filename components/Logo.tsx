export default function Logo() {
  return (
    <div className="group flex items-center gap-3 select-none">
      <div className="w-10 h-10 relative transition-transform duration-200 group-hover:scale-105">
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:'#d4af37', stopOpacity:1}} />
              <stop offset="50%" style={{stopColor:'#cd7f32', stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:'#d4af37', stopOpacity:1}} />
            </linearGradient>
          </defs>
          {/* Simple quill/pen representing writing */}
          <path d="M 20 40 L 20 50 L 44 26 L 38 20 Z" fill="url(#logoGrad)" opacity="0.9"/>
          <path d="M 22 38 L 44 16 L 50 22 L 28 44 Z" fill="url(#logoGrad)" opacity="0.7"/>
          <circle cx="44" cy="22" r="3" fill="#d4af37"/>
        </svg>
      </div>
      <h1 className="text-2xl font-bold bg-gradient-to-r from-[#d4af37] via-[#cd7f32] to-[#d4af37] bg-clip-text text-transparent tracking-tight">
        ScribeForge
      </h1>
    </div>
  )
}
