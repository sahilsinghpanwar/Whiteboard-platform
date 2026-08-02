/**
 * Utility to rasterize SVG canvas or DOM element into a base64 PNG data URL for Gemini Vision processing.
 */
export async function captureCanvasAsBase64(svgElement) {
  if (!svgElement) return null;

  try {
    const clone = svgElement.cloneNode(true);
    // Remove UI selection handles & overlays before export
    const handles = clone.querySelectorAll(".selection-handle, .selection-border, .ui-overlay");
    handles.forEach((h) => h.remove());

    const svgString = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const rect = svgElement.getBoundingClientRect();
        canvas.width = rect.width || 800;
        canvas.height = rect.height || 600;

        const ctx = canvas.getContext("2d");
        // Fill white background for clear sketch visibility
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        URL.revokeObjectURL(blobURL);
        const dataUrl = canvas.toDataURL("image/png");
        resolve(dataUrl);
      };
      img.onerror = () => {
        URL.revokeObjectURL(blobURL);
        // Fallback placeholder data URL if SVG rasterization fails
        resolve(createFallbackSketchImage());
      };
      img.src = blobURL;
    });
  } catch (err) {
    console.error("Failed to capture SVG canvas as base64:", err);
    return createFallbackSketchImage();
  }
}

function createFallbackSketchImage() {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#F3F4F6";
  ctx.fillRect(0, 0, 400, 300);
  ctx.fillStyle = "#6B7280";
  ctx.font = "14px sans-serif";
  ctx.fillText("Whiteboard Sketch Screenshot", 100, 150);
  return canvas.toDataURL("image/png");
}
