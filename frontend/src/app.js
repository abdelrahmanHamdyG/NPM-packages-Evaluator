"use strict";
import React, { useState } from 'react';
import './app.css';
import axios from 'axios';

const App = () => {
  const [file, setFile] = useState(null);
  const [urls, setUrls] = useState([]);
  const [results, setResults] = useState(null);
  const [uploadPackageName, setUploadPackageName] = useState('');
  const [uploadPackageVersion, setUploadPackageVersion] = useState('');
  const [updatePackageName, setUpdatePackageName] = useState('');
  const [updatePackageVersion, setUpdatePackageVersion] = useState('');
  const [ratingPackageId, setRatingPackageId] = useState('');
  const [downloadPackageId, setDownloadPackageId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [ratingResult, setRatingResult] = useState(null);
  const publicIp = "3.15.13.78"; // Replace with your EC2 instance's public IP address

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
        const parsedUrls = content.split('\n').map(line => line.trim()).filter(Boolean);
        setUrls(parsedUrls);
      };
      reader.readAsText(file);
    }
  };

  // Check package rating
  const handleCheckRating = async () => {
    if (!ratingPackageId) {
      alert('Please enter a package ID to check the rating.');
      return;
    }

    try {
      const response = await axios.get(`http://${publicIp}:3000/package/${ratingPackageId}/rate`, {
        headers: {
          'X-Authorization': `Bearer <your-token-here>`, // Replace with your token
        },
      });

      setRatingResult(response.data); // Set rating result to display in output box
    } catch (error) {
      console.error('Error fetching package rating:', error);
      alert('Failed to fetch the package rating. Please try again.');
    }
  };

  // Download a package as a ZIP file
  const handleDownload = async () => {
    if (!downloadPackageId) {
      alert('Please enter a package ID to download.');
      return;
    }

    try {
      const response = await axios.get(`http://${publicIp}:3000/package/${downloadPackageId}`, {
        headers: {
          'X-Authorization': `Bearer <your-token-here>`, // Replace with your token
        },
      });

      const base64Content = response.data.data.Content;
      const binaryContent = atob(base64Content);
      const buffer = new Uint8Array(binaryContent.length);
      for (let i = 0; i < binaryContent.length; i++) {
        buffer[i] = binaryContent.charCodeAt(i);
      }

      const blob = new Blob([buffer], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${downloadPackageId}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert('Download started!');
    } catch (error) {
      console.error('Error downloading package:', error);
      alert('Failed to download the package. Please try again.');
    }
  };
  // Reset Data
  const handleReset = async () => {
    try {
      const response = await axios.post(`http://${publicIp}:3000/reset`, {
        headers: {
          'X-Authorization': `Bearer <your-token-here>`, // Replace with your token
        },
      });

      alert('Data has been reset successfully!'); // Display success message
    } catch (error) {
      console.error('Error resetting data:', error);
      alert('Failed to reset data. Please try again.');
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

      {/* Package Management Section */}
      <h2>Package Management</h2>
      <div>
        <h3>Upload Package</h3>
        <input
          type="text"
          placeholder="Package Name"
          value={uploadPackageName}
          onChange={(e) => setUploadPackageName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Package Version"
          value={uploadPackageVersion}
          onChange={(e) => setUploadPackageVersion(e.target.value)}
        />
        <button onClick={() => console.log("Upload function goes here")}>Upload</button>
      </div>

      <div>
        <h3>Update Package</h3>
        <input
          type="text"
          placeholder="Package Name"
          value={updatePackageName}
          onChange={(e) => setUpdatePackageName(e.target.value)}
        />
        <input
          type="text"
          placeholder="New Version"
          value={updatePackageVersion}
          onChange={(e) => setUpdatePackageVersion(e.target.value)}
        />
        <button onClick={() => console.log("Update function goes here")}>Update</button>
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

      {/* Display Rating Results */}
      {ratingResult && (
        <div>
          <h2>Package Rating Results:</h2>
          <pre>{JSON.stringify(ratingResult, null, 2)}</pre>
        </div>
      )}

      {/* Download Package Section */}
      <div>
        <h3>Download Package</h3>
        <input
          type="text"
          placeholder="Package ID"
          value={downloadPackageId}
          onChange={(e) => setDownloadPackageId(e.target.value)}
        />
        <button onClick={handleDownload}>Download</button>
      </div>

      {/* Search Packages Section */}
      <h2>Search Packages</h2>
      <div>
        <input
          type="text"
          placeholder="Search Term"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={() => console.log("Search function goes here")}>Search</button>
      </div>

      {/* Fetch Package Versions Section */}
      <h2>Fetch Package Versions</h2>
      <input
        type="text"
        placeholder="Package Name"
        value={updatePackageName}
        onChange={(e) => setUpdatePackageName(e.target.value)}
      />
      <button onClick={() => console.log("Fetch versions function goes here")}>Get Versions</button>

      {/* Download History Section */}
      <h2>Download History</h2>
      <button onClick={() => console.log("Fetch download history function goes here")}>View Download History</button>
      {downloadHistory.length > 0 && (
        <div>
          <h3>Download History:</h3>
          <ul>
            {downloadHistory.map((entry, index) => (
              <li key={index}>{entry}</li>
            ))}
          </ul>
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