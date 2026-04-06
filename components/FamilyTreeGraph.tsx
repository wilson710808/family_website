'use client';

import { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Move, User } from 'lucide-react';

interface TreeMember {
  id: number;
  name: string;
  gender: 'male' | 'female';
  birth_year: number | null;
  death_year: number | null;
  relationship: string | null;
  spouse_id: number | null;
  generation: number;
  children?: TreeMember[];
  spouse?: TreeMember;
}

interface FamilyTreeGraphProps {
  members: TreeMember[];
  onMemberClick?: (member: TreeMember) => void;
}

interface Node {
  member: TreeMember;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function FamilyTreeGraph({ members, onMemberClick }: FamilyTreeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const NODE_WIDTH = 120;
  const NODE_HEIGHT = 80;
  const HORIZONTAL_GAP = 40;
  const VERTICAL_GAP = 100;
  const SPOUSE_GAP = 30;

  // 计算树的布局
  const calculateLayout = (members: TreeMember[]): { nodes: Node[], connections: {from: Node, to: Node, type: 'parent' | 'spouse'}[] } => {
    const nodes: Node[] = [];
    const connections: {from: Node, to: Node, type: 'parent' | 'spouse'}[] = [];
    
    // 按代分组
    const generations: Map<number, TreeMember[]> = new Map();
    members.forEach(m => {
      const gen = m.generation || 2;
      if (!generations.has(gen)) generations.set(gen, []);
      generations.get(gen)!.push(m);
    });

    // 构建父子关系映射
    const childrenMap = new Map<number, TreeMember[]>();
    members.forEach(m => {
      if (m.spouse_id) {
        const key = Math.min(m.id, m.spouse_id) * 1000 + Math.max(m.id, m.spouse_id);
        if (!childrenMap.has(key)) childrenMap.set(key, []);
      }
    });

    // 计算每代的位置
    let maxWidth = 0;
    generations.forEach((genMembers, gen) => {
      const width = genMembers.length * (NODE_WIDTH + HORIZONTAL_GAP);
      if (width > maxWidth) maxWidth = width;
    });

    // 分配节点位置
    const sortedGens = Array.from(generations.keys()).sort((a, b) => a - b);
    const nodeMap = new Map<number, Node>();

    sortedGens.forEach((gen, genIndex) => {
      const genMembers = generations.get(gen)!;
      const totalWidth = genMembers.length * (NODE_WIDTH + HORIZONTAL_GAP) - HORIZONTAL_GAP;
      const startX = -totalWidth / 2;

      genMembers.forEach((member, index) => {
        // 处理配偶关系
        let x = startX + index * (NODE_WIDTH + HORIZONTAL_GAP);
        if (member.spouse && nodeMap.has(member.spouse.id)) {
          const spouseNode = nodeMap.get(member.spouse.id)!;
          x = spouseNode.x + NODE_WIDTH + SPOUSE_GAP;
        }

        const node: Node = {
          member,
          x,
          y: genIndex * (NODE_HEIGHT + VERTICAL_GAP),
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
        };
        nodes.push(node);
        nodeMap.set(member.id, node);

        // 添加配偶连接线
        if (member.spouse && !nodeMap.has(member.spouse.id)) {
          // 配偶节点稍后处理
        }
      });
    });

    // 添加父子连接线
    members.forEach(member => {
      const memberNode = nodeMap.get(member.id);
      if (memberNode && member.children) {
        member.children.forEach(child => {
          const childNode = nodeMap.get(child.id);
          if (childNode) {
            connections.push({
              from: memberNode,
              to: childNode,
              type: 'parent'
            });
          }
        });
      }
    });

    // 添加配偶连接线
    members.forEach(member => {
      if (member.spouse) {
        const node1 = nodeMap.get(member.id);
        const node2 = nodeMap.get(member.spouse.id);
        if (node1 && node2 && member.id < member.spouse_id!) {
          connections.push({
            from: node1,
            to: node2,
            type: 'spouse'
          });
        }
      }
    });

    return { nodes, connections };
  };

  const { nodes, connections } = calculateLayout(members);

  // 计算视图边界
  const bounds = {
    minX: Math.min(...nodes.map(n => n.x)) - 50,
    maxX: Math.max(...nodes.map(n => n.x + n.width)) + 50,
    minY: Math.min(...nodes.map(n => n.y)) - 50,
    maxY: Math.max(...nodes.map(n => n.y + n.height)) + 50,
  };
  const viewBoxWidth = bounds.maxX - bounds.minX;
  const viewBoxHeight = bounds.maxY - bounds.minY;

  const handleZoomIn = () => setScale(s => Math.min(s * 1.2, 3));
  const handleZoomOut = () => setScale(s => Math.max(s / 1.2, 0.3));

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-blue-50 to-white rounded-xl overflow-hidden">
      {/* 控制按钮 */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50"
          title="放大"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50"
          title="缩小"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
      </div>

      {/* 提示 */}
      <div className="absolute bottom-4 left-4 text-sm text-gray-500 flex items-center gap-1">
        <Move className="w-4 h-4" />
        拖曳移动 | 滚轮缩放
      </div>

      {/* SVG 画布 */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        viewBox={`${bounds.minX} ${bounds.minY} ${viewBoxWidth} ${viewBoxHeight}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center',
        }}
      >
        {/* 连接线 */}
        {connections.map((conn, i) => {
          if (conn.type === 'spouse') {
            // 配偶连接线 - 水平虚线
            return (
              <line
                key={`conn-${i}`}
                x1={conn.from.x + conn.from.width}
                y1={conn.from.y + conn.from.height / 2}
                x2={conn.to.x}
                y2={conn.to.y + conn.to.height / 2}
                stroke="#f472b6"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            );
          } else {
            // 父子连接线 - 垂直线
            const midY = (conn.from.y + conn.from.height + conn.to.y) / 2;
            return (
              <g key={`conn-${i}`}>
                <line
                  x1={conn.from.x + conn.from.width / 2}
                  y1={conn.from.y + conn.from.height}
                  x2={conn.from.x + conn.from.width / 2}
                  y2={midY}
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
                <line
                  x1={conn.from.x + conn.from.width / 2}
                  y1={midY}
                  x2={conn.to.x + conn.to.width / 2}
                  y2={midY}
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
                <line
                  x1={conn.to.x + conn.to.width / 2}
                  y1={midY}
                  x2={conn.to.x + conn.to.width / 2}
                  y2={conn.to.y}
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
              </g>
            );
          }
        })}

        {/* 节点 */}
        {nodes.map(node => (
          <g
            key={node.member.id}
            className="cursor-pointer"
            onClick={() => onMemberClick?.(node.member)}
          >
            {/* 节点背景 */}
            <rect
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              rx="8"
              fill={node.member.gender === 'female' ? '#fdf2f8' : '#eff6ff'}
              stroke={node.member.gender === 'female' ? '#f472b6' : '#3b82f6'}
              strokeWidth="2"
              className="hover:stroke-opacity-100 transition-all"
            />
            
            {/* 姓名 */}
            <text
              x={node.x + node.width / 2}
              y={node.y + 25}
              textAnchor="middle"
              className="text-base font-bold fill-gray-900"
            >
              {node.member.name}
            </text>

            {/* 年份 */}
            {node.member.birth_year && (
              <text
                x={node.x + node.width / 2}
                y={node.y + 45}
                textAnchor="middle"
                className="text-sm fill-gray-500"
              >
                {node.member.birth_year}
                {node.member.death_year ? ` - ${node.member.death_year}` : ''}
              </text>
            )}

            {/* 关系 */}
            {node.member.relationship && (
              <text
                x={node.x + node.width / 2}
                y={node.y + 65}
                textAnchor="middle"
                className="text-xs fill-gray-400"
              >
                {node.member.relationship}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
