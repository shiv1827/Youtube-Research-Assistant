'use client'

import { ForceGraph2D } from 'react-force-graph'
import { TopicNode, TopicEdge } from '@/lib/topic-graph/types'
import { useEffect, useCallback, useRef, useState } from 'react'

interface ForceGraphComponentProps {
  nodes: TopicNode[]
  edges: TopicEdge[]
  width: number
  height: number
  onNodeClick: (node: any) => void
  onNodeHover: (node: any) => void
}

const NODE_COLORS = {
  technical: '#4361ee', // vibrant blue
  concept: '#f72585', // bright pink
  insight: '#7209b7', // deep purple
  example: '#4cc9f0', // bright cyan
  default: '#4895ef' // light blue
}

const NODE_PARTICLE_CONFIG = {
  particles: 3,
  particleWidth: 2,
  particleSpeed: 0.015
}

export function ForceGraphComponent({
  nodes,
  edges,
  width,
  height,
  onNodeClick,
  onNodeHover
}: ForceGraphComponentProps) {
  const fgRef = useRef<any>();
  const hoveredNodeRef = useRef<any>(null);
  const hoverTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge').strength(-400);
      fgRef.current.d3Force('link').distance(200);
      fgRef.current.d3Force('center').strength(0.6);
      fgRef.current.d3ReheatSimulation();
    }
  }, []);

  const handleNodeHover = useCallback((node: any, prev: any) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    if (node) {
      hoveredNodeRef.current = node;
      onNodeHover?.(node);
      if (fgRef.current) {
        fgRef.current.pauseAnimation();
      }
      return;
    }

    if (!node && hoveredNodeRef.current) {
      hoverTimeoutRef.current = setTimeout(() => {
        hoveredNodeRef.current = null;
        onNodeHover?.(null);
        if (fgRef.current) {
          fgRef.current.resumeAnimation();
        }
      }, 2000);
    }
  }, [onNodeHover]);

  if (!nodes?.length || !edges?.length) {
    return null;
  }

  const graphData = {
    nodes: nodes.map((node) => ({
      ...node,
      id: node.id,
      label: node.label,
      size: 8 + (node.importance || 1) * 15,
      color: NODE_COLORS[node.category?.toLowerCase() as keyof typeof NODE_COLORS] || NODE_COLORS.default
    })),
    links: edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      value: edge.weight || 1
    }))
  };

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={graphData}
      nodeLabel="label"
      nodeColor="color"
      nodeRelSize={6}
      linkWidth={(link) => Math.sqrt((link as any).value || 1) * 1.5}
      linkColor={() => 'rgba(156, 163, 175, 0.3)'}
      backgroundColor="transparent"
      onNodeClick={onNodeClick}
      onNodeHover={handleNodeHover}
      nodeCanvasObjectMode={() => "after"}
      nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        if (!node?.x || !node?.y) return;

        const label = node.label;
        const fontSize = Math.max(14 / globalScale, 10);
        ctx.font = `${fontSize}px Inter, system-ui, -apple-system, sans-serif`;
        const textWidth = ctx.measureText(label).width;
        const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.8);

        const isHovered = node === hoveredNodeRef.current;
        const nodeSize = (node.size || 5) + (isHovered ? 2 : 0);
        const glowSize = nodeSize + 8;

        // Draw node glow
        ctx.shadowColor = node.color;
        ctx.shadowBlur = isHovered ? 20 : 15;
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowSize, 0, 2 * Math.PI, false);
        ctx.fill();

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Draw main node
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false);
        ctx.fill();

        // Draw border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = isHovered ? 3 : 2;
        ctx.stroke();

        // Draw label if hovered or zoomed in
        if (isHovered || globalScale > 0.5) {
          const cornerRadius = 4;
          const x = node.x - bckgDimensions[0] / 2;
          const y = node.y - bckgDimensions[1] / 2 - fontSize * 2.5;
          
          // Draw label background with slightly larger padding
          const padding = fontSize * 0.8; // Increased padding
          ctx.fillStyle = isHovered ? 'rgba(17, 24, 39, 0.98)' : 'rgba(17, 24, 39, 0.9)';
          ctx.beginPath();
          ctx.moveTo(x - padding + cornerRadius, y - padding);
          ctx.lineTo(x + bckgDimensions[0] + padding - cornerRadius, y - padding);
          ctx.quadraticCurveTo(x + bckgDimensions[0] + padding, y - padding, x + bckgDimensions[0] + padding, y - padding + cornerRadius);
          ctx.lineTo(x + bckgDimensions[0] + padding, y + bckgDimensions[1] + padding - cornerRadius);
          ctx.quadraticCurveTo(x + bckgDimensions[0] + padding, y + bckgDimensions[1] + padding, x + bckgDimensions[0] + padding - cornerRadius, y + bckgDimensions[1] + padding);
          ctx.lineTo(x - padding + cornerRadius, y + bckgDimensions[1] + padding);
          ctx.quadraticCurveTo(x - padding, y + bckgDimensions[1] + padding, x - padding, y + bckgDimensions[1] + padding - cornerRadius);
          ctx.lineTo(x - padding, y - padding + cornerRadius);
          ctx.quadraticCurveTo(x - padding, y - padding, x - padding + cornerRadius, y - padding);
          ctx.closePath();
          ctx.fill();

          // Draw label text with better contrast
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ffffff';
          ctx.font = `${isHovered ? 'bold' : 'normal'} ${fontSize}px Inter, system-ui, -apple-system, sans-serif`;
          ctx.fillText(label, node.x, y + bckgDimensions[1] / 2);
        }
      }}
      linkDirectionalParticles={NODE_PARTICLE_CONFIG.particles}
      linkDirectionalParticleWidth={NODE_PARTICLE_CONFIG.particleWidth}
      linkDirectionalParticleSpeed={NODE_PARTICLE_CONFIG.particleSpeed}
      width={width}
      height={height}
      cooldownTime={3000}
    />
  );
}

// Helper function to adjust color brightness
function adjustColor(color: string, amount: number): string {
  return color.replace(/^#/, '').replace(/.{2}/g, (hex) => {
    const value = Math.max(0, Math.min(255, parseInt(hex, 16) + amount))
    return value.toString(16).padStart(2, '0')
  })
} 