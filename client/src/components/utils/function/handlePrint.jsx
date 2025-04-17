import jsPDF from "jspdf";
import domtoimage from "dom-to-image";

export const handlePrint = async () => {
  try {
    const containerSelector = ".question-page";
    const container = document.querySelector(containerSelector);
    const SCALE_FACTOR = 5;
    const PX_TO_PT = 0.75;
    const PAGE_WIDTH_PX = 800;
    const PAGE_HEIGHT_PX = 565.5;

    if (!container) {
      throw new Error(`Element ${containerSelector} not found`);
    }

    // Store original styles for cleanup
    const originalStyles = {
      width: container.style.width,
      height: container.style.height,
      position: container.style.position,
      overflow: container.style.overflow,
    };

    // Set temporary capture styles
    Object.assign(container.style, {
      width: `${PAGE_WIDTH_PX * 2}px`,
      height: `${PAGE_HEIGHT_PX}px`,
      position: "relative",
      overflow: "hidden",
    });

    // Wait for stabilization
    await new Promise(requestAnimationFrame);
    await Promise.all(
      Array.from(container.querySelectorAll("img")).map((img) =>
        img.decode().catch(() => {})
      )
    );

    // Initialize PDF
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: [PAGE_WIDTH_PX * PX_TO_PT, PAGE_HEIGHT_PX * PX_TO_PT],
    });

    // Capture and add pages
    for (let pageIndex = 0; pageIndex < 2; pageIndex++) {
      const imgData = await domtoimage.toPng(container, {
        width: PAGE_WIDTH_PX * SCALE_FACTOR,
        height: PAGE_HEIGHT_PX * SCALE_FACTOR,
        quality: 1,
        bgcolor: "#FFFFFF",
        style: {
          transform: `
              scale(${SCALE_FACTOR})
              translateX(-${pageIndex * PAGE_WIDTH_PX}px)
            `,
          transformOrigin: "top left",
          width: `${PAGE_WIDTH_PX * 2}px`,
          height: `${PAGE_HEIGHT_PX}px`,
        },
      });

      if (pageIndex > 0) pdf.addPage();

      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        PAGE_WIDTH_PX * PX_TO_PT,
        PAGE_HEIGHT_PX * PX_TO_PT,
        undefined,
        "FAST",
        0,
        false,
        {
          width: PAGE_WIDTH_PX * SCALE_FACTOR,
          height: PAGE_HEIGHT_PX * SCALE_FACTOR,
        }
      );
    }

    // Restore original styles
    Object.assign(container.style, originalStyles);

    pdf.save("document.pdf");
  } catch (error) {
    console.error("PDF generation failed:", error);
    alert("Failed to generate PDF. Please check the console for details.");
  }
};
