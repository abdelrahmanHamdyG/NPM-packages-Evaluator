"use strict";
import React, { useState } from "react";
import "./app.css";
import axios from "axios";

const App = () => {
  const [file, setFile] = useState(null);
  const [urls, setUrls] = useState([]);
  const [uploadPackageName, setUploadPackageName] = useState("");
  const [uploadPackageVersion, setUploadPackageVersion] = useState("");
  const [updatePackageName, setUpdatePackageName] = useState("");
  const [updatePackageVersion, setUpdatePackageVersion] = useState("");
  const [ratingPackageId, setRatingPackageId] = useState("");
  const [downloadPackageId, setDownloadPackageId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [ratingResult, setRatingResult] = useState(null);
  const [uploadType, setUploadType] = useState("content");
  const [packageContent, setPackageContent] = useState("");
  const [packageURL, setPackageURL] = useState("");
  const [jsProgram, setJsProgram] = useState("");
  const [debloat, setDebloat] = useState(false);
  const [uploadResponse, setUploadResponse] = useState(null);
  const publicIp = "3.129.57.219";

  // Handle file input change
  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
    }
  };

  // Read URLs from file and update URLs state
  const handleFileRead = () => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result;
        const parsedUrls = content
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        setUrls(parsedUrls);
      };
      reader.readAsText(file);
    }
  };

  // Upload a new package
  const handleUpload = async () => {
    if (uploadType === "content" && !packageContent) {
      alert("Please provide Base64-encoded package content.");
      return;
    }

    if (uploadType === "URL" && !packageURL) {
      alert("Please provide a package URL.");
      return;
    }

    try {
      const payload =
        uploadType === "content"
          ? { Content: packageContent, JSProgram: jsProgram, debloat }
          : { URL: packageURL, JSProgram: jsProgram, debloat };

      const response = await axios.post(`http://${publicIp}:3000/package`, payload, {
        headers: {
          "X-Authorization": `Bearer <your-token-here>`, // Replace with your token
        },
      });

      setUploadResponse(response.data);
      alert("Package uploaded successfully!");
    } catch (error) {
      console.error("Error uploading package:", error);
      alert("Failed to upload the package. Please try again.");
    }
  };

  // Check package rating
  const handleCheckRating = async () => {
    if (!ratingPackageId) {
      alert("Please enter a package ID to check the rating.");
      return;
    }

    try {
      const response = await axios.get(
        `http://${publicIp}:3000/package/${ratingPackageId}/rate`,
        {
          headers: {
            "X-Authorization": `Bearer <your-token-here>`, // Replace with your token
          },
        }
      );

      setRatingResult(response.data);
    } catch (error) {
      console.error("Error fetching package rating:", error);
      alert("Failed to fetch the package rating. Please try again.");
    }
  };

  // Reset Data
  const handleReset = async () => {
    try {
      const response = await axios.post(`http://${publicIp}:3000/reset`, {
        headers: {
          "X-Authorization": `Bearer <your-token-here>`, // Replace with your token
        },
      });

      alert("Data has been reset successfully!");
    } catch (error) {
      console.error("Error resetting data:", error);
      alert("Failed to reset data. Please try again.");
    }
  };

  return (
    <div className="App">
      <h1>Trustworthy Module Registry</h1>

      {/* Upload URL File Section */}
      <h2>Upload URL File</h2>
      <input type="file" accept=".txt" onChange={handleFileChange} />
      <button onClick={handleFileRead}>Read File</button>

      {urls.length > 0 && (
        <div>
          <h2>URLs:</h2>
          <ul>
            {urls.map((url, index) => (
              <li key={index}>{url}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload New Package Section */}
      <h2>Upload New Package</h2>
      <div>
        <label>
          <input
            type="radio"
            name="uploadType"
            value="content"
            checked={uploadType === "content"}
            onChange={() => setUploadType("content")}
          />
          Upload Content
        </label>
        <label>
          <input
            type="radio"
            name="uploadType"
            value="URL"
            checked={uploadType === "URL"}
            onChange={() => setUploadType("URL")}
          />
          Provide URL
        </label>
      </div>

      {uploadType === "content" ? (
        <textarea
          placeholder="Base64 Encoded Package Content"
          value={packageContent}
          onChange={(e) => setPackageContent(e.target.value)}
          rows={10}
          cols={50}
        />
      ) : (
        <input
          type="text"
          placeholder="Package URL"
          value={packageURL}
          onChange={(e) => setPackageURL(e.target.value)}
        />
      )}

      <input
        type="text"
        placeholder="JS Program (Optional)"
        value={jsProgram}
        onChange={(e) => setJsProgram(e.target.value)}
      />
      <label>
        <input
          type="checkbox"
          checked={debloat}
          onChange={(e) => setDebloat(e.target.checked)}
        />
        Apply Debloat
      </label>
      <button onClick={handleUpload}>Upload</button>

      {uploadResponse && (
        <div>
          <h2>Upload Response:</h2>
          <pre>{JSON.stringify(uploadResponse, null, 2)}</pre>
        </div>
      )}

      {/* Check Package Rating Section */}
      <div>
        <h3>Check Package Rating</h3>
        <input
          type="text"
          placeholder="Package ID"
          value={ratingPackageId}
          onChange={(e) => setRatingPackageId(e.target.value)}
        />
        <button onClick={handleCheckRating}>Check Rating</button>
      </div>

      {ratingResult && (
        <div>
          <h2>Package Rating Results:</h2>
          <pre>{JSON.stringify(ratingResult, null, 2)}</pre>
        </div>
      )}

      {/* Reset Data Section */}
      <h2>Reset Data</h2>
      <div>
        <button onClick={handleReset}>Reset Data</button>
      </div>
    </div>
  );
};

export default App;
