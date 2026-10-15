const resumeText = [
  { text: "YAZID BAIHAQI", size: 25, color: "navy", gap: 32 },
  { text: "Informatics Engineering Student", size: 11, color: "orange", gap: 19 },
  { text: "yazidbaihaqi93@gmail.com", size: 10, color: "muted", gap: 25 },
  { text: "EDUCATION", size: 12, color: "navy", gap: 18 },
  { text: "UIN Syarif Hidayatullah Jakarta  |  2025-2029", size: 10, color: "ink", gap: 15 },
  { text: "Informatics Engineering  |  GPA: 3.70", size: 9, color: "muted", gap: 24 },
  { text: "EXPERIENCE", size: 12, color: "navy", gap: 18 },
  { text: "Administrative Assistant", size: 10, color: "ink", gap: 15 },
  { text: "MTs / Yayasan Tarbiyatul Mubtadiin  |  May 2023-April 2024", size: 9, color: "muted", gap: 25 },
  { text: "SELECTED PROJECTS", size: 12, color: "navy", gap: 18 },
  { text: "Network Protocol & Traffic Analysis", size: 10, color: "ink", gap: 15 },
  { text: "Academic lab work exploring network protocols and traffic analysis using Cisco Packet Tracer.", size: 9, color: "muted", gap: 17 },
  { text: "SAKU KAMPUS", size: 10, color: "ink", gap: 15 },
  { text: "Scholarship-information system concept. Role: Systems Analyst and UI/UX.", size: 9, color: "muted", gap: 25 },
  { text: "SKILLS", size: 12, color: "navy", gap: 18 },
  { text: "Network traffic analysis  |  Packet sniffing (Wireshark)  |  Network security", size: 9, color: "ink", gap: 15 },
  { text: "Hardware/software troubleshooting  |  Cloud computing", size: 9, color: "ink", gap: 25 },
  { text: "CERTIFICATES", size: 12, color: "navy", gap: 18 },
  { text: "Google Cloud Fundamentals", size: 9, color: "ink", gap: 15 },
  { text: "GDGoC UIN Jakarta - UI/UX & Digital Skill Series", size: 9, color: "ink", gap: 25 },
  { text: "LANGUAGES", size: 12, color: "navy", gap: 18 },
  { text: "Indonesian (Active)  |  English (Intermediate)  |  Arabic (Intermediate)", size: 9, color: "ink", gap: 0 }
];

const pdfColors = {
  navy: "0.063 0.114 0.208 rg",
  orange: "0.72 0.24 0.04 rg",
  ink: "0.098 0.149 0.231 rg",
  muted: "0.392 0.439 0.525 rg"
};

function pdfEscape(value) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function pdfBytes(value) {
  return new TextEncoder().encode(value);
}

function combineBytes(chunks) {
  const size = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const result = new Uint8Array(size);
  let offset = 0;
  chunks.forEach((chunk) => {
    result.set(chunk, offset);
    offset += chunk.length;
  });
  return result;
}

async function loadPortraitJpeg() {
  const image = new Image();
  image.src = new URL("assets/yazid-baihaqi.png", document.baseURI).href;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("The portrait image could not be prepared for the resume PDF.");
  }
  context.drawImage(image, 0, 0);
  const jpeg = await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("The portrait image could not be encoded for the resume PDF."));
      }
    }, "image/jpeg", 0.88);
  });
  return {
    bytes: new Uint8Array(await jpeg.arrayBuffer()),
    width: canvas.width,
    height: canvas.height
  };
}

async function buildResumePdf() {
  const portrait = await loadPortraitJpeg();
  let y = 790;
  const commands = [];

  resumeText.forEach((line) => {
    commands.push(`BT ${pdfColors[line.color]} /F1 ${line.size} Tf 1 0 0 1 50 ${y} Tm (${pdfEscape(line.text)}) Tj ET`);
    y -= line.gap;
  });
  commands.push("q 108 0 0 128 437 674 cm /Im1 Do Q");
  const stream = pdfBytes(commands.join("\n"));
  const objects = [
    [pdfBytes("<< /Type /Catalog /Pages 2 0 R >>")],
    [pdfBytes("<< /Type /Pages /Kids [3 0 R] /Count 1 >>")],
    [pdfBytes("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> /XObject << /Im1 6 0 R >> >> /Contents 5 0 R >>")],
    [pdfBytes("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")],
    [pdfBytes(`<< /Length ${stream.length} >>\nstream\n`), stream, pdfBytes("\nendstream")],
    [
      pdfBytes(`<< /Type /XObject /Subtype /Image /Width ${portrait.width} /Height ${portrait.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${portrait.bytes.length} >>\nstream\n`),
      portrait.bytes,
      pdfBytes("\nendstream")
    ]
  ];
  const chunks = [pdfBytes("%PDF-1.4\n")];
  const offsets = [0];
  let byteLength = chunks[0].length;
  objects.forEach((object, index) => {
    offsets.push(byteLength);
    const objectChunks = [pdfBytes(`${index + 1} 0 obj\n`), ...object, pdfBytes("\nendobj\n")];
    chunks.push(...objectChunks);
    byteLength += objectChunks.reduce((total, chunk) => total + chunk.length, 0);
  });
  const xrefOffset = byteLength;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  chunks.push(pdfBytes(xref));
  return new Blob([combineBytes(chunks)], { type: "application/pdf" });
}

document.getElementById("download-resume")?.addEventListener("click", async (event) => {
  const button = event.currentTarget;
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }
  button.disabled = true;
  try {
    const url = URL.createObjectURL(await buildResumePdf());
    const link = document.createElement("a");
    link.href = url;
    link.download = "Yazid-Baihaqi-Resume.pdf";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error("Unable to generate the resume PDF.", error);
    window.alert("The resume PDF could not be generated. Please try again.");
  } finally {
    button.disabled = false;
  }
});
