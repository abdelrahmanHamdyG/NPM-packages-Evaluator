"use strict";
import React, { useState, useEffect } from 'react';
import './app.css';
import axios from 'axios';

const App = () => {
  const [file, setFile] = useState(null);
  const [urls, setUrls] = useState([]);
  const [results, setResults] = useState(null);
  const [packageName, setPackageName] = useState('');
  const [packageVersion, setPackageVersion] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadHistory, setDownloadHistory] = useState([]);

  const [publicIp, setPublicIp] = useState(''); // New state for public IP

  useEffect(() => {
    const fetchPublicIp = async () => {
      try {
        const response = await axios.get('http://ifconfig.me');
        setPublicIp(response.data.trim()); // Store the public IP
      } catch (error) {
        console.error('Error fetching public IP:', error);
      }
    };

    fetchPublicIp(); // Fetch the public IP when the component mounts
  }, []);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
    }
  };

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

  const calculateMetrics = async () => {
    // Placeholder for calculating metrics
  };

  const handleUpload = () => {
    // Placeholder for upload functionality
  };

  const handleUpdate = () => {
    // Placeholder for update functionality
  };

  const handleCheckRating = () => {
    // Placeholder for check rating functionality
  };

  const handleDownload = async () => {
    // Placeholder for download functionality
    if (!packageName) {
      alert('Please enter a valid package ID to download.');
      return;
    }

    try {
      // Call REST API to download the package
      const response = await axios.get(`http://${publicIp}:3000/package/${packageName}`, {
        headers: {
          'X-Authorization': `Bearer <your-token-here>`, // Add your token here
        },
      });

       // Extract the Base64 content from the API response
      const base64Content = response.data.data.Content;

      // Decode the Base64 string to a binary buffer
      const binaryContent = atob(base64Content); // Decodes Base64 to binary string
      const buffer = new Uint8Array(binaryContent.length);
      for (let i = 0; i < binaryContent.length; i++) {
        buffer[i] = binaryContent.charCodeAt(i);
      }

      // Create a Blob from the binary data
      const blob = new Blob([buffer], { type: 'application/zip' });

      // Create a blob URL and a link element to initiate download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Set filename for download (default to <packageName>.zip)
      link.setAttribute('download', `${packageName}.zip`);
      document.body.appendChild(link);

      // Trigger the download
      link.click();

      // Cleanup after download
      link.remove();
      window.URL.revokeObjectURL(url);

      alert('Download started!');
    } catch (error) {
      console.error('Error downloading package:', error);
      alert('Failed to download the package. Please try again.');
    }
  };

  const handleSearch = () => {
    // Placeholder for search functionality
  };

  const handleFetchVersions = () => {
    // Placeholder for fetching package versions functionality
  };

  const handleFetchDownloadHistory = () => {
    // Placeholder for fetching download history functionality
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
          <button onClick={calculateMetrics}>Calculate Metrics</button>
        </div>
      )}

      {results && (
        <div>
          <h2>Metrics Results:</h2>
          <pre>{JSON.stringify(results, null, 2)}</pre>
        </div>
      )}

      {/* Package Management Section */}
      <h2>Package Management</h2>
      <div>
        <h3>Upload Package</h3>
        <input type="text" placeholder="Package Name" value={packageName} onChange={(e) => setPackageName(e.target.value)} />
        <input type="text" placeholder="Package Version" value={packageVersion} onChange={(e) => setPackageVersion(e.target.value)} />
        <button onClick={handleUpload}>Upload</button>
      </div>

      <div>
        <h3>Update Package</h3>
        <input type="text" placeholder="Package Name" value={packageName} onChange={(e) => setPackageName(e.target.value)} />
        <input type="text" placeholder="New Version" value={packageVersion} onChange={(e) => setPackageVersion(e.target.value)} />
        <button onClick={handleUpdate}>Update</button>
      </div>

      <div>
        <h3>Check Package Rating</h3>
        <input type="text" placeholder="Package Name" value={packageName} onChange={(e) => setPackageName(e.target.value)} />
        <button onClick={handleCheckRating}>Check Rating</button>
      </div>

      <div>
        <h3>Download Package</h3>
        <input type="text" placeholder="Package ID" value={packageName} onChange={(e) => setPackageName(e.target.value)} />
        <button onClick={handleDownload}>Download</button>
      </div>

      {/* Search Packages Section */}
      <h2>Search Packages</h2>
      <div>
      <input type="text" placeholder="Search Term" value={searchTerm} onChange={(e) => setPackageName(e.target.value)} />
      <button onClick={handleSearch}>Search</button>
      </div>
        {/* Fetch Package Versions Section */}  
              {/* Fetch Package Versions Section */}
      <h2>Fetch Package Versions</h2>
      <input type="text" placeholder="Package Name" value={packageName} onChange={(e) => setPackageName(e.target.value)} />
      <button onClick={handleFetchVersions}>Get Versions</button>

      {/* Download History Section */}
      <h2>Download History</h2>
      <button onClick={handleFetchDownloadHistory}>View Download History</button>
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

      {/* Metrics Results Section */}
      {results && (
        <div>
          <h2>Metrics Results:</h2>
          <pre>{JSON.stringify(results, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default App;