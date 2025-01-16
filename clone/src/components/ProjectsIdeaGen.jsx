import React from 'react';
import { ProjectProvider, ProjectList, useProject } from './ProjectManagement';
import IdeaForm from './IdeaForm';
const ProjectsIdeaGen = () => {
  return (
    <ProjectProvider>
      <ProjectManager />
    </ProjectProvider>
  )
};

const ProjectManager = () => {
    const { showProjectList, loadProject, startNewProject } = useProject();
  
    return showProjectList ? (
      <ProjectList
        onSelectProject={loadProject}
        onNewProject={startNewProject}
      />
    ) : (
      <IdeaForm />
    );
  };
  

export default ProjectsIdeaGen