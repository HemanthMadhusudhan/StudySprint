// Function to read file as text
export const readFileAsText = async (file: File, onProgress?: (percent: number) => void): Promise<string> => {
  if (file.type === 'application/pdf') {
    return extractTextFromPDF(file, onProgress);
  } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
     onProgress?.(50);
     const text = await extractTextFromDocx(file);
     onProgress?.(100);
     return text;
  } else if (file.type === 'text/plain' || file.type === 'application/json' || file.name.endsWith('.md')) {
    return new Promise((resolve, reject) => {
      onProgress?.(10);
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress?.((event.loaded / event.total) * 100);
        }
      };
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  } else {
    throw new Error("Unsupported file type. Please upload PDF, DOCX, or Text files.");
  }
};

const extractTextFromPDF = async (file: File, onProgress?: (percent: number) => void): Promise<string> => {
  // Access global pdfjsLib loaded via CDN
  const pdfjsLib = (window as any).pdfjsLib;
  if (!pdfjsLib) throw new Error("PDF.js library not loaded");

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = "";
  const totalPages = pdf.numPages;
  // Limit to first 30 pages for performance/demo
  const maxPages = Math.min(totalPages, 30);
  
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    // Improved join with newlines for better paragraph detection
    const pageText = textContent.items.map((item: any) => item.str + (item.hasEOL ? "\n" : "")).join(" ");
    fullText += pageText + "\n\n";
    
    // Update progress
    if (onProgress) {
        onProgress(Math.floor((i / maxPages) * 100));
    }
    
    // Yield to main thread to keep UI responsive (Chunking simulation)
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  return fullText;
};

const extractTextFromDocx = async (file: File): Promise<string> => {
    const mammoth = (window as any).mammoth;
    if (!mammoth) throw new Error("Mammoth library not loaded");
    
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value;
}

// PDF Toolkit - Merge
export const mergePDFs = async (files: File[]): Promise<Uint8Array> => {
  const PDFLib = (window as any).PDFLib;
  if (!PDFLib) throw new Error("PDF-Lib not loaded. Check internet connection.");
  
  if (files.length < 2) {
      // If only 1 file, just return it (or throw warning, but returning is safer for UX)
      // Actually, let's process it through PDFLib to ensure it's valid
  }

  try {
    const mergedPdf = await PDFLib.PDFDocument.create(); 

    for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page: any) => mergedPdf.addPage(page));
    }

    const pdfBytes = await mergedPdf.save();
    return pdfBytes;
  } catch (error) {
    console.error("Merge error:", error);
    throw new Error("Failed to merge PDFs. Ensure files are not password protected.");
  }
};

// PDF Toolkit - Split
export const splitPDF = async (file: File): Promise<Uint8Array> => {
  const PDFLib = (window as any).PDFLib;
  if (!PDFLib) throw new Error("PDF-Lib not loaded");
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
  
  const newPdf = await PDFLib.PDFDocument.create();
  
  // Extract first 5 pages or all if less than 5
  const count = Math.min(pdf.getPageCount(), 5);
  const pageIndices = Array.from({ length: count }, (_, i) => i);
  
  const copiedPages = await newPdf.copyPages(pdf, pageIndices);
  copiedPages.forEach((page: any) => newPdf.addPage(page));
  
  const pdfBytes = await newPdf.save();
  return pdfBytes;
};

// PDF Toolkit - Images to PDF
export const imagesToPDF = async (files: File[]): Promise<Uint8Array> => {
    const PDFLib = (window as any).PDFLib;
    if (!PDFLib) throw new Error("PDF-Lib not loaded");

    const pdfDoc = await PDFLib.PDFDocument.create();

    for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        let image;
        if (file.type === 'image/jpeg') {
            image = await pdfDoc.embedJpg(arrayBuffer);
        } else if (file.type === 'image/png') {
            image = await pdfDoc.embedPng(arrayBuffer);
        } else {
            continue; // Skip unsupported
        }

        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
        });
    }
    
    return await pdfDoc.save();
};

// PDF Toolkit - Compress (Optimization simulation)
export const compressPDF = async (file: File): Promise<Uint8Array> => {
    const PDFLib = (window as any).PDFLib;
    if (!PDFLib) throw new Error("PDF-Lib not loaded");
    
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    return await pdfDoc.save({ useObjectStreams: false }); 
};

// PDF Toolkit - Word to PDF (Improved Layout Preservation)
export const wordToPDF = async (file: File): Promise<Blob> => {
    const mammoth = (window as any).mammoth;
    const html2pdf = (window as any).html2pdf;

    if (!mammoth || !html2pdf) throw new Error("Conversion libraries not loaded");

    const arrayBuffer = await file.arrayBuffer();
    
    // 1. Convert DOCX to HTML (preserves formatting, images, tables)
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
    
    // 2. Create a temporary container with Word-like styling
    const element = document.createElement('div');
    element.innerHTML = `
      <style>
        body { 
            font-family: 'Calibri', 'Arial', sans-serif; 
            line-height: 1.5; 
            color: #000;
            margin: 0;
            padding: 20px;
            width: 210mm; /* A4 Width */
            background: white;
        }
        .content {
            max-width: 100%;
        }
        img { max-width: 100%; height: auto; display: block; margin: 10px auto; }
        table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 15px 0; 
            font-size: 14px;
        }
        td, th { border: 1px solid #ccc; padding: 6px; }
        p { margin-bottom: 12px; text-align: left; }
        h1, h2, h3 { color: #1a1a1a; margin-top: 20px; margin-bottom: 10px; }
        ul, ol { margin-bottom: 12px; padding-left: 20px; }
      </style>
      <div class="content">${html}</div>
    `;

    // 3. Convert HTML container to PDF Blob with specific page settings
    const opt = {
      margin:       10, // mm
      filename:     'converted.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true }, // Higher scale for better resolution
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    return await html2pdf().from(element).set(opt).output('blob');
};

// PDF Toolkit - PDF to Word (Improved Layout Preservation)
export const pdfToWord = async (file: File): Promise<Blob> => {
    // Note: Pure client-side PDF to Word is limited. We use a structured HTML approach.
    const text = await readFileAsText(file);
    
    // Wrap text in paragraphs, preserving empty lines
    const paragraphs = text
        .split(/\n\n+/)
        .map(p => `<p class=MsoNormal style='margin-bottom:12.0pt;line-height:115%'>${p.replace(/\n/g, ' ')}</p>`)
        .join('');

    const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset='utf-8'>
            <title>Converted Document</title>
            <style>
                <!--
                /* Font Definitions */
                @font-face {font-family:"Cambria Math"; panose-1:2 4 5 3 5 4 6 3 2 4;}
                @font-face {font-family:Calibri; panose-1:2 15 5 2 2 2 4 3 2 4;}
                
                /* Style Definitions */
                p.MsoNormal, li.MsoNormal, div.MsoNormal
                {mso-style-unhide:no;
                mso-style-qformat:yes;
                mso-style-parent:"";
                margin-top:0cm;
                margin-right:0cm;
                margin-bottom:8.0pt;
                margin-left:0cm;
                line-height:107%;
                mso-pagination:widow-orphan;
                font-size:11.0pt;
                font-family:"Calibri",sans-serif;
                mso-ascii-font-family:Calibri;
                mso-ascii-theme-font:minor-latin;
                mso-fareast-font-family:Calibri;
                mso-fareast-theme-font:minor-latin;
                mso-hansi-font-family:Calibri;
                mso-hansi-theme-font:minor-latin;
                mso-bidi-font-family:"Times New Roman";
                mso-bidi-theme-font:minor-bidi;}
                
                @page WordSection1
                {size:595.3pt 841.9pt;
                margin:72.0pt 72.0pt 72.0pt 72.0pt;
                mso-header-margin:35.4pt;
                mso-footer-margin:35.4pt;
                mso-paper-source:0;}
                div.WordSection1
                {page:WordSection1;}
                -->
            </style>
        </head>
        <body>
            <div class=WordSection1>
                ${paragraphs}
            </div>
        </body>
        </html>
    `;
    
    return new Blob(['\ufeff', htmlContent], {
        type: 'application/msword'
    });
};