// import React, { useState } from 'react';

// const FileUpload = () => {
//   const [file, setFile] = useState<File | null>(null);
//   const [urls, setUrls] = useState<string[]>([]);
//   const [results, setResults] = useState<any>(null);

//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     if (event.target.files && event.target.files.length > 0) {
//       const selectedFile = event.target.files[0];
//       setFile(selectedFile);
//     }
//   };

//   const handleFileRead = () => {
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = (event) => {
//         const content = event.target?.result as string;
//         const parsedUrls = content.split('\n').map(line => line.trim()).filter(Boolean);
//         setUrls(parsedUrls);
//       };
//       reader.readAsText(file);
//     }
//   };

//   const calculateMetrics = async () => {
//     if (urls.length > 0) {
//       try {
//         const response = await fetch('/api/calculate-metrics', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({ urls }),
//         });
//         const data = await response.json();
//         setResults(data);
//       } catch (error) {
//         console.error("Error calculating metrics:", error);
//       }
//     }
//   };

//   return (
//     <div>
//       <h1>Upload URL File</h1>
//       <input type="file" accept=".txt" onChange={handleFileChange} />
//       <button onClick={handleFileRead}>Read File</button>

//       {urls.length > 0 && (
//         <div>
//           <h2>URLs:</h2>
//           <ul>
//             {urls.map((url, index) => (
//               <li key={index}>{url}</li>
//             ))}
//           </ul>
//           <button onClick={calculateMetrics}>Calculate Metrics</button>
//         </div>
//       )}

//       {results && (
//         <div>
//           <h2>Metrics Results:</h2>
//           <pre>{JSON.stringify(results, null, 2)}</pre>
//         </div>
//       )}
//     </div>
//   );
// };
/////////////////////////////////////////
// import React, { useState } from 'react';

// const App: React.FC = () => {
//   const [file, setFile] = useState<File | null>(null);
//   const [urls, setUrls] = useState<string[]>([]);
//   const [results, setResults] = useState<any>(null);

//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     if (event.target.files && event.target.files.length > 0) {
//       const selectedFile = event.target.files[0];
//       setFile(selectedFile);
//     }
//   };

//   const handleFileRead = () => {
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = (event) => {
//         const content = event.target?.result as string;
//         const parsedUrls = content.split('\n').map(line => line.trim()).filter(Boolean);
//         setUrls(parsedUrls);
//       };
//       reader.readAsText(file);
//     }
//   };

//   const calculateMetrics = async () => {
//     if (urls.length > 0) {
//       try {
//         const response = await fetch('/api/calculate-metrics', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({ urls }),
//         });
//         const data = await response.json();
//         setResults(data);
//       } catch (error) {
//         console.error("Error calculating metrics:", error);
//       }
//     }
//   };

//   // Placeholder functions for other functionalities
//   const handleUpload = () => {
//     console.log('Upload functionality to be implemented');
//   };

//   const handleUpdate = () => {
//     console.log('Update functionality to be implemented');
//   };

//   const handleCheckRating = () => {
//     console.log('Check rating functionality to be implemented');
//   };

//   const handleDownload = () => {
//     console.log('Download functionality to be implemented');
//   };

//   return (
//     <div className="App">
//       <h1>File Management System</h1>
//       <h2>Trustworthy Module Registry</h2>
//       <input type="file" accept=".txt" onChange={handleFileChange} />
//       <button onClick={handleFileRead}>Read File</button>
//       {urls.length > 0 && (
//         <div>
//           <h2>URLs:</h2>
//           <ul>
//             {urls.map((url, index) => (
//               <li key={index}>{url}</li>
//             ))}
//           </ul>
//           <button onClick={calculateMetrics}>Calculate Metrics</button>
//         </div>
//       )}
//       {results && (
//         <div>
//           <h2>Metrics Results:</h2>
//           <pre>{JSON.stringify(results, null, 2)}</pre>
//         </div>
//       )}
//       <div style={{ marginTop: '20px' }}>
//         <button onClick={handleUpload}>Upload Package</button>
//         <button onClick={handleUpdate}>Update Package</button>
//         <button onClick={handleCheckRating}>Check Package Rating</button>
//         <button onClick={handleDownload}>Download Package</button>
//       </div>
//     </div>
//   );
// };

// export default App;
///////////////////////////
"use strict";
import React, { useState } from 'react';
import './app.css';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [urls, setUrls] = useState<string[]>([]);
  const [results, setResults] = useState<any>(null); // You can replace `any` with a more specific type if you know the structure of results
  const [packageName, setPackageName] = useState<string>('');
  const [packageVersion, setPackageVersion] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [downloadHistory, setDownloadHistory] = useState<string[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
    }
  };

  const handleFileRead = () => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
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

  const handleDownload = () => {
    // Placeholder for download functionality
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
        <input type="text" placeholder="Package Name" value={packageName} onChange={(e) => setPackageName(e.target.value)} />
        <button onClick={handleDownload}>Download</button>
      </div>

      {/* Search Packages Section */}
            {/* Search Packages Section */}
            <h2>Search Packages</h2>
      <div>
        <input type="text" placeholder="Search Term" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <button onClick={handleSearch}>Search</button>
      </div>

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