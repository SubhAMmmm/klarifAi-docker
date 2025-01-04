// /* eslint-disable no-unused-vars */
// import React, { useState } from "react";
// import { PlusCircle, X, Check, Edit2 } from "lucide-react";

// const IdeaForm = () => {
//     const [formData, setFormData] = useState({
//         product: "",
//         brand: "",
//         category: "",
//         number_of_ideas: 1,
//     });

//     const [dynamicFields, setDynamicFields] = useState({
//         "field-1": { type: "benefit", value: "" },
//         "field-2": { type: "reason", value: "" },
//     });

//     const [customFieldTypes, setCustomFieldTypes] = useState([]);
//     const [newCustomField, setNewCustomField] = useState("");
//     const [ideas, setIdeas] = useState([]);
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState(null);
//     const [showForm, setShowForm] = useState(true);
//     const [selectedImage, setSelectedImage] = useState(null);
//     const [isGeneratingImage, setIsGeneratingImage] = useState(false);
//     const [generatedImages, setGeneratedImages] = useState({});
//     const [loadingStates, setLoadingStates] = useState({});
//     const [editingIdea, setEditingIdea] = useState(null);
//     const [editForm, setEditForm] = useState({
//         product_name: "",
//         description: "",
//     });

//     const handleEdit = (idea) => {
//         setEditingIdea(idea.idea_id);
//         setEditForm({
//             product_name: idea.product_name,
//             description: idea.description,
//         });
//     };

//     const handleEditChange = (e) => {
//         const { name, value } = e.target;
//         setEditForm(prev => ({
//             ...prev,
//             [name]: value
//         }));
//     };

//     const handleSaveEdit = async (ideaId) => {
//         try {
//             const response = await fetch(`http://localhost:8000/update_idea/`, {
//                 method: "PUT",
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//                 credentials: "include",
//                 body: JSON.stringify({
//                     idea_id: ideaId,
//                     ...editForm
//                 }),
//             });

//             const data = await response.json();
//             if (response.ok && data.success) {
//                 setIdeas(ideas.map(idea =>
//                     idea.idea_id === ideaId
//                         ? { ...idea, ...editForm }
//                         : idea
//                 ));
//                 setEditingIdea(null);
//             } else {
//                 setError(data.error || "Failed to update idea");
//             }
//         } catch (err) {
//             setError("Failed to connect to the server");
//         }
//     };

//     const handleReject = async (ideaId) => {
//         try {
//             const response = await fetch(`http://localhost:8000/delete_idea/`, {
//                 method: "DELETE",
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//                 credentials: "include",
//                 body: JSON.stringify({ idea_id: ideaId }),
//             });

//             const data = await response.json();
//             if (response.ok && data.success) {
//                 setIdeas(ideas.filter(idea => idea.idea_id !== ideaId));
//                 // Clear the generated image for this idea if it exists
//                 if (generatedImages[ideaId]) {
//                     setGeneratedImages(prev => {
//                         const newImages = { ...prev };
//                         delete newImages[ideaId];
//                         return newImages;
//                     });
//                 }
//             } else {
//                 setError(data.error || "Failed to delete idea");
//             }
//         } catch (err) {
//             setError("Failed to connect to the server");
//         }
//     };

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setFormData((prev) => ({
//             ...prev,
//             [name]: name === "number_of_ideas" ? parseInt(value) || 1 : value,
//         }));
//     };

//     const handleBaseFieldChange = (e) => {
//         const { name, value } = e.target;
//         setFormData((prev) => ({
//             ...prev,
//             [name]: name === "number_of_ideas" ? parseInt(value) || 1 : value,
//         }));
//     };

//     const handleDynamicFieldChange = (fieldId, value) => {
//         setDynamicFields((prev) => ({
//             ...prev,
//             [fieldId]: { ...prev[fieldId], value },
//         }));
//     };

//     const addField = (type) => {
//         const newFieldId = `field-${Object.keys(dynamicFields).length + 1}`;
//         setDynamicFields((prev) => ({
//             ...prev,
//             [newFieldId]: { type, value: "" },
//         }));
//     };

//     const removeField = (fieldId) => {
//         setDynamicFields((prev) => {
//             const newFields = { ...prev };
//             delete newFields[fieldId];
//             return newFields;
//         });
//     };

//     const addCustomFieldType = (e) => {
//         e.preventDefault();
//         if (newCustomField && !customFieldTypes.includes(newCustomField)) {
//             setCustomFieldTypes([...customFieldTypes, newCustomField]);
//             setNewCustomField("");
//         }
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setIsLoading(true);
//         setError(null);

//         const submissionData = {
//             ...formData,
//             dynamicFields,
//         };

//         try {
//             const response = await fetch("http://localhost:8000/generate_ideas/", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//                 credentials: "include",
//                 body: JSON.stringify(submissionData),
//             });

//             const data = await response.json();
//             if (response.ok && data.success) {
//                 setIdeas(data.ideas);
//                 setShowForm(false);
//             } else {
//                 setError(data.error || "Failed to generate ideas");
//             }
//         } catch (err) {
//             setError("Failed to connect to the server");
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleNewIdea = () => {
//         setShowForm(true);
//         setIdeas([]);
//         setGeneratedImages({}); // Clear generated images
//         setLoadingStates({}); // Clear loading states
//         setFormData({
//             product: "",
//             brand: "",
//             category: "",
//             number_of_ideas: 1,
//         });
//         setDynamicFields({
//             "field-1": { type: "benefit", value: "" },
//             "field-2": { type: "reason", value: "" },
//         });
//         setCustomFieldTypes([]);
//     };

//     const handleGenerateImage = async (idea) => {
//         const ideaId = idea.idea_id.toString(); // Convert to string to ensure consistent type
//         setLoadingStates(prev => ({
//             ...prev,
//             [ideaId]: true
//         }));
//         setError(null);

//         try {
//             const response = await fetch("http://localhost:8000/generate_product_image/", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify({
//                     description: `${idea.product_name}: ${idea.description}`,
//                     idea_id: ideaId
//                 }),
//             });

//             const data = await response.json();
//             if (response.ok && data.success) {
//                 setGeneratedImages(prev => ({
//                     ...prev,
//                     [ideaId]: `data:image/png;base64,${data.image}`
//                 }));
//             } else {
//                 setError(data.error || "Failed to generate image");
//             }
//         } catch (err) {
//             setError("Failed to connect to the server");
//         } finally {
//             setLoadingStates(prev => ({
//                 ...prev,
//                 [ideaId]: false
//             }));
//         }
//     };

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-gray-900">
//             <nav className="sticky top-0 z-50 bg-gray-900 bg-opacity-90 backdrop-blur-sm">
//                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//                     <div className="flex items-center justify-center h-16">
//                         <div className="flex-shrink-0">
//                             <h1 className="text-xl font-bold text-white">Idea Generator</h1>
//                         </div>
//                     </div>
//                 </div>
//             </nav>

//             <main className="container mx-auto px-4 py-8">
//                 <div className="max-w-4xl mx-auto space-y-8">
//                     {showForm ? (
//                         <div className="bg-gray-800 rounded-lg shadow-xl p-6 space-y-6 animate-fade-in">
//                             <h2 className="text-2xl font-bold text-white text-center">
//                                 Generate Product Ideas
//                             </h2>
//                             <form onSubmit={handleSubmit} className="space-y-6">
//                                 {/* Base Fields */}
//                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                                     {["product", "brand", "category"].map((field) => (
//                                         <div key={field}>
//                                             <label
//                                                 htmlFor={field}
//                                                 className="block text-sm font-medium text-gray-300 mb-2"
//                                             >
//                                                 {field.charAt(0).toUpperCase() + field.slice(1)}
//                                             </label>
//                                             <input
//                                                 type="text"
//                                                 id={field}
//                                                 name={field}
//                                                 value={formData[field]}
//                                                 onChange={handleBaseFieldChange}
//                                                 required
//                                                 className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300"
//                                             />
//                                         </div>
//                                     ))}
//                                 </div>

//                                 {/* Dynamic Fields */}
//                                 <div className="space-y-4">
//                                     <div className="flex justify-between items-center">
//                                         <h3 className="text-lg font-medium text-white">Dynamic Fields</h3>
//                                         <div className="flex gap-2">
//                                             <button
//                                                 type="button"
//                                                 onClick={() => addField("benefit")}
//                                                 className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
//                                             >
//                                                 <PlusCircle size={16} /> Benefit
//                                             </button>
//                                             <button
//                                                 type="button"
//                                                 onClick={() => addField("reason")}
//                                                 className="flex items-center gap-1 text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
//                                             >
//                                                 <PlusCircle size={16} /> Reason
//                                             </button>
//                                         </div>
//                                     </div>

//                                     {/* Custom Field Type Input */}
//                                     <div className="flex gap-2">
//                                         <input
//                                             type="text"
//                                             value={newCustomField}
//                                             onChange={(e) => setNewCustomField(e.target.value)}
//                                             placeholder="Add custom field type..."
//                                             className="flex-1 bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
//                                         />
//                                         <button
//                                             type="button"
//                                             onClick={addCustomFieldType}
//                                             className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
//                                         >
//                                             Add Field Type
//                                         </button>
//                                     </div>

//                                     {/* Custom Field Type Buttons */}
//                                     {customFieldTypes.length > 0 && (
//                                         <div className="flex gap-2 flex-wrap">
//                                             {customFieldTypes.map((type) => (
//                                                 <button
//                                                     key={type}
//                                                     type="button"
//                                                     onClick={() => addField(type.toLowerCase())}
//                                                     className="flex items-center gap-1 text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
//                                                 >
//                                                     <PlusCircle size={16} /> {type}
//                                                 </button>
//                                             ))}
//                                         </div>
//                                     )}

//                                     {/* Dynamic Field Inputs */}
//                                     <div className="space-y-4">
//                                         {Object.entries(dynamicFields).map(([fieldId, field]) => (
//                                             <div key={fieldId} className="flex gap-2">
//                                                 <div className="flex-1">
//                                                     <label className="block text-sm font-medium text-gray-300 mb-2">
//                                                         {field.type.charAt(0).toUpperCase() + field.type.slice(1)}
//                                                     </label>
//                                                     <input
//                                                         type="text"
//                                                         value={field.value}
//                                                         onChange={(e) => handleDynamicFieldChange(fieldId, e.target.value)}
//                                                         className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
//                                                     />
//                                                 </div>
//                                                 <button
//                                                     type="button"
//                                                     onClick={() => removeField(fieldId)}
//                                                     className="self-end bg-red-600 text-white p-2 rounded hover:bg-red-700"
//                                                 >
//                                                     <X size={20} />
//                                                 </button>
//                                             </div>
//                                         ))}
//                                     </div>
//                                 </div>

//                                 {/* Number of Ideas Input */}
//                                 <div>
//                                     <label
//                                         htmlFor="number_of_ideas"
//                                         className="block text-sm font-medium text-gray-300 mb-2"
//                                     >
//                                         Number of Ideas
//                                     </label>
//                                     <input
//                                         type="number"
//                                         id="number_of_ideas"
//                                         name="number_of_ideas"
//                                         value={formData.number_of_ideas}
//                                         onChange={handleBaseFieldChange}
//                                         min="1"
//                                         required
//                                         className="w-full md:w-1/4 bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-300"
//                                     />
//                                 </div>

//                                 <button
//                                     type="submit"
//                                     disabled={isLoading}
//                                     className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
//                                 >
//                                     {isLoading ? (
//                                         <div className="flex items-center justify-center">
//                                             <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
//                                             Generating...
//                                         </div>
//                                     ) : (
//                                         "Generate Ideas"
//                                     )}
//                                 </button>
//                             </form>
//                         </div>
//                     ) : (
//                         <div className="bg-gray-800 rounded-lg shadow-xl p-6 space-y-6 animate-fade-in">
//                         <h3 className="text-2xl font-bold text-white">Generated Ideas</h3>
//                         <div className="space-y-6">
//                         {ideas.map((idea) => {
//                             const ideaId = idea.idea_id.toString();
//                             const isEditing = editingIdea === idea.idea_id;

//                             return (
//                                 <div
//                                     key={ideaId}
//                                     className="bg-gray-700 rounded-lg p-6 border border-indigo-500 hover:border-indigo-400 transition-colors duration-300"
//                                 >
//                                     <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
//                                         <div className="flex-1">
//                                             {isEditing ? (
//                                                 <div className="space-y-4">
//                                                     <div>
//                                                         <label className="block text-sm font-medium text-gray-300 mb-2">
//                                                             Product Name
//                                                         </label>
//                                                         <input
//                                                             type="text"
//                                                             name="product_name"
//                                                             value={editForm.product_name}
//                                                             onChange={handleEditChange}
//                                                             className="w-full bg-gray-600 border border-gray-500 rounded-md py-2 px-3 text-white"
//                                                         />
//                                                     </div>
//                                                     <div>
//                                                         <label className="block text-sm font-medium text-gray-300 mb-2">
//                                                             Description
//                                                         </label>
//                                                         <textarea
//                                                             name="description"
//                                                             value={editForm.description}
//                                                             onChange={handleEditChange}
//                                                             rows={3}
//                                                             className="w-full bg-gray-600 border border-gray-500 rounded-md py-2 px-3 text-white"
//                                                         />
//                                                     </div>
//                                                     <div className="flex gap-2">
//                                                         <button
//                                                             onClick={() => handleSaveEdit(idea.idea_id)}
//                                                             className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-300 flex items-center gap-2"
//                                                         >
//                                                             <Check size={16} /> Save
//                                                         </button>
//                                                         <button
//                                                             onClick={() => setEditingIdea(null)}
//                                                             className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors duration-300"
//                                                         >
//                                                             Cancel
//                                                         </button>
//                                                     </div>
//                                                 </div>
//                                             ) : (
//                                                 <>
//                                                     <h4 className="text-xl font-semibold text-white mb-2">
//                                                         {idea.product_name}
//                                                     </h4>
//                                                     <p className="text-gray-300 mb-4">{idea.description}</p>
//                                                     <div className="flex flex-wrap gap-2">
//                                                         <button
//                                                             onClick={() => handleGenerateImage(idea)}
//                                                             disabled={loadingStates[ideaId]}
//                                                             className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//                                                         >
//                                                             {loadingStates[ideaId] ? (
//                                                                 <>
//                                                                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//                                                                     Generating...
//                                                                 </>
//                                                             ) : (
//                                                                 "Accept & Generate Image"
//                                                             )}
//                                                         </button>
//                                                         <button
//                                                             onClick={() => handleEdit(idea)}
//                                                             className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors duration-300 flex items-center gap-2"
//                                                         >
//                                                             <Edit2 size={16} /> Edit
//                                                         </button>
//                                                         <button
//                                                             onClick={() => handleReject(idea.idea_id)}
//                                                             className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors duration-300 flex items-center gap-2"
//                                                         >
//                                                             <X size={16} /> Reject
//                                                         </button>
//                                                     </div>
//                                                 </>
//                                             )}
//                                         </div>
//                                         {generatedImages[ideaId] && (
//                                             <div className="w-full md:w-1/2 lg:w-1/3">
//                                                 <div className="relative aspect-square rounded-lg overflow-hidden">
//                                                     <img
//                                                         src={generatedImages[ideaId]}
//                                                         alt={idea.product_name}
//                                                         className="object-cover w-full h-full"
//                                                     />
//                                                 </div>
//                                             </div>
//                                         )}
//                                     </div>
//                                 </div>
//                             );
//                         })}
//                         </div>

//                         <div className="flex justify-between items-center">
//                           <button
//                             onClick={handleNewIdea}
//                             className="w-full bg-transparent border border-indigo-500 text-white py-2 px-4 rounded-md font-medium hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300"
//                           >
//                             Generate New Ideas
//                           </button>
//                         </div>
//                       </div>
//                     )}

//                     {error && (
//                       <div className="bg-red-900 text-white px-4 py-3 rounded-lg" role="alert">
//                         <p className="font-medium">{error}</p>
//                       </div>
//                     )}
//                     {isGeneratingImage && (
//                         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
//                             <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center">
//                                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
//                                 <p className="text-white mt-4">Generating Product Image...</p>
//                             </div>
//                         </div>
//                     )}
//                 </div>
//             </main>
//         </div>
//     );
// };

// export default IdeaForm;

// Separated Workflows

// IdeaForm.jsx
/* eslint-disable no-unused-vars */

import React, { useState } from "react";
import { PlusCircle, X, Check, Edit2, Image, RotateCw, ArrowLeft } from "lucide-react";
import { ideaService } from "../utils/axiosConfig";
import Header from "./dashboard/Header";
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
  const [editForm, setEditForm] = useState({
    product_name: "",
    description: "",
  });
  const [showImageGeneration, setShowImageGeneration] = useState(false);
  const [lastSection, setLastSection] = useState(null);


  const handleAccept = (ideaId) => {
    const ideaToAccept = ideas.find((idea) => idea.idea_id === ideaId);
    if (ideaToAccept) {
      setAcceptedIdeas((prev) => [...prev, ideaToAccept]);
    }
  };

  const handleUnaccept = (ideaId) => {
    setAcceptedIdeas((prev) => prev.filter((idea) => idea.idea_id !== ideaId));
    // Remove the generated image as well
    setGeneratedImages((prev) => {
      const newImages = { ...prev };
      delete newImages[ideaId];
      return newImages;
    });
    
    // If there are no more accepted ideas, go back to ideas view
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
    // Store current section before editing
    setLastSection(showImageGeneration ? 'image' : 'idea');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveEdit = async (ideaId) => {
    try {
      const response = await ideaService.updateIdea({
        idea_id: ideaId,
        ...editForm,
      });

      if (response.data.success) {
        // Update ideas in both sections
        setIdeas(ideas.map((idea) =>
          idea.idea_id === ideaId ? { ...idea, ...editForm } : idea
        ));
        setAcceptedIdeas(acceptedIdeas.map((idea) =>
          idea.idea_id === ideaId ? { ...idea, ...editForm } : idea
        ));
        setEditingIdea(null);
        
        // Return to previous section
        if (lastSection === 'image') {
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
        setAcceptedIdeas(acceptedIdeas.filter((idea) => idea.idea_id !== ideaId));
        
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

  const handleRegenerateImage = async (ideaId) => {
    setLoadingStates((prev) => ({ ...prev, [ideaId]: true }));
    setError(null);
    
    try {
      const idea = acceptedIdeas.find((i) => i.idea_id === ideaId);
      if (!idea) {
        throw new Error("Idea not found");
      }

      const response = await ideaService.generateProductImage({
        description: `${idea.product_name}: ${idea.description}`,
        idea_id: ideaId,
      });

      if (response.data.success && response.data.image) {
        setGeneratedImages((prev) => ({
          ...prev,
          [ideaId]: `data:image/png;base64,${response.data.image}`,
        }));
      } else {
        throw new Error("Invalid image data received");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to regenerate image");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [ideaId]: false }));
    }
  };

  const handleBaseFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "number_of_ideas" ? parseInt(value) || 1 : value,
    }));
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
  };

  const removeField = (fieldId) => {
    setDynamicFields((prev) => {
      const newFields = { ...prev };
      delete newFields[fieldId];
      return newFields;
    });
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

    try {
      const response = await ideaService.generateIdeas({
        ...formData,
        dynamicFields,
      });

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
    setGeneratedImages({}); // Clear generated images
    setLoadingStates({}); // Clear loading states
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

  const handleGenerateImages = async () => {
    setError(null);

    for (const idea of acceptedIdeas) {
      const ideaId = idea.idea_id.toString();
      if (!generatedImages[ideaId]) {
        setLoadingStates((prev) => ({
          ...prev,
          [ideaId]: true,
        }));

        try {
          const response = await ideaService.generateProductImage({
            description: `${idea.product_name}: ${idea.description}`,
            idea_id: ideaId,
          });

          if (response.data.success) {
            setGeneratedImages((prev) => ({
              ...prev,
              [ideaId]: `data:image/png;base64,${response.data.image}`,
            }));
          } else {
            setError(
              `Failed to generate image for ${idea.product_name}: ${response.data.error}`
            );
          }
        } catch (err) {
          setError(`Failed to generate image for ${idea.product_name}`);
        } finally {
          setLoadingStates((prev) => ({
            ...prev,
            [ideaId]: false,
          }));
        }
      }
    }
  };

  const handleProceedToImages = () => {
    if (acceptedIdeas.length > 0) {
      setShowImageGeneration(true);
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
          <div className="flex items-center justify-between h-16">
            {/* <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-white">Idea Generator</h1>
            </div>
             */}
             <Header/>
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
                    <div className="flex gap-2">
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
                    </div>
                  </div>

                  {/* Custom Field Type Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCustomField}
                      onChange={(e) => setNewCustomField(e.target.value)}
                      placeholder="Add custom field type..."
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
                    />
                    <button
                      type="button"
                      onClick={addCustomFieldType}
                      className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                    >
                      Add Field Type
                    </button>
                  </div>

                  {/* Custom Field Type Buttons */}
                  {customFieldTypes.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
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
                  )}

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
                    Number of Ideas
                  </label>
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
                <button
                  onClick={handleGenerateImages}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md font-medium hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Image size={20} />
                  Generate Images for All
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 space-y-6 animate-fade-in">
              <h3 className="text-2xl font-bold text-white">Generated Ideas</h3>
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
                                  onClick={() => handleSaveEdit(idea.idea_id)}
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
