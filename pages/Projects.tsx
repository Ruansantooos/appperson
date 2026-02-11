
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, Badge, ButtonCircle } from '../components/ui/LayoutComponents';
import {
  Plus,
  Search,
  MoreHorizontal,
  Link as LinkIcon,
  Network,
  Maximize2,
  ChevronRight,
  Hash,
  Clock,
  X,
  Edit2,
  Trash2
} from 'lucide-react';
import { Project, GraphNode, GraphLink } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// Configurações da simulação de física
const PHYSICS = {
  repulsion: 2000,     // Força de repulsão entre nós
  centerGravity: 0.03, // Força que puxa para o centro
  linkDistance: 120,   // Distância ideal entre links
  linkStrength: 0.04,  // Força da mola dos links
  friction: 0.7,       // Perda de energia (0-1) - mais fricção = converge mais rápido
  maxFrames: 300,      // Máximo de frames da simulação (~5 segundos)
  maxVelocity: 15,     // Velocidade máxima por frame
};

// Extract keywords from text using [bracket] syntax
const extractKeywords = (text: string): string[] => {
  const regex = /\[([^\]]+)\]/g;
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1].toLowerCase().trim());
  }
  return [...new Set(matches)]; // Remove duplicates
};

// Find projects that share keywords
const findLinkedProjects = (currentProject: Project, allProjects: Project[]): string[] => {
  const currentKeywords = extractKeywords(currentProject.description || '');
  if (currentKeywords.length === 0) return [];

  return allProjects
    .filter(p => p.id !== currentProject.id)
    .filter(p => {
      const otherKeywords = extractKeywords(p.description || '');
      return currentKeywords.some(kw => otherKeywords.includes(kw));
    })
    .map(p => p.id);
};

// Error Boundary para capturar erros de render
class ProjectsErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-red-400 bg-red-500/10 rounded-xl border border-red-500/20">
          <h3 className="text-lg font-bold mb-2">Erro na página Projects</h3>
          <p className="text-sm font-mono">{this.state.error}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProjectsPageInner: React.FC = () => {
  const { user } = useAuth();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Active' as Project['status'],
    tags: [] as string[],
    tagInput: ''
  });
  const linksRef = useRef<GraphLink[]>([]); // Ref for physics engine to access latest links
  const draggedNodeRef = useRef<string | null>(null);
  const isSimulatingRef = useRef(false);
  const nodesRef = useRef<GraphNode[]>([]);
  const frameCountRef = useRef(0);

  const svgRef = useRef<SVGSVGElement>(null);
  const requestRef = useRef<number>(null);
  const velocities = useRef<Map<string, { vx: number, vy: number }>>(new Map());

  useEffect(() => {
    if (!user) return;
    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching projects:', error);
        return;
      }

      if (data) {
        const mappedProjects = data.map((p: any) => ({
          ...p,
          tags: Array.isArray(p.tags) ? p.tags : [],
          links: Array.isArray(p.links) ? p.links : [],
          lastEdited: p.last_edited,
          createdAt: p.created_at
        }));
        setProjects(mappedProjects);
        buildGraph(mappedProjects);
      }
    } catch (error) {
      console.error('Error in fetchProjects:', error);
    }
  };

  // Memoize active keywords to prevent re-calculating 60 times/sec
  const activeKeywords = useMemo(() => {
    const allKeywords = new Set<string>();
    projects.forEach(p => {
      extractKeywords(p.description || '').forEach(kw => allKeywords.add(kw));
    });
    return Array.from(allKeywords).slice(0, 5);
  }, [projects]);

  const openCreateModal = () => {
    setEditingProject(null);
    setFormData({ name: '', description: '', status: 'Active', tags: [], tagInput: '' });
    setShowModal(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      status: project.status,
      tags: project.tags,
      tagInput: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Create project data
      const projectData = {
        user_id: user.id,
        name: formData.name,
        description: formData.description,
        status: formData.status,
        tags: formData.tags,
        last_edited: new Date().toISOString()
      };

      if (editingProject) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', editingProject.id);

        if (error) throw error;
      } else {
        // Create new project
        const { error } = await supabase
          .from('projects')
          .insert(projectData);

        if (error) throw error;
      }

      setShowModal(false);
      await fetchProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Erro ao salvar projeto.');
    }
  };

  const updateAllProjectLinks = async () => {
    if (!user) return;

    try {
      // Fetch all projects
      const { data: allProjects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);

      if (!allProjects) return;

      // Update links for each project
      for (const project of allProjects) {
        const linkedIds = findLinkedProjects(project, allProjects);

        await supabase
          .from('projects')
          .update({ links: linkedIds })
          .eq('id', project.id);
      }

      // Refresh projects to show new links
      fetchProjects();
    } catch (error) {
      console.error('Error updating links:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este projeto?')) return;

    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Erro ao deletar projeto.');
    }
  };

  const addTag = () => {
    if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.tagInput.trim()],
        tagInput: ''
      });
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  const buildGraph = (projectsData: Project[]) => {
    const newNodes: GraphNode[] = [];
    const newLinks: GraphLink[] = [];

    // Root Node
    newNodes.push({ id: 'root', label: 'Nexus Home', type: 'root', x: 400, y: 300 });

    // Project Nodes
    projectsData.forEach((p, i) => {
      // Random position around center
      const angle = (i / projectsData.length) * 2 * Math.PI;
      const radius = 200;
      newNodes.push({
        id: p.id,
        label: p.name,
        type: 'project',
        x: 400 + Math.cos(angle) * radius,
        y: 300 + Math.sin(angle) * radius
      });

      // Link to root
      newLinks.push({ source: 'root', target: p.id });

      // Inter-project links
      if (p.links && Array.isArray(p.links)) {
        p.links.forEach((targetId: string) => {
          if (targetId && projectsData.some(other => other.id === targetId)) {
            newLinks.push({ source: p.id, target: targetId });
          }
        });
      }
    });

    nodesRef.current = newNodes;
    setNodes(newNodes);
    setLinks(newLinks);
    linksRef.current = newLinks;

    // Reset velocities
    newNodes.forEach(node => {
      velocities.current.set(node.id, { vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2 });
    });

    // Reiniciar simulação com os novos nós
    startSimulation();
  };


  // Inicia ou reinicia a simulação de física
  const startSimulation = () => {
    if (isSimulatingRef.current) return;
    isSimulatingRef.current = true;
    frameCountRef.current = 0;
    requestRef.current = requestAnimationFrame(updatePhysics);
  };

  // Loop de Simulação de Física (usa refs para evitar problemas de closure/batching)
  const updatePhysics = () => {
    const currentNodes = nodesRef.current;
    frameCountRef.current++;

    // Parar se não há nós ou se excedeu o limite de frames
    if (currentNodes.length === 0 || frameCountRef.current > PHYSICS.maxFrames) {
      isSimulatingRef.current = false;
      return;
    }

    const nextNodes = currentNodes.map(node => ({ ...node }));
    const nodeMap = new Map(nextNodes.map(n => [n.id, n]));
    let totalMovement = 0;

    nextNodes.forEach((node, i) => {
      if (node.id === draggedNodeRef.current) return;

      let { vx, vy } = velocities.current.get(node.id) || { vx: 0, vy: 0 };

      // 1. Gravidade Central
      vx += (400 - node.x) * PHYSICS.centerGravity;
      vy += (300 - node.y) * PHYSICS.centerGravity;

      // 2. Repulsão entre nós (Lei de Coulomb simplificada)
      nextNodes.forEach((other, j) => {
        if (i === j) return;
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const distSq = dx * dx + dy * dy + 1; // +1 para evitar divisão por valores muito pequenos
        const force = PHYSICS.repulsion / distSq;
        vx += (dx / Math.sqrt(distSq)) * force;
        vy += (dy / Math.sqrt(distSq)) * force;
      });

      // 3. Força de Link (Molas)
      if (linksRef.current) {
        linksRef.current.forEach(link => {
          if (link.source === node.id || link.target === node.id) {
            const targetId = link.source === node.id ? link.target : link.source;
            const targetNode = nodeMap.get(targetId);
            if (targetNode) {
              const dx = targetNode.x - node.x;
              const dy = targetNode.y - node.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const diff = (dist - PHYSICS.linkDistance) / dist;
              vx += dx * diff * PHYSICS.linkStrength;
              vy += dy * diff * PHYSICS.linkStrength;
            }
          }
        });
      }

      // Aplicar fricção
      vx *= PHYSICS.friction;
      vy *= PHYSICS.friction;

      // Clampar velocidade para evitar explosão
      const speed = Math.sqrt(vx * vx + vy * vy);
      if (speed > PHYSICS.maxVelocity) {
        const scale = PHYSICS.maxVelocity / speed;
        vx *= scale;
        vy *= scale;
      }

      node.x += vx;
      node.y += vy;
      totalMovement += Math.abs(vx) + Math.abs(vy);

      velocities.current.set(node.id, { vx, vy });
    });

    nodesRef.current = nextNodes;
    setNodes(nextNodes);

    // Se a simulação estabilizou, parar o loop
    if (totalMovement < 0.5 && !draggedNodeRef.current) {
      isSimulatingRef.current = false;
      return;
    }

    requestRef.current = requestAnimationFrame(updatePhysics);
  };

  useEffect(() => {
    startSimulation();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      isSimulatingRef.current = false;
    };
  }, []);

  // Handlers de Arraste
  const handleMouseDown = (nodeId: string) => {
    setDraggedNode(nodeId);
    draggedNodeRef.current = nodeId;
    setSelectedNode(nodeId);
    startSimulation();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNode && svgRef.current) {
      const CTM = svgRef.current.getScreenCTM();
      if (CTM) {
        const x = (e.clientX - CTM.e) / CTM.a;
        const y = (e.clientY - CTM.f) / CTM.d;
        const updated = nodesRef.current.map(n => n.id === draggedNode ? { ...n, x, y } : n);
        nodesRef.current = updated;
        setNodes(updated);
        velocities.current.set(draggedNode, { vx: 0, vy: 0 });
      }
    }
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
    draggedNodeRef.current = null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Slowburn': return 'warning';
      case 'Idle': return 'status';
      default: return 'default';
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col xl:flex-row gap-6 select-none" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
      {/* Sidebar de Projetos */}
      <div className="w-full xl:w-80 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/30">Main Maps</h3>
          <ButtonCircle icon={<Plus size={16} />} className="w-8 h-8" onClick={openCreateModal} />
        </div>

        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full h-10 bg-white/5 border border-white/5 rounded-lg pl-10 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#c1ff72]/40"
          />
        </div>

        <div className="space-y-3">
          {projects.length === 0 ? <p className="text-white/20 text-xs text-center">Nenhum projeto.</p> : projects.map(project => (
            <div
              key={project.id}
              className={`p-4 rounded-xl border border-white/5 cursor-pointer transition-all group ${selectedNode === project.id ? 'bg-[#c1ff72]/5 border-[#c1ff72]/30 scale-[1.02]' : 'bg-[#161616] hover:bg-white/[0.03]'}`}
              onClick={() => setSelectedNode(project.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className={`text-sm font-bold ${selectedNode === project.id ? 'text-[#c1ff72]' : 'text-white'}`}>{project.name}</h4>
                <div className="flex gap-2">
                  <Badge variant={getStatusColor(project.status) as any}>{project.status}</Badge>
                  <button onClick={(e) => { e.stopPropagation(); openEditModal(project); }} className="text-white/20 hover:text-[#c1ff72]">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }} className="text-white/20 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-white/40 mb-3 line-clamp-2">{project.description}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {project.tags.map(tag => (
                  <span key={tag} className="text-[9px] font-bold text-blue-400 opacity-60 group-hover:opacity-100">{tag}</span>
                ))}
              </div>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-[9px] text-white/20 font-medium uppercase flex items-center gap-1">
                  <Clock size={10} /> {project.lastEdited}
                </span>
                {project.links.length > 0 && (
                  <span className="text-[9px] text-[#c1ff72] font-bold flex items-center gap-1 uppercase">
                    <LinkIcon size={10} /> {project.links.length}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.2em]">Active Keywords</p>
          {activeKeywords.map(keyword => (
            <div key={keyword} className="flex items-center justify-between text-xs text-white/40 hover:text-white cursor-pointer group">
              <span className="flex items-center gap-2"><Hash size={12} className="text-[#c1ff72]" /> [{keyword}]</span>
              <ChevronRight size={12} className="opacity-0 group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Knowledge Graph */}
      <div className="flex-1 min-h-[500px] xl:min-h-full">
        <Card className="h-full relative overflow-hidden bg-[#0c0c0c] border-white/5">
          <div className="absolute top-6 left-6 z-10 pointer-events-none">
            <h3 className="text-xl font-bold tracking-tighter flex items-center gap-3">
              Graph of <span className="text-[#c1ff72]">+Home</span>
              <Network size={20} className="text-white/10" />
            </h3>
            <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mt-1">Simulação de Campo de Força Ativa</p>
          </div>

          <div className="absolute top-6 right-6 z-10 flex gap-2">
            <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5">
              <Maximize2 size={16} />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5">
              <MoreHorizontal size={16} />
            </button>
          </div>

          <svg
            ref={svgRef}
            width="100%" height="100%"
            viewBox="0 0 800 600"
            className="w-full h-full cursor-crosshair"
          >
            {/* Links Elásticos */}
            <g className="links">
              {links.map((link, i) => {
                const source = nodes.find(n => n.id === link.source);
                const target = nodes.find(n => n.id === link.target);
                if (!source || !target) return null;

                const isActive = selectedNode === link.source || selectedNode === link.target;
                return (
                  <line
                    key={i}
                    x1={source.x} y1={source.y}
                    x2={target.x} y2={target.y}
                    stroke={isActive ? '#c1ff72' : 'white'}
                    strokeWidth={isActive ? 1.5 : 0.2}
                    strokeOpacity={isActive ? 0.6 : 0.1}
                  />
                );
              })}
            </g>

            {/* Nós Draggable */}
            <g className="nodes">
              {nodes.map(node => {
                const isActive = selectedNode === node.id;
                const isConnected = links.some(l => (l.source === node.id && l.target === selectedNode) || (l.target === node.id && l.source === selectedNode));
                const nodeSize = node.type === 'root' ? 12 : node.type === 'project' ? 8 : 4;

                return (
                  <g
                    key={node.id}
                    className="cursor-grab active:cursor-grabbing group"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleMouseDown(node.id);
                    }}
                  >
                    {/* Glow effect */}
                    {(isActive || isConnected) && (
                      <circle cx={node.x} cy={node.y} r={nodeSize + 15} fill="#c1ff72" fillOpacity="0.05" />
                    )}

                    <circle
                      cx={node.x} cy={node.y}
                      r={nodeSize}
                      fill={isActive ? '#c1ff72' : isConnected ? '#c1ff72' : 'white'}
                      fillOpacity={isActive || isConnected ? 1 : node.type === 'task' ? 0.2 : 0.5}
                    />

                    {/* Label */}
                    {(nodeSize > 6 || isActive || isConnected) && (
                      <text
                        x={node.x} y={node.y + (nodeSize + 12)}
                        textAnchor="middle"
                        className={`text-[9px] font-bold pointer-events-none uppercase tracking-widest ${isActive ? 'fill-[#c1ff72]' : isConnected ? 'fill-white/60' : 'fill-white/20'}`}
                      >
                        {node.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center pointer-events-none">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white opacity-40"></div>
                <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Inativo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#c1ff72]"></div>
                <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Conectado</span>
              </div>
            </div>
            <p className="text-[9px] font-bold text-white/10 uppercase tracking-[0.4em]">Nexus Dynamic Engine v2.0</p>
          </div>
        </Card>
      </div>

      {/* Modal for Create/Edit Project */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl p-8 bg-[#161616] border border-white/5 rounded-[28px] relative">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-white/40 hover:text-white">
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold mb-6">{editingProject ? 'Editar Projeto' : 'Novo Projeto'}</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Nome do Projeto</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-14 px-6 bg-[#0c0c0c] border border-white/5 rounded-xl text-white focus:border-[#c1ff72] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                  Descrição (use [palavra] para criar links)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full h-32 px-6 py-4 bg-[#0c0c0c] border border-white/5 rounded-xl text-white focus:border-[#c1ff72] outline-none resize-none"
                  placeholder="Ex: Projeto usando [react] e [typescript] para criar um app..."
                />
                {formData.description && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {extractKeywords(formData.description).map(kw => (
                      <span key={kw} className="px-3 py-1 bg-[#c1ff72]/10 text-[#c1ff72] text-xs rounded-full border border-[#c1ff72]/20">
                        [{kw}]
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Project['status'] })}
                  className="w-full h-14 px-6 bg-[#0c0c0c] border border-white/5 rounded-xl text-white focus:border-[#c1ff72] outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Slowburn">Slowburn</option>
                  <option value="Idle">Idle</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={formData.tagInput}
                    onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 h-12 px-4 bg-[#0c0c0c] border border-white/5 rounded-xl text-white focus:border-[#c1ff72] outline-none"
                    placeholder="Adicionar tag..."
                  />
                  <button type="button" onClick={addTag} className="px-6 h-12 bg-white/5 rounded-xl text-white hover:bg-white/10">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full flex items-center gap-2">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-white">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-12 rounded-full font-bold bg-transparent border border-white/10 text-white hover:bg-white/5">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 h-12 rounded-full font-bold bg-[#c1ff72] text-black hover:bg-[#b0f061]">
                  {editingProject ? 'Salvar' : 'Criar Projeto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ProjectsPage: React.FC = () => (
  <ProjectsErrorBoundary>
    <ProjectsPageInner />
  </ProjectsErrorBoundary>
);

export default ProjectsPage;
