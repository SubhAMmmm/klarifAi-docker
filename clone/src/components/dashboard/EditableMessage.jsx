// /* eslint-disable no-unused-vars */
// import React, { useState } from 'react';
// import { Pencil, Check, X } from 'lucide-react';
// import PropTypes from 'prop-types';

// const EditableMessage = ({ content, isEditing, setIsEditing, onSave, disabled }) => {
//   const [editedContent, setEditedContent] = useState(content);

//   const handleSave = () => {
//     onSave(editedContent);
//     setIsEditing(false);
//   };

//   const handleCancel = () => {
//     setEditedContent(content);
//     setIsEditing(false);
//   };

//   if (isEditing) {
//     return (
//       <div className="flex flex-col space-y-2 min-w-[300px]">
//         <textarea
//           value={editedContent}
//           onChange={(e) => setEditedContent(e.target.value)}
//           className="w-full bg-gray-900/50 text-white rounded-lg p-2 min-h-[100px] 
//             border border-blue-500/30 focus:border-blue-500/50 
//             focus:ring-1 focus:ring-blue-500/30 
//             focus:outline-none resize-none"
//           placeholder="Edit your message..."
//         />
//         <div className="flex justify-end space-x-2">
//           <button
//             onClick={handleCancel}
//             className="flex items-center px-3 py-1.5 text-sm 
//               bg-gray-800/50 hover:bg-gray-700/50 
//               text-gray-300 hover:text-white
//               rounded-lg transition-colors border border-gray-700/50"
//           >
//             <X className="w-4 h-4 mr-1" />
//             Cancel
//           </button>
//           <button
//             onClick={handleSave}
//             className="flex items-center px-3 py-1.5 text-sm
//               bg-blue-600/50 hover:bg-blue-500/50
//               text-white rounded-lg transition-colors"
//           >
//             <Check className="w-4 h-4 mr-1" />
//             Save
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="group relative">
//       <div className="flex justify-between items-start">
//         <p className="text-sm pr-8">{content}</p>
//         {!disabled && (
//           <button
//             onClick={() => setIsEditing(true)}
//             className="absolute top-0 right-0
//               flex items-center justify-center
//               w-6 h-6 rounded
//               text-gray-400 hover:text-white
//               bg-gray-800/50 hover:bg-gray-700/50
//               transition-all duration-200
//               opacity-0 group-hover:opacity-100
//               border border-gray-700/50"
//           >
//             <Pencil className="w-3 h-3" />
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// // Add PropTypes
// EditableMessage.propTypes = {
//   content: PropTypes.string.isRequired,
//   isEditing: PropTypes.bool.isRequired,
//   setIsEditing: PropTypes.func.isRequired,
//   onSave: PropTypes.func.isRequired,
//   disabled: PropTypes.bool
// };

// // Add default props
// EditableMessage.defaultProps = {
//   disabled: false
// };

// export default EditableMessage;

/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Pencil, Check, X, RotateCcw} from 'lucide-react';
import PropTypes from 'prop-types';

const EditableMessage = ({ content, isEditing, setIsEditing, onSave, disabled }) => {
    const [editedContent, setEditedContent] = useState(content);
    const [originalContent] = useState(content);  // Store original content
  
    const handleRevert = () => {
        setEditedContent(originalContent);
        setIsEditing(false);
      };
    const handleSave = () => {
        onSave(editedContent);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedContent(content);
        setIsEditing(false);
    };

  if (isEditing) {
    return (
      <div className="flex flex-col space-y-2 min-w-[300px]">
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full bg-gray-900/50 text-white rounded-lg p-2 min-h-[100px] 
            border border-blue-500/30 focus:border-blue-500/50 
            focus:ring-1 focus:ring-blue-500/30 
            focus:outline-none resize-none"
          placeholder="Edit your message..."
        />
        <div className="flex justify-end space-x-2">
            <button
                onClick={handleRevert}  // Add revert functionality
                className="flex items-center px-3 py-1.5 text-sm 
                bg-gray-800/50 hover:bg-gray-700/50 
                text-gray-300 hover:text-white
                rounded-lg transition-colors border border-gray-700/50"
            >
                <RotateCcw className="w-4 h-4 mr-1" />
                Revert
            </button>
          <button
            onClick={handleCancel}
            className="flex items-center px-3 py-1.5 text-sm 
              bg-gray-800/50 hover:bg-gray-700/50 
              text-gray-300 hover:text-white
              rounded-lg transition-colors border border-gray-700/50"
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center px-3 py-1.5 text-sm
              bg-blue-600/50 hover:bg-blue-500/50
              text-white rounded-lg transition-colors"
          >
            <Check className="w-4 h-4 mr-1" />
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <div className="flex justify-between items-start">
        <p className="text-sm pr-8">{content}</p>
        {!disabled && (
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-0 right-0
              flex items-center justify-center
              w-6 h-6 rounded
              text-gray-400 hover:text-white
              bg-gray-800/50 hover:bg-gray-700/50
              transition-all duration-200
              opacity-0 group-hover:opacity-100
              border border-gray-700/50"
          >
            <Pencil className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

// Add PropTypes
EditableMessage.propTypes = {
  content: PropTypes.string.isRequired,
  isEditing: PropTypes.bool.isRequired,
  setIsEditing: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

// Add default props
EditableMessage.defaultProps = {
  disabled: false
};

export default EditableMessage;