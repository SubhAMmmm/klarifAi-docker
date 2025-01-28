

import React, { useState, useEffect } from 'react';
import { Plus, FolderOpen, Clock, Eye, Trash2, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import Header from './dashboard/Header';
import backgroundImage from '../assets/bg-main.jpg';

const Alert = ({ title, description, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="w-96 bg-gray-800 border border-red-500/50 rounded-lg shadow-2xl text-white p-6 animate-in zoom-in-95">
      <h4 className="text-xl font-bold mb-3 text-red-400">{title}</h4>
      <p className="text-gray-300 mb-6">{description}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

const ProjectNameModal = ({ onSubmit, onCancel }) => {
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (projectName.trim()) {
      onSubmit(projectName.trim());
      setProjectName('');
      setError('');
    } else {
      setError('Project name is required');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-gray-800/95 rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl border border-gray-700 animate-in slide-in-from-bottom-4">
        <h3 className="text-2xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          Create New Idea Project
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Idea Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter Idea project name"
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 focus:ring-2 focus:ring-gray-400 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!projectName.trim()}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-lg hover:from-blue-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-lg"
            >
              Create Idea Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProjectCard = ({ project, onNavigate, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group bg-gray-800/80 rounded-xl p-6 transition-all duration-300 border border-gray-700 hover:border-green-500/50 shadow-lg hover:shadow-xl hover:bg-gray-750 hover:scale-[1.02]"
    >
      <div className="flex justify-between items-start gap-6">
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-emerald-400 transition-all duration-300">
              {project.name}
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              {project.formData?.product || 'No product specified'}
            </p>
          </div>
          
          <div className="space-y-3 text-gray-400 text-sm">
            <p className="flex items-center gap-2">
              <Clock size={14} className="text-gray-500" />
              Last modified: {format(new Date(project.lastModified), 'MMM d, yyyy')}
            </p>
            <p className="flex items-center gap-2">
              <Eye size={14} className="text-gray-500" />
              {project.acceptedIdeas?.length 
                ? `${project.acceptedIdeas.length} Generated ideas` 
                : 'No generated ideas yet'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => onNavigate(project)}
            className="px-4 py-2 bg-blue-600/90 text-white rounded-lg hover:bg-blue-500 transition-all duration-200 flex items-center gap-2 group/btn"
          >
            <Eye size={16} />
            View
            <ChevronRight size={16} className="opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all duration-200" />
          </button>
          <button
            onClick={() => onDelete(project.id)}
            className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const ProjectList = ({ onSelectProject, onNewProject }) => {
  const [projects, setProjects] = useState([]);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    try {
      const savedProjects = JSON.parse(localStorage.getItem('ideaProjects') || '[]');
      const recentProjects = savedProjects.slice(0, 5);
      setProjects(recentProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
    }
  };

  const handleNewProject = (projectName) => {
    try {
      const newProject = {
        id: Date.now().toString(),
        name: projectName,
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };

      const updatedProjects = [newProject, ...projects].slice(0, 5);
      localStorage.setItem('ideaProjects', JSON.stringify(updatedProjects));
      setProjects(updatedProjects);
      setShowNameModal(false);
      onNewProject(newProject);
    } catch (error) {
      console.error('Error creating new project:', error);
    }
  };

  const confirmDelete = (projectId) => {
    setProjectToDelete(projectId);
    setShowDeleteAlert(true);
  };

  const handleDeleteProject = () => {
    try {
      const updatedProjects = projects.filter(project => project.id !== projectToDelete);
      localStorage.setItem('ideaProjects', JSON.stringify(updatedProjects));
      setProjects(updatedProjects);
      setShowDeleteAlert(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#111827', // Fallback color
      }}
    >
      
    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
    
    <div className="relative z-10 p-14">
      <Header />
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            My Idea Projects
          </h2>
          <button 
            onClick={() => setShowNameModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-lg hover:from-blue-600 hover:to-emerald-600 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Plus size={20} />
            New Idea Project
          </button>
        </div>

        <div className="grid gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onNavigate={(p) => onSelectProject({ ...p, skipToIdeas: true })}
              onDelete={confirmDelete}
            />
          ))}

          {projects.length === 0 && (
            <div className="text-center py-16 bg-gray-800/30 rounded-xl border-2 border-dashed border-gray-700 hover:border-gray-600 transition-all duration-200">
              <FolderOpen size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400 text-lg">No projects yet. Start by creating a new one!</p>
            </div>
          )}
        </div>
      </div>
      </div>

      {showNameModal && (
        <ProjectNameModal
          onSubmit={handleNewProject}
          onCancel={() => setShowNameModal(false)}
        />
      )}

      {showDeleteAlert && (
        <Alert
          title="Delete Project?"
          description="This action cannot be undone. Are you sure you want to delete this project?"
          onConfirm={handleDeleteProject}
          onCancel={() => setShowDeleteAlert(false)}
        />
      )}
    </div>
  );
};

// Rest of the code (ProjectContext, ProjectProvider, useProject) remains the same
const ProjectContext = React.createContext();

const ProjectProvider = ({ children }) => {
  const [currentProject, setCurrentProject] = useState(null);
  const [showProjectList, setShowProjectList] = useState(true);

  const saveProject = (projectData) => {
    try {
      const projects = JSON.parse(localStorage.getItem('ideaProjects') || '[]');
      
      if (currentProject) {
        const updatedProjects = projects.map(project => 
          project.id === currentProject.id 
            ? { ...projectData, lastModified: new Date().toISOString() }
            : project
        ).slice(0, 5);
        localStorage.setItem('ideaProjects', JSON.stringify(updatedProjects));
      } else {
        const newProject = {
          ...projectData,
          id: Date.now().toString(),
          created: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        };
        localStorage.setItem('ideaProjects', JSON.stringify([newProject, ...projects].slice(0, 5)));
        setCurrentProject(newProject);
      }
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const loadProject = (project) => {
    setCurrentProject(project);
    setShowProjectList(false);
  };

  const startNewProject = (project) => {
    setCurrentProject(project);
    setShowProjectList(false);
  };

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        showProjectList,
        saveProject,
        loadProject,
        startNewProject,
        setShowProjectList,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

const useProject = () => {
  const context = React.useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export { ProjectProvider, useProject, ProjectList };