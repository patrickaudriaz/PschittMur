/**
 * Utility functions to help generate hold positions from an image
 * This can be used to create JSON files for different spray walls
 */

/**
 * Generate a JSON string of hold positions based on image dimensions
 * @param {number} imgWidth - Width of the spray wall image (used for calculation only)
 * @param {number} imgHeight - Height of the spray wall image (used for calculation only)
 * @param {number} rows - Number of rows of holds
 * @param {number} cols - Number of columns of holds
 * @param {number} holdSizePercent - Size of holds as percentage of image size (used for calculation only)
 * @param {number} marginPercent - Margin from edges as percentage (default: 10%)
 * @param {number} randomnessPercent - Randomness factor for hold positions (default: 30%)
 * @returns {string} JSON string of hold positions with relative coordinates (0-1)
 */
export function generateHoldPositionsJSON(
  imgWidth, 
  imgHeight, 
  rows = 10, 
  cols = 15, 
  holdSizePercent = 5, 
  marginPercent = 10,
  randomnessPercent = 30
) {
  const holdSize = Math.min(imgWidth, imgHeight) * (holdSizePercent / 100);
  const marginX = marginPercent / 100;
  const marginY = marginPercent / 100;
  const stepX = (1 - 2 * marginX) / (cols - 1);
  const stepY = (1 - 2 * marginY) / (rows - 1);
  
  const generatedHolds = [];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Add some randomness to make it look more natural
      const randomOffsetX = (Math.random() - 0.5) * stepX * (randomnessPercent / 100);
      const randomOffsetY = (Math.random() - 0.5) * stepY * (randomnessPercent / 100);
      
      // Calculate position as relative coordinates (0-1)
      const x = marginX + col * stepX + randomOffsetX;
      const y = marginY + row * stepY + randomOffsetY;
      
      generatedHolds.push({
        x: Math.max(0, Math.min(1, x)), // Ensure x is between 0 and 1
        y: Math.max(0, Math.min(1, y))  // Ensure y is between 0 and 1
      });
    }
  }
  
  return JSON.stringify(generatedHolds, null, 2);
}

/**
 * Export hold positions to a downloadable JSON file
 * @param {Array} holdPositions - Array of hold position objects with relative coordinates
 * @param {string} filename - Name of the file to download (default: 'holdPositions.json')
 */
export function exportHoldPositionsToFile(holdPositions, filename = 'holdPositions.json') {
  const jsonStr = JSON.stringify(holdPositions, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

/**
 * Import hold positions from a JSON file
 * @param {File} file - JSON file to import
 * @returns {Promise<Array>} Promise resolving to array of hold positions with relative coordinates
 */
export function importHoldPositionsFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const holdPositions = JSON.parse(event.target.result);
        
        // Validate that the imported positions use relative coordinates
        const isValid = holdPositions.every(hold => 
          typeof hold.x === 'number' && 
          typeof hold.y === 'number' && 
          hold.x >= 0 && hold.x <= 1 && 
          hold.y >= 0 && hold.y <= 1
        );
        
        if (!isValid) {
          // Convert absolute coordinates to relative if needed
          // This is for backward compatibility with older JSON files
          const maxX = Math.max(...holdPositions.map(h => h.x));
          const maxY = Math.max(...holdPositions.map(h => h.y));
          
          if (maxX > 1 || maxY > 1) {
            console.warn('Converting absolute coordinates to relative coordinates');
            const convertedPositions = holdPositions.map(hold => ({
              x: hold.x / maxX,
              y: hold.y / maxY
            }));
            resolve(convertedPositions);
          } else {
            resolve(holdPositions);
          }
        } else {
          resolve(holdPositions);
        }
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
} 