// "use strict";
// var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
//     function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
//     return new (P || (P = Promise))(function (resolve, reject) {
//         function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
//         function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
//         function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
//         step((generator = generator.apply(thisArg, _arguments || [])).next());
//     });
// };
// Object.defineProperty(exports, "__esModule", { value: true });
// const jsx_runtime_1 = require("react/jsx-runtime");
// const react_1 = require("react");
// const FileUpload = () => {
//     const [file, setFile] = (0, react_1.useState)(null);
//     const [urls, setUrls] = (0, react_1.useState)([]);
//     const [results, setResults] = (0, react_1.useState)(null);
//     const handleFileChange = (event) => {
//         if (event.target.files && event.target.files.length > 0) {
//             const selectedFile = event.target.files[0];
//             setFile(selectedFile);
//         }
//     };
//     const handleFileRead = () => {
//         if (file) {
//             const reader = new FileReader();
//             reader.onload = (event) => {
//                 var _a;
//                 const content = (_a = event.target) === null || _a === void 0 ? void 0 : _a.result;
//                 const parsedUrls = content.split('\n').map(line => line.trim()).filter(Boolean);
//                 setUrls(parsedUrls);
//             };
//             reader.readAsText(file);
//         }
//     };
//     const calculateMetrics = () => __awaiter(void 0, void 0, void 0, function* () {
//         if (urls.length > 0) {
//             try {
//                 const response = yield fetch('/api/calculate-metrics', {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                     },
//                     body: JSON.stringify({ urls }),
//                 });
//                 const data = yield response.json();
//                 setResults(data);
//             }
//             catch (error) {
//                 console.error("Error calculating metrics:", error);
//             }
//         }
//     });
//     return ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { children: "Upload URL File" }), (0, jsx_runtime_1.jsx)("input", { type: "file", accept: ".txt", onChange: handleFileChange }), (0, jsx_runtime_1.jsx)("button", { onClick: handleFileRead, children: "Read File" }), urls.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { children: "URLs:" }), (0, jsx_runtime_1.jsx)("ul", { children: urls.map((url, index) => ((0, jsx_runtime_1.jsx)("li", { children: url }, index))) }), (0, jsx_runtime_1.jsx)("button", { onClick: calculateMetrics, children: "Calculate Metrics" })] })), results && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { children: "Metrics Results:" }), (0, jsx_runtime_1.jsx)("pre", { children: JSON.stringify(results, null, 2) })] }))] }));
// };
// exports.default = FileUpload;
/////////////////////////////////////////////
// "use strict";
// import React, { useState } from 'react';
// import './app.css';

// const App = () => {
//   const [file, setFile] = useState(null);
//   const [urls, setUrls] = useState([]);
//   const [results, setResults] = useState(null);

//   const handleFileChange = (event) => {
//     if (event.target.files && event.target.files.length > 0) {
//       const selectedFile = event.target.files[0];
//       setFile(selectedFile);
//     }
//   };

//   const handleFileRead = () => {
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = (event) => {
//         const content = event.target?.result;
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
//       <h1>Trustworthy Module Registry</h1>
//       <h2>Upload URL File</h2>
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

//       {urls.length > 0 && (
//         <div style={{ marginTop: '20px' }}>
//           <button onClick={handleUpload}>Upload Package</button>
//           <button onClick={handleUpdate}>Update Package</button>
//           <button onClick={handleCheckRating}>Check Package Rating</button>
//           <button onClick={handleDownload}>Download Package</button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default App;
////////////////////////////

"use strict";
import React, { useState } from 'react';
import './app.css';

const App = () => {
  const [file, setFile] = useState(null);
  const [urls, setUrls] = useState([]);
  const [results, setResults] = useState(null);
  const [packageName, setPackageName] = useState('');
  const [packageVersion, setPackageVersion] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadHistory, setDownloadHistory] = useState([]);

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