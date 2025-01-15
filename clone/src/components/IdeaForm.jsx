//IdeaForm.jsx
import React, { useState, useCallback, useEffect } from "react";
import { ideaService } from "../utils/axiosConfig";
import AdvancedRegenControls from "../components/AdvancedRegenControls";
import Header from "./dashboard/Header";
import VersionHistory from "./VersionHistory";
import { format } from "date-fns";
import PowerPointExport from "./PowerPointExport";
import { useProject } from "./ProjectManagement";
import backgroundImage from '../assets/bg-main.jpg'; 

import {
  PlusCircle,
  X,
  Check,
  Edit2,
  Image,
  RotateCw,
  ArrowLeft,
  Clock,
  ArrowRight,
  Eye
} from "lucide-react";

const IdeaForm = () => {
  const {
    currentProject,
    saveProject,
    setShowProjectList
  } = useProject();

  // Add these state variables
  

  // Initialize with empty dynamic fields
  const [dynamicFields, setDynamicFields] = useState({});

  // Predefined field types
  const predefinedFieldTypes = ["Benefits", "RTB", "Ingredients", "Price"];
  const [customFieldTypes, setCustomFieldTypes] = useState([]);
  const [newCustomField, setNewCustomField] = useState("");

  const [ideas, setIdeas] = useState([]);
  const [acceptedIdeas, setAcceptedIdeas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(true);
  const [generatedImages, setGeneratedImages] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [editingIdea, setEditingIdea] = useState(null);
  const [hasManuallySetIdeas, setHasManuallySetIdeas] = useState(false);
  const [editForm, setEditForm] = useState({
    product_name: "",
    description: "",
  });
  const [showImageGeneration, setShowImageGeneration] = useState(false);
  const [lastSection, setLastSection] = useState(null);
  const [imageGenerationInProgress, setImageGenerationInProgress] =
    useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedIdeaForHistory, setSelectedIdeaForHistory] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const [selectedVersion, setSelectedVersion] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  

  
  const [rawVersionHistory, setRawVersionHistory] = useState({});
  const [formData, setFormData] = useState({})


  const [projectName, setProjectName] = useState(
    currentProject?.name || `Project ${new Date().toLocaleDateString()}`
  );

  // Add this effect to load project data
  useEffect(() => {
    if (currentProject) {
      setFormData(currentProject.formData || {
        product: "",
        brand: "",
        category: "",
        number_of_ideas: 1,
      });
      setDynamicFields(currentProject.dynamicFields || {});
      setIdeas(currentProject.ideas || []);
      setAcceptedIdeas(currentProject.acceptedIdeas || []);
      setGeneratedImages(currentProject.generatedImages || {});
      
      // Check if we should navigate directly to ideas
      if (currentProject.skipToIdeas && currentProject.ideas?.length > 0) {
        setShowForm(false);
      }
    }
  }, [currentProject]);

   // Add this effect to auto-save changes
   useEffect(() => {
    if (currentProject || ideas.length > 0) {
      const projectData = {
        id: currentProject?.id,
        name: projectName,
        formData,
        dynamicFields,
        ideas,
        acceptedIdeas,
        generatedImages,
        showForm,
        showImageGeneration,
      };
      saveProject(projectData);
    }
  }, [
    projectName,
    formData,
    dynamicFields,
    ideas,
    acceptedIdeas,
    generatedImages,
    showForm,
    showImageGeneration,
  ]);

  const renderNavigation = () => (
    <div className="flex items-center justify-between mb-6 bg-gray-800 border border-gray-700 hover:border-green-500/50 p-4 rounded-lg shadow-lg">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowProjectList(true)}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-green-500/50 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          All Projects
        </button>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
          placeholder="Project Name"
        />
      </div>
      <div className="flex gap-3">
        {/* <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Eye size={16} />
              View Ideas
            </button> */}
      </div>
    </div>
  );



  // Add this function to fetch version history for all ideas
  const fetchAllVersionHistories = async () => {
    
    try {
      for (const idea of acceptedIdeas) {
        const response = await ideaService.getIdeaHistory(idea.idea_id);
        console.log('Fetched version history:', response.data.history);
        if (response.data.success) {
          setRawVersionHistory(prevHistory => ({
            ...prevHistory,
            history: response.data.history
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching version histories:', err);
    }
    
    console.log('Updated rawVersionHistory:', rawVersionHistory);
  };

  useEffect(() => {
    if (acceptedIdeas.length > 0) {
      fetchAllVersionHistories();
    }
  }, [acceptedIdeas]);

  // Add new handler functions
  const handleViewHistory = (idea) => {
    setSelectedIdeaForHistory(idea);
    setShowVersionHistory(true);
    setSelectedImage(null); // Reset selected image when opening history
  };

  const handleImageVersionSelect = (imageVersion, fullVersion = null) => {
    setSelectedImage(imageVersion);

    // If a full version is provided, store it for potential complete restoration
    if (fullVersion) {
      setSelectedVersion(fullVersion);
    }
  };

  // Calculate suggested number of ideas based on form fields
  useEffect(() => {
    if (!hasManuallySetIdeas) {
      // Group dynamic fields by their type
      const fieldsByType = Object.values(dynamicFields).reduce((acc, field) => {
        if (field.value.trim() !== "") {
          acc[field.type] = (acc[field.type] || 0) + 1;
        }
        return acc;
      }, {});

      // Calculate combinations
      const fieldTypeCounts = Object.values(fieldsByType);

      // Default to 1 if no fields are filled
      const totalCombinations =
        fieldTypeCounts.length > 0
          ? fieldTypeCounts.reduce((acc, count) => acc * count, 1)
          : 1;

      // Ensure at least 1 idea, cap at a reasonable maximum (e.g., 20)
      const suggestedNumber = Math.min(
        Math.max(1, totalCombinations),
        20 // Optional: Prevent exponential growth
      );

      setFormData((prev) => ({
        ...prev,
        number_of_ideas: suggestedNumber,
      }));
    }
  }, [dynamicFields, hasManuallySetIdeas]);
  // Add a handler for returning to form while preserving state
  const handleBackToForm = () => {
    setShowForm(true);
    // Remove the setIdeas([]) line to preserve existing ideas
    setError(null);
  };
  // Add error handling wrapper
  const handleApiError = useCallback(async (response) => {
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "API request failed");
    }
    return response.json();
  }, []);

  const handleAccept = (ideaId) => {
    const ideaToAccept = ideas.find((idea) => idea.idea_id === ideaId);
    if (ideaToAccept) {
      setAcceptedIdeas((prev) => [ideaToAccept, ...prev]);
      // Clear any existing generated image when accepting again
      setGeneratedImages((prev) => {
        const newImages = { ...prev };
        delete newImages[ideaId];
        return newImages;
      });
    }
  };

  const handleUnaccept = (ideaId) => {
    setAcceptedIdeas((prev) => prev.filter((idea) => idea.idea_id !== ideaId));
    setGeneratedImages((prev) => {
      const newImages = { ...prev };
      delete newImages[ideaId];
      return newImages;
    });

    if (acceptedIdeas.length <= 1) {
      setShowImageGeneration(false);
    }
  };

  const handleEdit = (idea) => {
    setEditingIdea(idea.idea_id);
    setEditForm({
      product_name: idea.product_name,
      description: idea.description,
    });
    setLastSection(showImageGeneration ? "image" : "idea");
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateIdea = async (ideaId) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await ideaService.updateIdea({
        idea_id: ideaId,
        ...editForm,
      });

      // Check if response exists and has expected structure
      if (response?.data?.success && response.data?.updated_data) {
        const updatedIdea = {
          idea_id: response.data.updated_data.idea_id,
          product_name: response.data.updated_data.product_name,
          description: response.data.updated_data.description,
        };

        // Update both ideas and acceptedIdeas arrays
        setIdeas(
          ideas.map((idea) => (idea.idea_id === ideaId ? updatedIdea : idea))
        );

        setAcceptedIdeas(
          acceptedIdeas.map((idea) =>
            idea.idea_id === ideaId ? updatedIdea : idea
          )
        );

        // Check if the idea is in accepted ideas and regenerate its image
        const isAccepted = acceptedIdeas.some(
          (accepted) => accepted.idea_id === ideaId
        );

        if (isAccepted) {
          // Remove existing image to trigger regeneration
          setGeneratedImages((prev) => {
            const newImages = { ...prev };
            delete newImages[ideaId];
            return newImages;
          });

          // Automatically regenerate image after a short delay
          setTimeout(() => {
            handleRegenerateImage(ideaId);
          }, 500);
        }

        setEditingIdea(null);

        // Return to previous section
        if (lastSection === "image") {
          setShowImageGeneration(true);
        }
      } else {
        throw new Error(
          response?.data?.error || "Invalid response from server"
        );
      }
    } catch (err) {
      console.error("Update error:", err);
      setError(
        err?.response?.data?.error ||
          err.message ||
          "Failed to connect to the server"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (ideaId) => {
    try {
      const response = await ideaService.deleteIdea(ideaId);

      if (response.data.success) {
        // Remove the idea from both ideas and acceptedIdeas arrays
        setIdeas(ideas.filter((idea) => idea.idea_id !== ideaId));
        setAcceptedIdeas(
          acceptedIdeas.filter((idea) => idea.idea_id !== ideaId)
        );

        // Remove the generated image for this idea
        setGeneratedImages((prev) => {
          const newImages = { ...prev };
          delete newImages[ideaId];
          return newImages;
        });

        // If we're in image generation view and there are no more accepted ideas, go back to ideas view
        if (showImageGeneration && acceptedIdeas.length <= 1) {
          setShowImageGeneration(false);
        }
      } else {
        setError(response.data.error || "Failed to delete idea");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to connect to the server");
    }
  };

  const handleRegenerateImage = useCallback(
    async (params) => {
      // If params is not an object (old way), convert it to the expected format
      const ideaId = typeof params === "object" ? params.idea_id : params;

      if (loadingStates[ideaId]) return;

      setLoadingStates((prev) => ({ ...prev, [ideaId]: true }));
      setError(null);

      try {
        // Find the idea from acceptedIdeas if not provided in params
        const idea = acceptedIdeas.find((i) => i.idea_id === ideaId);
        if (!idea) throw new Error("Idea not found");

        const description =
          typeof params === "object"
            ? params.description
            : `${idea.product_name}: ${idea.description}`;

        const response = await ideaService.regenerateProductImage({
          description: description,
          idea_id: ideaId,
          size: params.size || 768,
          steps: params.steps || 30,
          guidance_scale: params.guidance_scale || 7.5,
        });

        if (response.data.success) {
          setGeneratedImages((prev) => ({
            ...prev,
            [ideaId]: `data:image/png;base64,${response.data.image}`,
          }));
        } else {
          throw new Error(response.data.error || "Failed to regenerate image");
        }
      } catch (err) {
        console.error("Image regeneration error:", err);
        setError(
          err.response?.data?.error ||
            err.message ||
            "Failed to regenerate image"
        );
      } finally {
        setLoadingStates((prev) => ({ ...prev, [ideaId]: false }));
      }
    },
    [acceptedIdeas, loadingStates]
  );

  const handleBaseFieldChange = (e) => {
    const { name, value } = e.target;
    if (name === "number_of_ideas") {
      setHasManuallySetIdeas(true);
      const numValue = value === '' ? '' : parseInt(value);
      setFormData((prev) => ({
        ...prev,
        [name]: numValue
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleDynamicFieldChange = (fieldId, value) => {
    setDynamicFields((prev) => ({
      ...prev,
      [fieldId]: { ...prev[fieldId], value },
    }));
  };

  const addField = (type) => {
    const fieldCount = Object.keys(dynamicFields).filter(
      (key) => dynamicFields[key].type.toLowerCase() === type.toLowerCase()
    ).length;

    const newFieldId = `${type.toLowerCase()}-${fieldCount + 1}`;
    
    // Create new fields object with new field at the top
    const updatedFields = {
      [newFieldId]: { type, value: "" },
      ...dynamicFields
    };

    setDynamicFields(updatedFields);
    setHasManuallySetIdeas(false);
  };
  const removeField = (fieldId) => {
    setDynamicFields((prev) => {
      const newFields = { ...prev };
      delete newFields[fieldId];
      return newFields;
    });
    // Reset manual override when removing fields
    setHasManuallySetIdeas(false);
  };

  const addCustomFieldType = (e) => {
    e.preventDefault();
    if (newCustomField && !customFieldTypes.includes(newCustomField)) {
      setCustomFieldTypes([...customFieldTypes, newCustomField]);
      setNewCustomField("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setIsGenerating(true);
    setError(null);
  
    const submissionData = {
      ...formData,
      dynamicFields,
    };
  
    try {
      const response = await ideaService.generateIdeas(submissionData);
  
      if (response.data.success) {
        // Ensure we're properly spreading both arrays and handling the state update
        setIdeas(prevIdeas => {
          const newIdeas = response.data.ideas || [];
          // Filter out any duplicate ideas based on idea_id
          const uniqueNewIdeas = newIdeas.filter(
            newIdea => !prevIdeas.some(existingIdea => existingIdea.idea_id === newIdea.idea_id)
          );
          return [...uniqueNewIdeas, ...prevIdeas];
        });
        
        // Only switch to ideas view if this is the first generation
        if (showForm) {
          setShowForm(false);
        }
      } else {
        setError(response.data.error || "Failed to generate ideas");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to connect to the server");
      console.error("Generation error:", err);
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  

  const handleNewIdea = () => {
    setShowForm(true);
    setIdeas([]);
    setAcceptedIdeas([]);
    setGeneratedImages({});
    setLoadingStates({});
    setFormData({
      product: "",
      brand: "",
      category: "",
      number_of_ideas: 1,
    });
    setDynamicFields({
      "field-1": { type: "benefit", value: "" },
      "field-2": { type: "RTB", value: "" },
    });
    setCustomFieldTypes([]);
  };

  // Update generateImagesSequentially to use the new callback
  // Simplified sequential image generation
  const generateImagesSequentially = useCallback(async () => {
    if (imageGenerationInProgress) return;

    setImageGenerationInProgress(true);
    setError(null);

    try {
      for (const idea of acceptedIdeas) {
        if (!generatedImages[idea.idea_id]) {
          await handleRegenerateImage({
            idea_id: idea.idea_id,
            description: `${idea.product_name}: ${idea.description}`,
            size: 768,
            steps: 30,
            guidance_scale: 7.5,
          });
          // Add a delay between image generations
          await new Promise((resolve) => setTimeout(resolve, 6000)); // 6 seconds delay
        }
      }
    } catch (err) {
      setError("Error generating images sequentially");
    } finally {
      setImageGenerationInProgress(false);
    }
  }, [
    acceptedIdeas,
    generatedImages,
    handleRegenerateImage,
    imageGenerationInProgress,
  ]);

  // Auto-generate images when entering image generation view
  useEffect(() => {
    if (
      showImageGeneration &&
      acceptedIdeas.length > 0 &&
      !imageGenerationInProgress &&
      Object.keys(generatedImages).length < acceptedIdeas.length
    ) {
      generateImagesSequentially();
    }
  }, [
    showImageGeneration,
    acceptedIdeas.length,
    generateImagesSequentially,
    imageGenerationInProgress,
    generatedImages,
  ]);

  const handleProceedToImages = () => {
    if (acceptedIdeas.length > 0) {
      setShowImageGeneration(true);
      generateImagesSequentially();
    } else {
      setError("Please accept at least one idea before proceeding");
    }
  };

  const handleBackToIdeas = () => {
    setShowImageGeneration(false);
  };

  const handleRestoreVersion = (restoredData) => {
    // Handle both complete version restore and single image restore
    const isImageOnlyRestore = selectedImage && !restoredData.product_name;

    if (isImageOnlyRestore) {
      // Update just the image for the existing idea
      setGeneratedImages((prev) => ({
        ...prev,
        [selectedIdeaForHistory.idea_id]: `data:image/png;base64,${selectedImage.image_url}`,
      }));
    } else {
      // Update the full idea and its associated images
      const updatedIdeas = ideas.map((idea) =>
        idea.idea_id === selectedIdeaForHistory.idea_id
          ? {
              ...idea,
              product_name: restoredData.product_name,
              description: restoredData.description,
              idea_id: restoredData.id || idea.idea_id, // Preserve ID if not provided
            }
          : idea
      );
      setIdeas(updatedIdeas);

      const updatedAcceptedIdeas = acceptedIdeas.map((idea) =>
        idea.idea_id === selectedIdeaForHistory.idea_id
          ? {
              ...idea,
              product_name: restoredData.product_name,
              description: restoredData.description,
              idea_id: restoredData.id || idea.idea_id,
            }
          : idea
      );
      setAcceptedIdeas(updatedAcceptedIdeas);

      // Update images if provided
      if (restoredData.images && restoredData.images.length > 0) {
        const ideaId = restoredData.id || selectedIdeaForHistory.idea_id;
        setGeneratedImages((prev) => ({
          ...prev,
          [ideaId]: `data:image/png;base64,${restoredData.images[0].image_url}`,
        }));
      }
    }

    // Reset selection state
    setShowVersionHistory(false);
    setSelectedIdeaForHistory(null);
    setSelectedImage(null);
    setSelectedVersion(null);
  };
  // Update the existing modal section in the return statement to include both image preview and version history
  const renderVersionHistoryModal = () => {
    if (!showVersionHistory || !selectedIdeaForHistory) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex">
          {/* Version History Panel */}
          <div className="flex-1 max-w-4xl">
            <VersionHistory
              idea={selectedIdeaForHistory}
              onRestoreVersion={handleRestoreVersion}
              onClose={() => {
                setShowVersionHistory(false);
                setSelectedIdeaForHistory(null);
                setSelectedImage(null);
              }}
              onSelectImage={handleImageVersionSelect}
            />
          </div>

          {/* Image Preview Panel */}
          {selectedImage && (
            <div className="w-96 border-l border-gray-700 p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Image Preview
                </h3>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-900 mb-4">
                  <img
                    src={`data:image/png;base64,${selectedImage.image_url}`}
                    alt="Selected version"
                    className="w-full h-full object-cover"
                  />
                </div>

                {selectedImage.parameters && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-white">Parameters</h4>
                    <div className="text-sm text-gray-400">
                      {Object.entries(JSON.parse(selectedImage.parameters)).map(
                        ([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">
                              {key.replace("_", " ")}:
                            </span>
                            <span>{value}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 text-sm text-gray-400">
                  Created: {format(new Date(selectedImage.created_at), "PPpp")}
                </div>

                <div className="space-y-2 mt-4">
                  <button
                    onClick={() =>
                      handleRestoreVersion({
                        image_url: selectedImage.image_url,
                      })
                    }
                    className="w-full btn btn-secondary"
                  >
                    Restore Image Only
                  </button>
                  {selectedVersion && (
                    <button
                      onClick={() => handleRestoreVersion(selectedVersion)}
                      className="w-full btn btn-primary"
                    >
                      Restore Full Version
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Add an overlay to ensure content readability */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Wrap all content in a relative container to appear above the overlay */}
      <div className="relative">
        <nav className="navbar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Header />
            <div className="flex items-center justify-center h-16">
              <h1 className="text-xl font-bold text-white">Idea Generator</h1>
            </div>
          </div>
        </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
        {renderNavigation()}
          {showForm ? (
            <div className="form-card animate-fade-in bg-gray-900/90 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white text-center mb-8">
                Generate Product Ideas
              </h2>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Base Fields */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Product <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="product"
                      name="product"
                      value={formData.product}
                      onChange={handleBaseFieldChange}
                      required
                      className="input-field w-full"
                      placeholder="Enter product name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleBaseFieldChange}
                      required
                      className="input-field w-full"
                      placeholder="Enter category"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Brand
                    </label>
                    <input
                      type="text"
                      id="brand"
                      name="brand"
                      value={formData.brand}
                      onChange={handleBaseFieldChange}
                      className="input-field w-full"
                      placeholder="Enter brand name"
                    />
                  </div>
                </div>

                {/* Dynamic Fields Section */}
                <div className="space-y-6">
                  <div className="border-t border-gray-700 pt-6">
                    <h3 className="text-lg font-medium text-white mb-4">
                      Dynamic Fields
                    </h3>

                    {/* Custom Field Addition */}
                    <div className="bg-gray-700/50 p-4 rounded-lg space-y-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCustomField}
                          onChange={(e) => setNewCustomField(e.target.value)}
                          placeholder="Add custom field type..."
                          className="input-field flex-1"
                        />
                        <button
                          type="button"
                          onClick={addCustomFieldType}
                          className="btn btn-secondary whitespace-nowrap bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-lg hover:from-blue-600 hover:to-emerald-600 transition-all"
                        >
                          Add Field Type
                        </button>
                      </div>
                      {/* Predefined Field Buttons */}
                      <div className="flex flex-wrap gap-3 mb-4">
                        {predefinedFieldTypes.map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => addField(type)}
                            className="btn btn-primary bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-lg hover:from-blue-600 hover:to-emerald-600"
                          >
                            <PlusCircle size={16} className="mr-2" /> {type}
                          </button>
                        ))}
                        {customFieldTypes.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {customFieldTypes.map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => addField(type)}
                                className="btn btn-secondary bg-gradient-to-r from-blue-500 to-emerald-500 "
                              >
                                <PlusCircle size={16} className="mr-2" /> {type}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Field Inputs */}
                  <div className="space-y-4 mt-6">
                    {Object.entries(dynamicFields).map(([fieldId, field]) => (
                      <div key={fieldId} className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            {field.type}
                          </label>
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) =>
                              handleDynamicFieldChange(fieldId, e.target.value)
                            }
                            className="input-field"
                            placeholder={`Enter ${field.type.toLowerCase()}`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeField(fieldId)}
                          className="btn btn-danger self-end"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Number of Ideas Input */}
                <div className="border-t border-gray-700 pt-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Number of Ideas{" "}
                    {!hasManuallySetIdeas }
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      name="number_of_ideas"
                      value={formData.number_of_ideas}
                      onChange={handleBaseFieldChange}
                      min="1"
                      required
                      className="input-field w-full md:w-1/4"
                    />
                    {hasManuallySetIdeas && (
                      <button
                        type="button"
                        onClick={() => setHasManuallySetIdeas(false)}
                        className="text-sm text-indigo-400 hover:text-indigo-300"
                      >
                        Reset to Auto
                      </button>
                    )}
                  </div>
                </div>

                {/* Generate Button */}
                <div className="flex justify-center pt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary px-12 py-3 text-lg bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-lg hover:from-blue-600 hover:to-emerald-600 transition-all"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="loading-spinner mr-2"></div>
                        Generating...
                      </div>
                    ) : (
                      "Generate Ideas"
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : showImageGeneration ? (
            <div className="form-card animate-fade-in bg-gray-900/90 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">
                  Image Generation
                </h3>
                <div className="flex gap-4">
                  <button
                    onClick={handleBackToIdeas}
                    className="btn btn-secondary"
                  >
                    <ArrowLeft size={16} />
                    Back to Ideas
                  </button>
                  <PowerPointExport
                  ideas={acceptedIdeas}
                  generatedImages={generatedImages}
                  versionHistory={rawVersionHistory}
                />
                </div>
              </div>

              <div className="space-y-6">
                {acceptedIdeas.map((idea) => {
                  const ideaId = idea.idea_id.toString();
                  const isEditing = editingIdea === idea.idea_id;

                  return (
                    <div key={ideaId} className="idea-card idea-card-accepted">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        <div className="flex-1">
                          {isEditing ? (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Product Name
                                </label>
                                <input
                                  type="text"
                                  name="product_name"
                                  value={editForm.product_name}
                                  onChange={handleEditChange}
                                  className="input-field"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Description
                                </label>
                                <textarea
                                  name="description"
                                  value={editForm.description}
                                  onChange={handleEditChange}
                                  rows={3}
                                  className="input-field"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUpdateIdea(idea.idea_id)}
                                  className="btn btn-success"
                                >
                                  <Check size={16} /> Save
                                </button>
                                <button
                                  onClick={() => setEditingIdea(null)}
                                  className="btn btn-secondary"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <h4 className="text-xl font-semibold text-white mb-2">
                                {idea.product_name}
                              </h4>
                              <p className="text-gray-300 mb-4">
                                {idea.description}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {generatedImages[ideaId] && (
                                  <AdvancedRegenControls
                                    idea={idea}
                                    onRegenerate={handleRegenerateImage}
                                    isLoading={loadingStates[ideaId]}
                                  />
                                )}
                  
                                <button
                                  onClick={() => handleViewHistory(idea)}
                                  className="btn btn-secondary bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                                  title="Versions History"
                                >
                                  <Clock size={16} />
                                </button>
                                <button
                                  onClick={() => handleEdit(idea)}
                                  className="btn btn-warning"
                                  title="Edit ideas"
                                >
                                  <Edit2 size={16} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="w-full md:w-1/2 lg:w-1/3">
                          {generatedImages[ideaId] ? (
                            <div className="relative aspect-square rounded-lg overflow-hidden">
                              <img
                                src={generatedImages[ideaId]}
                                alt={idea.product_name}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              {loadingStates[ideaId] ? (
                                <div className="loading-spinner"></div>
                              ) : (
                                <span className="text-gray-400">
                                  Image pending generation
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="form-card animate-fade-in bg-gray-900/90 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">
                  Generated Ideas
                </h3>
                <div className="flex gap-4">
                  <button
                    onClick={handleBackToForm}
                    className="btn btn-secondary"
                  >
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Form
                  </button>
                  <button
                    onClick={handleProceedToImages}
                    className="bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-lg hover:from-blue-600 hover:to-emerald-600 transition-all btn btn-primary"
                    disabled={acceptedIdeas.length === 0}
                  >
                    <Image size={20} className="mr-2" />
                    Generate Images
                    <ArrowRight size={16} className="mr-2" />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {ideas.map((idea) => {
                  const ideaId = idea.idea_id.toString();
                  const isEditing = editingIdea === idea.idea_id;
                  const isAccepted = acceptedIdeas.some(
                    (accepted) => accepted.idea_id === idea.idea_id
                  );

                  return (
                    <div
                      key={ideaId}
                      className={`idea-card ${
                        isAccepted ? "idea-card-accepted" : "idea-card-pending"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        <div className="flex-1">
                          {isEditing ? (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Product Name
                                </label>
                                <input
                                  type="text"
                                  name="product_name"
                                  value={editForm.product_name}
                                  onChange={handleEditChange}
                                  className="input-field"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Description
                                </label>
                                <textarea
                                  name="description"
                                  value={editForm.description}
                                  onChange={handleEditChange}
                                  rows={3}
                                  className="input-field"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUpdateIdea(idea.idea_id)}
                                  className="btn btn-success"
                                >
                                  <Check size={16} /> Save
                                </button>
                                <button
                                  onClick={() => setEditingIdea(null)}
                                  className="btn btn-secondary"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <h4 className="text-xl font-semibold text-white mb-2">
                                {idea.product_name}
                              </h4>
                              <p className="text-gray-300 mb-4">
                                {idea.description}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleEdit(idea)}
                                    className="btn btn-warning"
                                    title="Edit idea"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                {isAccepted ? (
                                  <button
                                    onClick={() => handleUnaccept(idea.idea_id)}
                                    className=" min-w-[100px] bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                  >
                                    <Check size={16} /> Accepted
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAccept(idea.idea_id)}
                                    className=" min-w-[100px] bg-gray-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                  >
                                    Accept
                                  </button>
                                )}
                
                                <button
                                  onClick={() => handleReject(idea.idea_id)}
                                  className="btn btn-danger"
                                >
                                  <X size={16} /> Reject
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div
              className="bg-red-900 text-white px-4 py-3 rounded-lg"
              role="alert"
            >
              <p className="font-medium">{error}</p>
            </div>
          )}

          {showVersionHistory && selectedIdeaForHistory && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex">
                {/* Version History Panel */}
                <div className="flex-1 max-w-4xl">
                  {renderVersionHistoryModal()}
                </div>

                {/* Image Preview Panel */}
                {selectedImage && (
                  <div className="w-96 border-l border-gray-700 p-4 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-white">
                        Image Preview
                      </h3>
                      <button
                        onClick={() => setSelectedImage(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-900 mb-4">
                        <img
                          src={`data:image/png;base64,${selectedImage.image_url}`}
                          alt="Selected version"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {selectedImage.parameters && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-white">Parameters</h4>
                          <div className="text-sm text-gray-400">
                            {Object.entries(
                              JSON.parse(selectedImage.parameters)
                            ).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="capitalize">
                                  {key.replace("_", " ")}:
                                </span>
                                <span>{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 text-sm text-gray-400">
                        Created:{" "}
                        {format(new Date(selectedImage.created_at), "PPpp")}
                      </div>

                      <button
                        onClick={() => {
                          handleRegenerateImage({
                            idea_id: selectedIdeaForHistory.idea_id,
                            ...JSON.parse(selectedImage.parameters),
                          });
                          setShowVersionHistory(false);
                          setSelectedIdeaForHistory(null);
                          setSelectedImage(null);
                        }}
                        className="w-full mt-4 btn btn-primary"
                      >
                        <RotateCw size={16} />
                        Regenerate with these parameters
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
    </div>
  );
};

export default IdeaForm;

