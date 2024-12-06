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
  const [updatePackageID, setUpdatePackageId] = useState("");
  const [downloadPackageId, setDownloadPackageId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [ratingResult, setRatingResult] = useState(null);
  const [uploadType, setUploadType] = useState("content");
  const [uploadUpdateType, setUploadUpdateType] = useState("content");
  const [updateDebloat, setUpdateDebloat] = useState(false);
  const [packageContent, setPackageContent] = useState("");
  const [packageUpdateContent, setUpdatePackageContent] = useState("");
  const [packageUpdateURL, setUpdatePackageURL] = useState("");
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


// Add to the existing App component
// Add handleUpdate function
const handleUpdate = async () => {
  if (!updatePackageName || !updatePackageVersion || !updatePackageID || (!packageUpdateContent && !packageUpdateURL)) {
    alert("Please fill out all required fields for the update.");
    return;
  }

  try {
    const payload = {
      metadata: {
        Name: updatePackageName,
        Version: updatePackageVersion,
        ID: updatePackageID,
      },
      data: uploadUpdateType === "content"
        ? { Name: updatePackageName, Content: packageUpdateContent, JSProgram: jsProgram, debloat: updateDebloat }
        : { Name: updatePackageName, URL: packageUpdateURL, JSProgram: jsProgram, debloat: updateDebloat },
    };

    const response = await axios.post(
      `http://${publicIp}:3000/package/${updatePackageID}`,
      payload,
      {
        headers: {
          "X-Authorization": `Bearer <your-token-here>`, // Replace with your token
        },
      }
    );

    alert("Package updated successfully!");
  } catch (error) {
    console.error("Error updating package:", error);
    alert("Failed to update the package. Please try again.");
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
{/* Update Package Section */}
<h2>Update Existing Package</h2>
<div>
  <label>
    <input
      type="radio"
      name="uploadType"
      value="content"
      checked={uploadUpdateType === "content"}
      onChange={() => setUploadUpdateType("content")}
    />
    Upload Content
  </label>
  <label>
    <input
      type="radio"
      name="uploadUpdateType"
      value="URL"
      checked={uploadUpdateType === "URL"}
      onChange={() => setUploadUpdateType("URL")}
    />
    Provide URL
  </label>
</div>

<div style={{ marginTop: '20px' }}>
  <div style={{ marginBottom: '10px' }}>
    <label>
      Package ID:
      <input
        type="text"
        placeholder="Enter Package ID"
        value={updatePackageID}
        onChange={(e) => setUpdatePackageId(e.target.value)}
        style={{ marginLeft: '10px', width: '300px' }}
      />
    </label>
  </div>
  <div style={{ marginBottom: '10px' }}>
    <label>
      Package Name:
      <input
        type="text"
        placeholder="Enter Package Name"
        value={updatePackageName}
        onChange={(e) => setUpdatePackageName(e.target.value)}
        style={{ marginLeft: '10px', width: '300px' }}
      />
    </label>
  </div>
  <div style={{ marginBottom: '10px' }}>
    <label>
      Package Version:
      <input
        type="text"
        placeholder="Enter Package Version"
        value={updatePackageVersion}
        onChange={(e) => setUpdatePackageVersion(e.target.value)}
        style={{ marginLeft: '10px', width: '300px' }}
      />
    </label>
  </div>

  {uploadUpdateType === "content" ? (
    <div style={{ marginBottom: '10px' }}>
      <label>
        Base64 Encoded Package Content:
        <textarea
          placeholder="Paste Base64 Encoded Content Here"
          value={packageUpdateContent}
          onChange={(e) => setUpdatePackageContent(e.target.value)}
          rows={10}
          cols={50}
          style={{ display: 'block', marginTop: '5px', width: '300px' }}
        />
      </label>
    </div>
  ) : (
    <div style={{ marginBottom: '10px' }}>
      <label>
        Package URL:
        <input
          type="text"
          placeholder="Enter Package URL"
          value={packageUpdateURL}
          onChange={(e) => setUpdatePackageURL(e.target.value)}
          style={{ marginLeft: '10px', width: '300px' }}
        />
      </label>
    </div>
  )}

  <div style={{ marginBottom: '10px' }}>
    <label>
      <input
        type="checkbox"
        checked={updateDebloat}
        onChange={(e) => setUpdateDebloat(e.target.checked)}
      />
      Apply Debloat
    </label>
  </div>

  <button onClick={handleUpdate} style={{ marginTop: '10px' }}>Update Package</button>
</div>


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
