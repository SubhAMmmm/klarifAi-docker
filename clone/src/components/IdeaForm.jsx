//4-1-25
/* eslint-disable no-unused-vars */
import React, { useState, useCallback, useEffect } from "react";
import { ideaService } from "../utils/axiosConfig";

import {
  PlusCircle,
  X,
  Check,
  Edit2,
  Image,
  RotateCw,
  ArrowLeft,
} from "lucide-react";

const IdeaForm = () => {
  const [formData, setFormData] = useState({
    product: "",
    brand: "",
    category: "",
    number_of_ideas: 1,
  });

  const [dynamicFields, setDynamicFields] = useState({
    "field-1": { type: "benefit", value: "" },
    "field-2": { type: "reason", value: "" },
  });

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
      const totalCombinations = fieldTypeCounts.length > 0 
        ? fieldTypeCounts.reduce((acc, count) => acc * count, 1)
        : 1;
  
      // Ensure at least 1 idea, cap at a reasonable maximum (e.g., 20)
      const suggestedNumber = Math.min(
        Math.max(1, totalCombinations),
        20  // Optional: Prevent exponential growth
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
    // We don't clear the form state here, preserving the user's input
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
      setAcceptedIdeas((prev) => [...prev, ideaToAccept]);
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
      const response = await ideaService.updateIdea({
        idea_id: ideaId,
        ...editForm,
      });
  
      if (response.data.success) {
        // Update ideas in both sections
        const updatedIdea = {
          ...ideas.find(idea => idea.idea_id === ideaId),
          ...editForm
        };
  
        setIdeas(
          ideas.map((idea) =>
            idea.idea_id === ideaId ? updatedIdea : idea
          )
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
        setError(response.data.error || "Failed to update idea");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to connect to the server");
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

  const handleRegenerateImage = useCallback(async (ideaId) => {
  if (loadingStates[ideaId]) return;

  setLoadingStates((prev) => ({ ...prev, [ideaId]: true }));
  setError(null);

  try {
    const idea = acceptedIdeas.find((i) => i.idea_id === ideaId);
    if (!idea) throw new Error("Idea not found");

    const response = await ideaService.regenerateProductImage({
      description: `${idea.product_name}: ${idea.description}`,
      idea_id: ideaId,
      size: 768,
      steps: 30,
      guidance_scale: 7.5
    });

    if (response.data.success) {
      setGeneratedImages((prev) => ({
        ...prev,
        [ideaId]: `data:image/png;base64,${response.data.image}`,
      }));
      
      // Optional: Add a toast or notification for successful regeneration
      // You can implement this with a toast library or custom notification
      console.log(`Image regenerated successfully for idea ${ideaId}`);
    } else {
      throw new Error(response.data.error || "Failed to regenerate image");
    }
  } catch (err) {
    console.error("Image regeneration error:", err);
    setError(err.response?.data?.error || err.message || "Failed to regenerate image");
    
    // Optional: Show a user-friendly error notification
    // You can implement this with a toast library or custom notification
  } finally {
    setLoadingStates((prev) => ({ ...prev, [ideaId]: false }));
  }
}, [acceptedIdeas, loadingStates]);

  const handleBaseFieldChange = (e) => {
    const { name, value } = e.target;
    if (name === "number_of_ideas") {
      setHasManuallySetIdeas(true);
      setFormData((prev) => ({
        ...prev,
        [name]: parseInt(value) || 1,
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
    const newFieldId = `field-${Object.keys(dynamicFields).length + 1}`;
    setDynamicFields((prev) => ({
      ...prev,
      [newFieldId]: { type, value: "" },
    }));
    // Reset manual override when adding new fields
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
    setError(null);

    const submissionData = {
      ...formData,
      dynamicFields,
    };

    try {
      const response = await ideaService.generateIdeas(submissionData);

      if (response.data.success) {
        setIdeas(response.data.ideas);
        setShowForm(false);
      } else {
        setError(response.data.error || "Failed to generate ideas");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to connect to the server");
    } finally {
      setIsLoading(false);
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
      "field-2": { type: "reason", value: "" },
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
          await handleRegenerateImage(idea.idea_id);
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
    imageGenerationInProgress
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

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-gray-900">
      <nav className="sticky top-0 z-50 bg-gray-900 bg-opacity-90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-white">Idea Generator</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {showForm ? (
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-white text-center">
                Generate Product Ideas
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Base Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {["product", "brand", "category"].map((field) => (
                    <div key={field}>
                      <label
                        htmlFor={field}
                        className="block text-sm font-medium text-gray-300 mb-2"
                      >
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </label>
                      <input
                        type="text"
                        id={field}
                        name={field}
                        value={formData[field]}
                        onChange={handleBaseFieldChange}
                        required
                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300"
                      />
                    </div>
                  ))}
                </div>

                {/* Dynamic Fields */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-white">
                      Dynamic Fields
                    </h3>
                  </div>

                  {/* Field Type Controls Group */}
                  <div className="space-y-4 bg-gray-700 p-4 rounded-lg">
                    {/* Custom Field Type Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCustomField}
                        onChange={(e) => setNewCustomField(e.target.value)}
                        placeholder="Add custom field type..."
                        className="flex-1 bg-gray-600 border border-gray-500 rounded-md py-2 px-3 text-white"
                      />
                      <button
                        type="button"
                        onClick={addCustomFieldType}
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                      >
                        Add Field Type
                      </button>
                    </div>

                    {/* All Field Type Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => addField("benefit")}
                        className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        <PlusCircle size={16} /> Benefit
                      </button>
                      <button
                        type="button"
                        onClick={() => addField("reason")}
                        className="flex items-center gap-1 text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        <PlusCircle size={16} /> Reason
                      </button>
                      {customFieldTypes.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => addField(type.toLowerCase())}
                          className="flex items-center gap-1 text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                        >
                          <PlusCircle size={16} /> {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Field Inputs */}
                  <div className="space-y-4">
                    {Object.entries(dynamicFields).map(([fieldId, field]) => (
                      <div key={fieldId} className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            {field.type.charAt(0).toUpperCase() +
                              field.type.slice(1)}
                          </label>
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) =>
                              handleDynamicFieldChange(fieldId, e.target.value)
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeField(fieldId)}
                          className="self-end bg-red-600 text-white p-2 rounded hover:bg-red-700"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Number of Ideas Input */}
                <div>
                  <label
                    htmlFor="number_of_ideas"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Number of Ideas{" "}
                    {!hasManuallySetIdeas && "(Auto-populated based on fields)"}
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      id="number_of_ideas"
                      name="number_of_ideas"
                      value={formData.number_of_ideas}
                      onChange={handleBaseFieldChange}
                      min="1"
                      required
                      className="w-full md:w-1/4 bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300"
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
                  <p className="mt-1 text-sm text-gray-400">
                    {hasManuallySetIdeas
                      ? "Manually set value"
                      : "Value updates automatically based on filled fields"}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Generating...
                    </div>
                  ) : (
                    "Generate Ideas"
                  )}
                </button>
              </form>
            </div>
          ) : showImageGeneration ? (
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 space-y-6 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">
                  Generate Images for Accepted Ideas
                </h3>
                <button
                  onClick={handleBackToIdeas}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Back to Ideas
                </button>
              </div>
              <div className="space-y-6">
                {acceptedIdeas.map((idea) => {
                  const ideaId = idea.idea_id.toString();
                  return (
                    <div
                      key={ideaId}
                      className="bg-gray-700 rounded-lg p-6 border border-indigo-500"
                    >
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        <div className="flex-1">
                          <h4 className="text-xl font-semibold text-white mb-2">
                            {idea.product_name}
                          </h4>
                          <p className="text-gray-300 mb-4">
                            {idea.description}
                          </p>
                          <div className="flex gap-2">
                            {generatedImages[ideaId] && (
                              <button
                                onClick={() => handleRegenerateImage(ideaId)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-300 flex items-center gap-2"
                                disabled={loadingStates[ideaId]}
                              >
                                <RotateCw size={16} />
                                Regenerate Image
                              </button>
                            )}
                          </div>
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
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
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
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white">
                  Generated Ideas
                </h3>
                <button
                  onClick={handleBackToForm}
                  className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors duration-300"
                >
                  <ArrowLeft size={16} />
                  Back to Form
                </button>
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
                      className={`bg-gray-700 rounded-lg p-6 border ${
                        isAccepted ? "border-green-500" : "border-indigo-500"
                      } transition-colors duration-300`}
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
                                  className="w-full bg-gray-600 border border-gray-500 rounded-md py-2 px-3 text-white"
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
                                  className="w-full bg-gray-600 border border-gray-500 rounded-md py-2 px-3 text-white"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUpdateIdea(idea.idea_id)}
                                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-300 flex items-center gap-2"
                                >
                                  <Check size={16} /> Save
                                </button>
                                <button
                                  onClick={() => setEditingIdea(null)}
                                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors duration-300"
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
                                {isAccepted ? (
                                  <button
                                    onClick={() => handleUnaccept(idea.idea_id)}
                                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-300 flex items-center gap-2"
                                  >
                                    <Check size={16} /> Accepted
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAccept(idea.idea_id)}
                                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors duration-300 flex items-center gap-2"
                                  >
                                    Accept
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEdit(idea)}
                                  className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors duration-300 flex items-center gap-2"
                                >
                                  <Edit2 size={16} /> Edit
                                </button>
                                <button
                                  onClick={() => handleReject(idea.idea_id)}
                                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors duration-300 flex items-center gap-2"
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

              <div className="flex justify-between items-center gap-4">
                <button
                  onClick={handleNewIdea}
                  className="flex-1 bg-transparent border border-indigo-500 text-white py-2 px-4 rounded-md font-medium hover:bg-indigo-500 transition-all duration-300"
                >
                  Generate New Ideas
                </button>
                <button
                  onClick={handleProceedToImages}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md font-medium hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center gap-2"
                  disabled={acceptedIdeas.length === 0}
                >
                  <Image size={20} />
                  Proceed to Image Generation
                </button>
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
        </div>
      </main>
    </div>
  );
};

export default IdeaForm;
