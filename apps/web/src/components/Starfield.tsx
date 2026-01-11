"use client";

export function Starfield() {
  return (
    <>
      {/* Starfield Background - Multiple layers for 3D depth */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Layer 1: Distant stars (slowest) */}
        <div className="absolute inset-0 opacity-60">
          {[...Array(100)].map((_, i) => (
            <div
              key={`star-far-${i}`}
              className="absolute rounded-full bg-white animate-twinkle"
              style={{
                width: Math.random() * 2 + 0.5 + 'px',
                height: Math.random() * 2 + 0.5 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 5 + 's',
                animationDuration: Math.random() * 3 + 2 + 's'
              }}
            />
          ))}
        </div>
        
        {/* Layer 2: Mid-distance stars (medium speed) */}
        <div className="absolute inset-0 opacity-80">
          {[...Array(60)].map((_, i) => (
            <div
              key={`star-mid-${i}`}
              className="absolute rounded-full bg-teal-200 animate-twinkle"
              style={{
                width: Math.random() * 2 + 1 + 'px',
                height: Math.random() * 2 + 1 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 4 + 's',
                animationDuration: Math.random() * 2 + 1.5 + 's'
              }}
            />
          ))}
        </div>
        
        {/* Layer 3: Close stars (fastest, with glow) */}
        <div className="absolute inset-0">
          {[...Array(40)].map((_, i) => (
            <div
              key={`star-near-${i}`}
              className="absolute rounded-full bg-emerald-300 animate-twinkle"
              style={{
                width: Math.random() * 3 + 1.5 + 'px',
                height: Math.random() * 3 + 1.5 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 3 + 's',
                animationDuration: Math.random() * 1.5 + 1 + 's',
                boxShadow: '0 0 4px rgba(34, 197, 94, 0.6)'
              }}
            />
          ))}
        </div>
        
        {/* Shooting stars */}
        {[...Array(3)].map((_, i) => (
          <div
            key={`shooting-${i}`}
            className="absolute w-1 h-1 bg-cyan-300 rounded-full animate-shoot"
            style={{
              top: Math.random() * 50 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 10 + 5 + 's',
              animationDuration: '2s',
              boxShadow: '0 0 2px 1px rgba(6, 182, 212, 0.8), -50px 0 30px 10px rgba(6, 182, 212, 0.3)'
            }}
          />
        ))}
      </div>
      
      {/* Nebula clouds - 3D depth effect */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 h-96 w-96 rounded-full bg-teal-500/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl animate-pulse" style={{animationDelay: "1.5s"}} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-cyan-500/3 blur-3xl animate-pulse" style={{animationDelay: "3s"}} />
      </div>
    </>
  );
}
