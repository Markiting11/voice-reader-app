import React, { useState } from "react";
import { createRoot } from "react-dom/client";

const App = () => {
  const [lines, setLines] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [language, setLanguage] = useState("en-US");

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      const pdfText = await extractTextFromPDF(file);
      setLines(splitIntoLines(pdfText));
    } else if (file.type.startsWith("image/")) {
      const imageText = await extractTextFromImage(file);
      setLines(splitIntoLines(imageText));
    }
  };

  const splitIntoLines = (text) => {
    return text.split(/\n|\.|\r/).map((line) => line.trim()).filter(Boolean);
  };

  const extractTextFromPDF = async (file) => {
    const pdfjsLib = await import("pdfjs-dist/build/pdf");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item) => item.str);
      text += strings.join(" ") + "\n";
    }
    return text;
  };

  const extractTextFromImage = async (file) => {
    const Tesseract = await import("tesseract.js");
    const result = await Tesseract.recognize(file, language.startsWith("ar") ? "ara" : language.startsWith("ur") ? "urd" : "eng", {
      logger: (m) => console.log(m),
    });
    return result.data.text;
  };

  const speakLine = (index) => {
    if (index >= lines.length) return;

    const utterance = new SpeechSynthesisUtterance(lines[index]);
    utterance.lang = language;
    utterance.onend = () => {
      if (isSpeaking && index + 1 < lines.length) {
        speakLine(index + 1);
        setCurrentLineIndex(index + 1);
      } else {
        setIsSpeaking(false);
      }
    };
    speechSynthesis.speak(utterance);
  };

  const startSpeaking = () => {
    setIsSpeaking(true);
    speakLine(currentLineIndex);
  };

  const stopSpeaking = () => {
    setIsSpeaking(false);
    speechSynthesis.cancel();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
      <h1>Voice Reader App (PDF/Image to Speech)</h1>

      <input type="file" accept=".pdf,image/*" onChange={handleFileUpload} />

      <div style={{ marginTop: '10px' }}>
        <label>Select Language: </label>
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="en-US">English</option>
          <option value="ur-PK">Urdu</option>
          <option value="ar-SA">Arabic</option>
        </select>
      </div>

      {lines.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <p><strong>Preview:</strong></p>
          <div style={{ backgroundColor: '#f0f0f0', padding: '10px', height: '200px', overflowY: 'auto' }}>
            {lines.map((line, idx) => (
              <p key={idx} style={{ color: idx === currentLineIndex ? 'blue' : 'black' }}>
                {line}
              </p>
            ))}
          </div>

          <div style={{ marginTop: '10px' }}>
            {!isSpeaking ? (
              <button onClick={startSpeaking}>Start Reading</button>
            ) : (
              <button onClick={stopSpeaking}>Stop Reading</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);