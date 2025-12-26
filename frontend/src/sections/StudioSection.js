import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../App';
import { 
  Gamepad2, Plus, Play, Users, Clock, Star, Grid, Settings,
  Folder, FileCode, Box, Loader2, Trash2, Edit, Eye
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

const templates = [
  { id: '1', name: 'Obby Template', description: 'Classic obstacle course', thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop', category: 'game' },
  { id: '2', name: 'Tycoon Base', description: 'Build your empire', thumbnail: 'https://images.unsplash.com/photo-1493711662062-fa541f7f76a0?w=400&h=300&fit=crop', category: 'game' },
  { id: '3', name: 'Simulator Kit', description: 'Click simulator starter', thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop', category: 'game' },
  { id: '4', name: 'Roleplay Map', description: 'Town roleplay base', thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop', category: 'game' },
];

export default function StudioSection() {
  const { user, axiosInstance } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [view, setView] = useState('projects'); // projects | templates

  const fetchProjects = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/studio/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async (name, description, projectType) => {
    try {
      const response = await axiosInstance.post('/studio/projects', {
        name,
        description,
        project_type: projectType
      });
      setProjects(prev => [response.data, ...prev]);
      setShowCreateProject(false);
      toast.success('Project created!');
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--accent-primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" data-testid="studio-section">
      {/* Header */}
      <div className="px-4 md:px-6 py-4 border-b border-[var(--glass-border)] bg-[var(--bg-layer1)]/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-outfit font-bold text-[var(--text-primary)]">Vistagram Studio</h1>
              <p className="text-sm text-[var(--text-muted)]">Create and manage your projects</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowTemplates(true)} variant="outline" className="border-[var(--glass-border)] text-[var(--text-secondary)]">
              <Grid className="w-4 h-4 mr-2" /> Templates
            </Button>
            <Button onClick={() => setShowCreateProject(true)} className="btn-roblox" data-testid="create-project-btn">
              <Plus className="w-4 h-4 mr-2" /> New Project
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/20 flex items-center justify-center">
                <Folder className="w-5 h-5 text-[var(--accent-primary)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{projects.length}</p>
                <p className="text-sm text-[var(--text-muted)]">Projects</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-success)]/20 flex items-center justify-center">
                <Play className="w-5 h-5 text-[var(--accent-success)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">0</p>
                <p className="text-sm text-[var(--text-muted)]">Published</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">0</p>
                <p className="text-sm text-[var(--text-muted)]">Total Plays</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">0</p>
                <p className="text-sm text-[var(--text-muted)]">Favorites</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {projects.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-2xl bg-[var(--bg-layer2)] flex items-center justify-center mb-4">
              <Gamepad2 className="w-12 h-12 text-[var(--text-muted)]" />
            </div>
            <h2 className="text-xl font-outfit font-semibold text-[var(--text-primary)] mb-2">No Projects Yet</h2>
            <p className="text-[var(--text-muted)] mb-4 text-center max-w-md">
              Start creating your first project or use a template to get started quickly!
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setShowCreateProject(true)} className="btn-roblox">
                <Plus className="w-4 h-4 mr-2" /> New Project
              </Button>
              <Button onClick={() => setShowTemplates(true)} variant="outline" className="border-[var(--glass-border)] text-[var(--text-secondary)]">
                Browse Templates
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                whileHover={{ scale: 1.02, y: -4 }}
                className="glass-card overflow-hidden group cursor-pointer"
                data-testid={`project-${project.id}`}
              >
                <div className="aspect-video bg-[var(--bg-layer2)] relative overflow-hidden">
                  {project.thumbnail ? (
                    <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/20">
                      <Box className="w-12 h-12 text-[var(--text-muted)]" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button className="w-10 h-10 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
                      <Play className="w-5 h-5 text-white fill-white" />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                      <Edit className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-[var(--text-primary)] truncate">{project.name}</h3>
                  <p className="text-sm text-[var(--text-muted)] line-clamp-1 mt-1">{project.description || 'No description'}</p>
                  <div className="flex items-center justify-between mt-3 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(project.updated_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {project.plays || 0}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
        <DialogContent className="glass-panel border-[var(--glass-border)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)] font-outfit text-xl">Create New Project</DialogTitle>
          </DialogHeader>
          <CreateProjectForm onSubmit={handleCreateProject} />
        </DialogContent>
      </Dialog>

      {/* Templates Modal */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="glass-panel border-[var(--glass-border)] max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)] font-outfit text-xl">Project Templates</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {templates.map((template) => (
              <motion.div
                key={template.id}
                whileHover={{ scale: 1.02 }}
                className="glass-card overflow-hidden cursor-pointer"
                onClick={() => {
                  handleCreateProject(template.name, template.description, 'game');
                  setShowTemplates(false);
                }}
              >
                <div className="aspect-video bg-[var(--bg-layer2)] overflow-hidden">
                  <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-[var(--text-primary)]">{template.name}</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">{template.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateProjectForm({ onSubmit }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState('game');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a project name');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(name.trim(), description.trim(), projectType);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Project name"
        className="bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--text-primary)]"
        data-testid="project-name-input"
      />
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Project description (optional)"
        className="bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--text-primary)] min-h-[80px]"
      />
      <div>
        <label className="text-sm text-[var(--text-muted)] mb-2 block">Project Type</label>
        <Select value={projectType} onValueChange={setProjectType}>
          <SelectTrigger className="bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--text-primary)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[var(--bg-layer2)] border-[var(--glass-border)]">
            <SelectItem value="game" className="text-[var(--text-primary)]">Game</SelectItem>
            <SelectItem value="showcase" className="text-[var(--text-primary)]">Showcase</SelectItem>
            <SelectItem value="model" className="text-[var(--text-primary)]">Model</SelectItem>
            <SelectItem value="plugin" className="text-[var(--text-primary)]">Plugin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={loading} className="w-full btn-roblox" data-testid="project-submit">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Project'}
      </Button>
    </form>
  );
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
