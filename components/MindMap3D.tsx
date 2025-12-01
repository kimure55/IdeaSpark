import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Idea } from '../types';

interface MindMap3DProps {
  ideas: Idea[];
  centerKeyword: string;
  onSetAsCore: (keyword: string) => void;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
  idea?: Idea;
  id: string;
  isCenter?: boolean;
}

const MindMap3D: React.FC<MindMap3DProps> = ({ ideas, centerKeyword, onSetAsCore }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0.2, y: 0 }); 
  const [zoomScale, setZoomScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState(true);
  const requestRef = useRef<number>(0);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);

  // Configuration
  const BASE_RADIUS = 420; 
  const FOCAL_LENGTH = 900; 

  // Generate 3D points on a sphere (Fibonacci Sphere algorithm)
  const points: Point3D[] = useMemo(() => {
    const pts: Point3D[] = [];
    
    // Central node (Core)
    pts.push({ x: 0, y: 0, z: 0, id: 'center', isCenter: true });

    const count = ideas.length;
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2; // y goes from 1 to -1
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;

      // Scale by BASE_RADIUS immediately
      pts.push({
        x: x * BASE_RADIUS,
        y: y * BASE_RADIUS,
        z: z * BASE_RADIUS,
        idea: ideas[i],
        id: ideas[i].id
      });
    }
    return pts;
  }, [ideas]);

  // Animation Loop
  const animate = () => {
    if (autoRotate && !isDragging && !selectedIdea) {
      setRotation(prev => ({
        x: prev.x, 
        y: prev.y + 0.003 // Steady planetary rotation
      }));
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [autoRotate, isDragging, selectedIdea]);

  // Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (selectedIdea) return; // Prevent drag if looking at detail view, strictly optional
    setIsDragging(true);
    setAutoRotate(false);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    lastMouseRef.current = { x: clientX, y: clientY };
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const deltaX = clientX - lastMouseRef.current.x;
    const deltaY = clientY - lastMouseRef.current.y;

    setRotation(prev => ({
      x: prev.x - deltaY * 0.005,
      y: prev.y + deltaX * 0.005
    }));

    lastMouseRef.current = { x: clientX, y: clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (!selectedIdea) {
      setAutoRotate(true);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    // Zoom limits
    setZoomScale(prev => {
      const newScale = prev - e.deltaY * 0.001;
      return Math.min(Math.max(newScale, 0.5), 2.5);
    });
  };

  const handleNodeClick = (e: React.MouseEvent, p: Point3D) => {
    e.stopPropagation();
    if (p.isCenter) {
       setSelectedIdea(null);
       setAutoRotate(true);
       return;
    }
    if (p.idea) {
      setSelectedIdea(p.idea);
      setAutoRotate(false);
      
      // Calculate rotation to bring this node to front (approximate)
      // This is a simple visual centering hack. 
      // Ideally we compute Quaternion rotation, but here we can just stop rotation and show the card.
    }
  };

  const handleBackgroundClick = () => {
    if (selectedIdea) {
      setSelectedIdea(null);
      setAutoRotate(true);
    }
  };

  // Projection Logic
  const project = (point: Point3D, width: number, height: number) => {
    // 1. Scale point by Zoom
    const scaledX = point.x * zoomScale;
    const scaledY = point.y * zoomScale;
    const scaledZ = point.z * zoomScale;

    // 2. Rotate Y
    let x = scaledX * Math.cos(rotation.y) - scaledZ * Math.sin(rotation.y);
    let z = scaledZ * Math.cos(rotation.y) + scaledX * Math.sin(rotation.y);
    
    // 3. Rotate X
    let y = scaledY * Math.cos(rotation.x) - z * Math.sin(rotation.x);
    z = z * Math.cos(rotation.x) + scaledY * Math.sin(rotation.x);

    // 4. Perspective projection
    const scale = FOCAL_LENGTH / (FOCAL_LENGTH + z);
    const x2d = x * scale + width / 2;
    const y2d = y * scale + height / 2;

    return { x: x2d, y: y2d, scale, zIndex: Math.floor(scale * 1000), rawZ: z };
  };

  // Render
  const width = containerRef.current?.clientWidth || 800;
  const height = 600;

  // Calculate all projected positions
  const projectedPoints = points.map(p => ({
    ...p,
    ...project(p, width, height)
  }));

  // Sort by z-index so back nodes render first (painter's algorithm)
  projectedPoints.sort((a, b) => a.zIndex - b.zIndex);

  const centerPoint = projectedPoints.find(p => p.isCenter);

  // Helper to generate some latitude lines for the globe effect
  const globeLines = useMemo(() => {
    const lines = [];
    // Longitude lines
    for (let i = 0; i < 6; i++) {
        const theta = (i / 6) * Math.PI * 2;
        const linePts = [];
        for (let j = 0; j <= 20; j++) {
            const phi = (j / 20) * Math.PI; // 0 to PI
            const x = BASE_RADIUS * Math.sin(phi) * Math.cos(theta);
            const y = BASE_RADIUS * Math.cos(phi);
            const z = BASE_RADIUS * Math.sin(phi) * Math.sin(theta);
            linePts.push({ x, y, z, id: `long-${i}-${j}` });
        }
        lines.push(linePts);
    }
    // Equator and Tropics
    [-0.5, 0, 0.5].forEach((level, idx) => {
        const y = level * BASE_RADIUS;
        const radius = Math.sqrt(BASE_RADIUS*BASE_RADIUS - y*y);
        const linePts = [];
        for (let j = 0; j <= 30; j++) {
            const theta = (j / 30) * Math.PI * 2;
            const x = radius * Math.cos(theta);
            const z = radius * Math.sin(theta);
            linePts.push({ x, y, z, id: `lat-${idx}-${j}` });
        }
        lines.push(linePts);
    });
    return lines;
  }, []);

  return (
    <div className="relative w-full h-[600px] flex flex-col items-center justify-center">
      <div 
        className="relative w-full h-full bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 select-none cursor-move touch-none group"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleBackgroundClick}
      >
        {/* Universe Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none"></div>
        
        {/* Globe "Atmosphere" Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-20 bg-brand-500 pointer-events-none" 
            style={{ width: `${BASE_RADIUS * zoomScale * 1.5}px`, height: `${BASE_RADIUS * zoomScale * 1.5}px` }}></div>

        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {/* Render Globe Wireframe Lines */}
          {globeLines.map((line, idx) => {
              // Project line points
              const projectedLine = line.map(p => project(p, width, height));
              // Create path data
              const d = projectedLine.reduce((acc, p, i) => {
                  return acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
              }, "");
              return <path key={`globe-line-${idx}`} d={d} fill="none" stroke="rgba(94, 234, 212, 0.08)" strokeWidth="1" />;
          })}

          {/* Connections from center to nodes */}
          {centerPoint && projectedPoints.map(p => {
            if (p.isCenter) return null;
            // Calculate distance based fade
            const opacity = Math.max(0.05, (p.scale - 0.5) * 0.4); 
            return (
              <line
                key={`line-${p.id}`}
                x1={centerPoint.x}
                y1={centerPoint.y}
                x2={p.x}
                y2={p.y}
                stroke={`rgba(94, 234, 212, ${opacity})`}
                strokeWidth={1}
              />
            );
          })}
        </svg>

        {/* Nodes Layer */}
        {projectedPoints.map(p => {
          const isBehind = p.rawZ < -100 * zoomScale;

          return (
          <div
            key={p.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300
              ${p.isCenter ? 'z-[1000]' : ''}
              ${!p.isCenter && isBehind ? 'grayscale opacity-30' : ''}
              ${!p.isCenter ? 'cursor-pointer' : ''}
              `}
            style={{
              left: p.x,
              top: p.y,
              zIndex: p.zIndex,
              transform: `translate(-50%, -50%) scale(${p.scale})`,
            }}
            onClick={(e) => handleNodeClick(e, p)}
          >
            {p.isCenter ? (
              <div className="relative pointer-events-none">
                {/* Core Sun/Earth Center */}
                <div className="absolute -inset-8 bg-brand-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                <div className="relative bg-black/80 text-white w-28 h-28 rounded-full flex items-center justify-center text-center p-2 shadow-[0_0_30px_rgba(45,212,191,0.6)] border border-brand-500/50 backdrop-blur-sm">
                  <span className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-brand-200 to-brand-400">
                    {centerKeyword}
                  </span>
                </div>
              </div>
            ) : (
              <div className="group relative flex flex-col items-center">
                  {/* Satellite Node */}
                  <div className={`
                      w-3 h-3 rounded-full mb-2 transition-all duration-300
                      ${isBehind ? 'bg-slate-700' : 'bg-brand-400 shadow-[0_0_15px_rgba(45,212,191,0.8)]'}
                      group-hover:scale-150 group-hover:bg-white
                      ${selectedIdea?.id === p.id ? 'scale-150 bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)]' : ''}
                  `}></div>
                  
                  {/* Label */}
                  <div className={`
                      text-center transition-all duration-300
                      ${isBehind ? 'opacity-0 group-hover:opacity-100' : 'opacity-80'}
                      ${selectedIdea?.id === p.id ? 'opacity-100 scale-110 z-[2000]' : 'group-hover:opacity-100 group-hover:scale-110 group-hover:z-[2000]'}
                  `}>
                      <div className={`
                        bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/50 text-slate-200 text-xs font-medium whitespace-nowrap 
                        ${selectedIdea?.id === p.id ? 'bg-brand-900/80 border-brand-500 text-white' : 'hover:bg-black/90 hover:border-brand-500 hover:text-white'}
                      `}>
                          {p.idea?.phrase}
                      </div>
                  </div>
              </div>
            )}
          </div>
        )})}
        
        {/* Helper Text */}
        <div className="absolute bottom-6 left-6 text-xs text-slate-400 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm border border-slate-800 pointer-events-none flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>
          滚动缩放 · 拖拽旋转 · 点击节点查看详情
        </div>
      </div>

      {/* Selected Node Details Overlay */}
      {selectedIdea && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[4000] animate-fade-in-up">
           <div className="bg-slate-900/90 backdrop-blur-md border border-brand-500/30 text-white p-6 rounded-2xl shadow-2xl max-w-sm w-80 relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedIdea(null); setAutoRotate(true); }}
                className="absolute top-2 right-2 text-slate-400 hover:text-white p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              
              <div className="mb-4">
                 <span className="text-xs font-bold tracking-wider text-brand-300 bg-brand-900/50 px-2 py-1 rounded-full uppercase border border-brand-500/20">
                   {selectedIdea.category}
                 </span>
              </div>
              
              <h3 className="text-2xl font-bold mb-3 text-white">{selectedIdea.phrase}</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                {selectedIdea.description}
              </p>
              
              <button 
                onClick={(e) => { e.stopPropagation(); onSetAsCore(selectedIdea.phrase); setSelectedIdea(null); }}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
                以此为核心发散
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default MindMap3D;