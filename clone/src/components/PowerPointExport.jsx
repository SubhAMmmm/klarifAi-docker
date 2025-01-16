import React, { useState } from 'react';
import { Download } from 'lucide-react';
import pptxgen from 'pptxgenjs';
import { format } from 'date-fns';

const PowerPointExport = ({ ideas, generatedImages, versionHistory }) => {
  const [isExporting, setIsExporting] = useState(false);

  const createSlideWithContent = (pptx, styles, { title, subtitle, description, image, subtitleColor = 'CCCCCC' }) => {
    const slide = pptx.addSlide();
    Object.assign(slide, styles.slide);

    slide.addText(title, styles.title);
    slide.addText(subtitle, {
      ...styles.subtitle,
      color: subtitleColor
    });
    slide.addText(description, styles.description);

    if (image) {
      slide.addImage({
        data: image,
        ...styles.image
      });
    }

    return slide;
  };

  const generatePowerPoint = async () => {
    setIsExporting(true);
    console.log('Starting PowerPoint generation with:', {
      ideas,
      generatedImages,
      versionHistory
    });

    try {
      const pptx = new pptxgen();

      // Set presentation properties
      pptx.layout = 'LAYOUT_16x9';
      pptx.author = 'Product Idea Generator';
      pptx.subject = 'Product Ideas and Versions';

      // Define consistent styles
      const styles = {
        slide: {
          background: { color: '1a1a1a' }
        },
        title: {
          color: 'FFFFFF',
          bold: true,
          fontSize: 32,
          fontFace: 'Arial',
          align: 'left',
          x: '5%',
          y: '5%',
          w: '90%',
          h: '10%'
        },
        subtitle: {
          color: 'CCCCCC',
          fontSize: 18,
          fontFace: 'Arial',
          align: 'left',
          x: '5%',
          y: '15%',
          w: '90%',
          h: '5%'
        },
        description: {
          color: 'FFFFFF',
          fontSize: 16,
          fontFace: 'Arial',
          align: 'left',
          x: '5%',
          y: '25%',
          w: '45%',
          h: '70%',
          valign: 'top'
        },
        image: {
          x: '55%',
          y: '25%',
          w: '40%',
          h: '70%',
          sizing: { type: 'contain' }
        }
      };

      // Create title slide
      const titleSlide = pptx.addSlide();
      Object.assign(titleSlide, styles.slide);
      titleSlide.addText('Product Ideas and Versions', {
        ...styles.title,
        fontSize: 44,
        y: '40%',
        align: 'center'
      });
      titleSlide.addText(`Generated on ${format(new Date(), 'MMMM d, yyyy')}`, {
        ...styles.subtitle,
        y: '50%',
        align: 'center'
      });
      // Process each idea
      const processedVersions = new Set(); // Track processed versions to prevent duplicates

      for (const idea of ideas) {
        console.log('Processing idea:', idea.idea_id);

        // Only create current version slide if it hasn't been processed
        if (!processedVersions.has(idea.idea_id)) {
          processedVersions.add(idea.idea_id);

          // Current version slide
          createSlideWithContent(pptx, styles, {
            title: idea.product_name,
            subtitle: 'Current Version',
            description: idea.description,
            image: generatedImages[idea.idea_id],
            subtitleColor: '4CAF50'
          });
        }

        // Get version history data
        const historyData = versionHistory?.history;

        if (historyData?.idea_versions?.length > 0) {
          const imageVersions = historyData.image_versions || [];
          
          // Process each version
          for (const version of historyData.idea_versions) {
            // Skip if we've already processed this version
            if (processedVersions.has(version.id)) {
              console.log(`Skipping duplicate version: ${version.id}`);
              continue;
            }

            console.log('Processing version:', version.id);
            processedVersions.add(version.id);
            
            // Find all images associated with this version
            const versionImages = imageVersions.filter(img => img.idea_id === version.id);
            console.log(`Found ${versionImages.length} images for version ${version.id}`);

            if (versionImages.length > 0) {
              // Create slides for each image of this version
              versionImages.forEach((image, index) => {
                const imageCountText = versionImages.length > 1 
                  ? ` (Image ${index + 1}/${versionImages.length})` 
                  : '';

                createSlideWithContent(pptx, styles, {
                  title: version.product_name,
                  subtitle: `Previous Version${imageCountText} - ${format(new Date(version.created_at), 'MMM d, yyyy h:mm a')}`,
                  description: version.description,
                  image: `data:image/png;base64,${image.image_url}`,
                  subtitleColor: '2196F3'
                });
              });
            } else {
              // Create slide without images if none are found
              createSlideWithContent(pptx, styles, {
                title: version.product_name,
                subtitle: `Previous Version - ${format(new Date(version.created_at), 'MMM d, yyyy h:mm a')}`,
                description: version.description,
                subtitleColor: '2196F3'
              });
            }
          }
        }
      }

      // Generate file name with timestamp
      const fileName = `Product_Ideas_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pptx`;
      await pptx.writeFile({ fileName });
      console.log('PowerPoint generation completed successfully');
    } catch (error) {
      console.error('PowerPoint generation error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={generatePowerPoint}
      disabled={isExporting}
      title='Download'
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-md transition-colors"
    >
      <Download size={16} className={isExporting ? 'animate-bounce' : ''} />
      {isExporting ? 'Exporting...' : 'Export Ideas'}
    </button>
  );
};

export default PowerPointExport;
