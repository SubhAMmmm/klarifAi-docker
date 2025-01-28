import React, { useState, useEffect } from 'react';
import { FileSearch, Lightbulb, Lock,Plus, ArrowLeft, Calendar, Clock, Upload, MessageSquare, Wand2, Download, Database, Network } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from './dashboard/Header';

const modules = [
  {
    id: 'document-qa',
    name: 'Document Q&A',
    description: 'Upload and chat with your documents to get instant summaries, accurate answers, and key insights, powered by AI.',
    path: '/dashboard',
    icon: FileSearch,
    actionText: 'Chat with Docs',
    active: true,
    features: [
      { id: 'upload', name: 'Upload Documents', icon: Upload, description: 'Upload your documents for analysis' },
      { id: 'chat', name: 'Chat Interface', icon: MessageSquare, description: 'Ask questions about your documents' },
      { id: 'download', name: 'Export Results', icon: Download, description: 'Download insights and summaries' }
    ]
  },
  {
    id: 'idea-generator',
    name: 'Idea Generator',
    description: 'Generate creative ideas, images and solutions using advanced AI brainstorming techniques.',
    path: '/idea-generation',
    actionText: 'Generate Ideas',
    icon: Lightbulb,
    active: true,
    features: [
      { id: 'generate', name: 'Generate Ideas', icon: Wand2, description: 'Create new ideas based on your input' },
      { id: 'refine', name: 'Refine Ideas', icon: MessageSquare, description: 'Improve and iterate on generated ideas' },
      { id: 'export', name: 'Export Ideas', icon: Download, description: 'Save and export your ideas' }
    ]
  },
  {
    id: 'topic-modeling',
    name: 'Topic Modeling',
    description: 'A smart data analysis tool that extracts topics and provides natural language insights.',
    path: '/topic-modeling',
    actionText: 'Analyze Topics',
    icon: Lock,
    active: false,
    features: [
      { id: 'upload', name: 'Upload Images', icon: Upload, description: 'Upload images for analysis' },
      { id: 'analyze', name: 'Analyze Content', icon: Wand2, description: 'Get AI-powered insights about your images' },
      { id: 'export', name: 'Export Analysis', icon: Download, description: 'Download analysis results' }
    ]
  },
  {
    id: 'structured-data-query',
    name: 'Structured Data Query',
    description: 'Transform natural language into precise SQL queries, enabling intuitive data exploration without complex database syntax.',
    path: '/structured-data-query',
    actionText: 'Start Querying',
    icon: Lock,
    active: false,
    features: [
      { id: 'create', name: 'Create Content', icon: Wand2, description: 'Generate new content with AI' },
      { id: 'edit', name: 'Edit & Refine', icon: MessageSquare, description: 'Refine and polish generated content' },
      { id: 'export', name: 'Export Content', icon: Download, description: 'Download your content' }
    ]
  }
];

const categories = [
  'Business',
  'Healthcare',
  'Beauty & Wellness',
  'Education',
  'Technology',
  'Other'
];

function App() {
    const [showWelcome, setShowWelcome] = useState(true);
    const [currentView, setCurrentView] = useState('create');
    const [projects, setProjects] = useState(() => {
      // Load projects from localStorage on initial render
      const savedProjects = localStorage.getItem('klarifai-projects');
      return savedProjects ? JSON.parse(savedProjects) : [];
    });
    const [currentProject, setCurrentProject] = useState(null);
    const [currentModule, setCurrentModule] = useState({ moduleId: null, featureId: null });
    const [projectData, setProjectData] = useState({
      name: '',
      description: '',
      category: '',
      selectedModules: []
    });
  
    const navigate = useNavigate();

    // Determine initial view based on projects
    useEffect(() => {
      const timer = setTimeout(() => {
        setShowWelcome(false);
        setCurrentView(projects.length > 0 ? 'projects' : 'create');
      }, 2000);
      return () => clearTimeout(timer);
    }, [projects.length]);

    // Update localStorage whenever projects change
  useEffect(() => {
    localStorage.setItem('klarifai-projects', JSON.stringify(projects));
  }, [projects]);

  // Simulate welcome screen transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleModuleToggle = (moduleId) => {
    const selectedModule = modules.find(m => m.id === moduleId);
    
    if (selectedModule && selectedModule.active) {
      setProjectData(prev => ({
        ...prev,
        selectedModules: prev.selectedModules.includes(moduleId)
          ? prev.selectedModules.filter(id => id !== moduleId)
          : [...prev.selectedModules, moduleId]
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newProject = {
      id: crypto.randomUUID(),
      ...projectData,
      createdAt: new Date().toISOString() // Ensure consistent date format
    };
    setProjects(prev => [...prev, newProject]);
    setCurrentProject(newProject);
    setCurrentView('modules');
    
    // Reset form after submission
    setProjectData({
      name: '',
      description: '',
      category: '',
      selectedModules: []
    });
  };

  const handleDeleteProject = (projectId) => {
    setProjects(prev => prev.filter(project => project.id !== projectId));
    
    // If the current project is deleted, reset the view
    if (currentProject && currentProject.id === projectId) {
      setCurrentProject(null);
      setCurrentView('projects');
    }
  };

  const handleProjectSelect = (project) => {
    setCurrentProject(project);
    setCurrentView('modules');
    setCurrentModule({ moduleId: null, featureId: null });
  };

  const handleModuleSelect = (moduleId) => {
    const selectedModule = modules.find(m => m.id === moduleId);
    
    if (selectedModule) {
      // Navigate to the module's specified path
      navigate(selectedModule.path);
      
      // Update the current module state
      setCurrentModule({ moduleId, featureId: null });
    }
  };

  const handleFeatureSelect = (featureId) => {
    setCurrentModule(prev => ({ ...prev, featureId }));
  };

  const handleModuleBack = () => {
    if (currentModule.featureId) {
      setCurrentModule(prev => ({ ...prev, featureId: null }));
    } else {
      setCurrentModule({ moduleId: null, featureId: null });
    }
  };

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <h1 className="text-4xl font-bold text-white mb-4">Welcome to Klarifai</h1>
          <p className="text-xl text-gray-300">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'modules' && currentProject) {
    const selectedModule = currentModule.moduleId ? modules.find(m => m.id === currentModule.moduleId) : null;

    if (selectedModule && currentModule.moduleId) {
      const selectedFeature = currentModule.featureId
        ? selectedModule.features.find(f => f.id === currentModule.featureId)
        : null;

      return (
        <div className="min-h-screen bg-gray-900 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={handleModuleBack}
                className="flex items-center text-emerald-300 hover:text-emerald-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                {currentModule.featureId ? 'Back to Module' : 'Back to Modules'}
              </button>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-white">{selectedModule.name}</h2>
                {selectedFeature && (
                  <p className="text-gray-400">{selectedFeature.name}</p>
                )}
              </div>
            </div>

            {selectedFeature ? (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-lg">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="p-3 bg-emerald-600/20 rounded-lg">
                    <selectedFeature.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{selectedFeature.name}</h3>
                    <p className="text-gray-400">{selectedFeature.description}</p>
                  </div>
                </div>
                <div className="p-6 bg-gray-700 rounded-lg">
                  <p className="text-gray-300 text-center">Feature interface will be implemented here</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {selectedModule.features.map(feature => (
                  <div
                    key={feature.id}
                    className="bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-emerald-500/20 cursor-pointer"
                    onClick={() => handleFeatureSelect(feature.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-emerald-600/20 rounded-lg">
                        <feature.icon className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{feature.name}</h3>
                        <p className="text-sm text-gray-400">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 p-4">
        <Header />
        <div className="max-w-6xl mx-auto pt-16">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setCurrentView('projects')}
              className="flex items-center text-emerald-300 hover:text-emerald-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Projects
            </button>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-white">{currentProject.name}</h2>
              <p className="text-gray-400">{currentProject.category}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules
              .filter(module => currentProject.selectedModules.includes(module.id))
              .map(module => (
                <div
                  key={module.id}
                  className="bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-emerald-500/20 cursor-pointer"
                  onClick={() => handleModuleSelect(module.id)}
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-emerald-600/20 rounded-lg">
                      <module.icon className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">{module.name}</h3>
                      <p className="text-gray-400 mb-4">{module.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {module.features.map(feature => (
                          <span
                            key={feature.id}
                            className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm flex items-center"
                          >
                            <feature.icon className="w-4 h-4 mr-1" />
                            {feature.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'projects') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 p-8">
          <Header />
        <div className="max-w-6xl mx-auto pt-16">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">My Projects</h1>
            <button
              onClick={() => setCurrentView('create')}
              className="px-6 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors"
            > Create new Project
              
            </button>
          </div>

          <div className="grid gap-6">
            {projects.map(project => (
              <div
                key={project.id}
                className="bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-emerald-500/20"
              >
                <div 
                  className="cursor-pointer" 
                  onClick={() => handleProjectSelect(project)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">{project.name}</h3>
                      <p className="text-gray-400 mb-4">{project.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(project.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-600/20 text-emerald-300 rounded-full text-sm">
                      {project.category}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.selectedModules.map(moduleId => {
                      const module = modules.find(m => m.id === moduleId);
                      return module ? (
                        <span
                          key={moduleId}
                          className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm flex items-center"
                        >
                          <module.icon className="w-4 h-4 mr-1" />
                          {module.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => handleProjectSelect(project)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg hover:bg-purple-600/30 transition-colors"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="px-4 py-2 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-xl mb-4">No projects yet</p>
                <p>Create your first project to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Create New Project</h1>
          {projects.length > 0 && (
            <button
              onClick={() => setCurrentView('projects')}
              className="text-emerald-300 hover:text-white transition-colors"
            >
              Go to your Project
            </button>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-2">
                Project Name
              </label>
              <input
                type="text"
                id="name"
                className="w-full px-4 py-2 bg-white/5 border border-gray-300/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter a unique, descriptive name"
                value={projectData.name}
                onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-200 mb-2">
                Description
              </label>
              <textarea
                id="description"
                className="w-full px-4 py-2 bg-white/5 border border-gray-300/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Describe your project's goals and objectives"
                rows={3}
                value={projectData.description}
                onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-200 mb-2">
                Category
              </label>
              <select
                id="category"
                className="w-full px-4 py-2 bg-white/5 border border-gray-300/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={projectData.category}
                onChange={(e) => setProjectData(prev => ({ ...prev, category: e.target.value }))}
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category} className="bg-gray-800">
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Available Modules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modules.map(module => (
                <div
                key={module.id}
                className={`p-4 rounded-lg border transition-all duration-300 ${
                  module.active
                    ? 'cursor-pointer ' + (projectData.selectedModules.includes(module.id)
                      ? 'bg-emerald-600/20 border-emerald-500'
                      : 'bg-white/5 border-gray-300/20 hover:bg-white/10')
                    : 'opacity-50 cursor-not-allowed bg-gray-800 border-gray-700'
                }`}
                onClick={() => handleModuleToggle(module.id)}
              >
                  <div className="flex items-center space-x-3">
                    {module.active ? (
                      <module.icon className="w-6 h-6 text-purple-400" />
                    ) : (
                      <Lock className="w-6 h-6 text-gray-500" />
                    )}
                    <div>
                      <h4 className="font-medium text-white">{module.name}</h4>
                      <p className="text-sm text-gray-300">
                        {module.active 
                          ? module.description 
                          : 'This module is currently locked. Coming soon!'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className="px-8 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-medium rounded-lg shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;