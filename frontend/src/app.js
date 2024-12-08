import React, { useState } from "react";
import "./app.css";
import axios from "axios";

const App = () => {

  const [ratingPackageId, setRatingPackageId] = useState("");
  const [updatePackageID, setUpdatePackageId] = useState("");
  const [regexSearchTerm, setRegexSearchTerm] = useState("");
  const [regexSearchResults, setRegexSearchResults] = useState([]);
  const [uploadType, setUploadType] = useState("content");
  const [uploadUpdateType, setUploadUpdateType] = useState("content");
  const [updateDebloat, setUpdateDebloat] = useState(false);
  const [packageContent, setPackageContent] = useState("");
  const [updatePackageName, setUpdatePackageName] = useState("");
  const [updatePackageVersion, setUpdatePackageVersion] = useState("");
  const [costPackageId, setCostPackageId] = useState("");
  const [costResult, setCostResult] = useState(null);

  const [packageUpdateContent, setUpdatePackageContent] = useState("");
  const [packageUpdateURL, setUpdatePackageURL] = useState("");
  const [packageURL, setPackageURL] = useState("");
  const [jsProgram, setJsProgram] = useState("");
  const [debloat, setDebloat] = useState(false);
  const [uploadResponse, setUploadResponse] = useState(null);
  const [ratingResult, setRatingResult] = useState(null);
  const [trackResult, setTrackResult] = useState(null);
  const [packagesName, setPackagesName] = useState("");
  const [packagesVersion, setPackagesVersion] = useState("");

  const [packageResults, setPackageResults] = useState([]);
  const [packageId, setPackageId] = useState(""); // State for package ID
  const [packageByIdResult, setPackageByIdResult] = useState(null); // State for package details by ID
  
  const publicIp = "18.117.89.241";
  const handleGetPackageById = async () => {
    if (!packageId) {
      alert("Please enter a package ID.");
      return;
    }

    try {
      const response = await axios.get(`http://${publicIp}:3000/package/${packageId}`, {
        headers: {
          "X-Authorization": `Bearer <your-token-here>`, // Replace with your token
        },
      });

      setPackageByIdResult(response.data);
      alert("Package fetched successfully!");
    } catch (error) {
      console.error("Error fetching package by ID:", error);
      alert("Failed to fetch the package. Please try again.");
    }
  };
const handleGetPackages = async () => {
  if (!packagesName) {
    alert("Please enter a query to fetch packages.");
    return;
  }

  try {
    const payload = [
      {
        Name: packagesName,
        Version: packagesVersion, // Adjust this based on the version requirement
      },
    ];

    const response = await axios.post(`http://${publicIp}:3000/packages`,
      payload, {
        headers: {
          "X-Authorization": `Bearer <your-token-here>`, // Replace with your token
        },
      }
    );

    setPackageResults(response.data || []);
   
  } catch (error) {
    console.error("Error fetching packages:", error);
    alert("Failed to fetch packages. Please try again.");
  }
};


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
          "X-Authorization": `Bearer <your-token-here>`,
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
            "X-Authorization": `Bearer <your-token-here>`,
          },
        }
      );

      setRatingResult(response.data);
    } catch (error) {
      console.error("Error fetching package rating:", error);
      alert("Failed to fetch the package rating. Please try again.");
    }
  };
  const handleTracks = async () => {
   

    try {
      const response = await axios.get(
        `http://${publicIp}:3000/tracks`,
        {
          headers: {
            "X-Authorization": `Bearer <your-token-here>`,
          },
        }
      );

      setTrackResult(response.data);
    } catch (error) {
      console.error("Error fetching package rating:", error);
      alert("Failed to fetch the package rating. Please try again.");
    }
  };

  
  const handleCheckCost = async () => {
    if (!costPackageId) {
      alert("Please enter a package ID to check the cost.");
      return;
    }

    try {
      const response = await axios.get(
        `http://${publicIp}:3000/package/${costPackageId}/cost`,
        {
          headers: {
            "X-Authorization": `Bearer <your-token-here>`,
          },
        }
      );

      setCostResult(response.data);
    } catch (error) {
      console.error("Error fetching package cost:", error);
      alert("Failed to fetch the package cost. Please try again.");
    }
  };

  const handleRegexSearch = async () => {
    if (!regexSearchTerm) {
      alert("Please enter a valid regex search term.");
      return;
    }

    try {
      const response = await axios.post(
        `http://${publicIp}:3000/package/byRegEx`,
        { RegEx: regexSearchTerm },
        {
          headers: {
            "X-Authorization": `Bearer <your-token-here>`,
          },
        }
      );

      setRegexSearchResults(response.data);
      alert("Search completed successfully!");
    } catch (error) {
      console.error("Error searching by regex:", error);
      alert("Failed to perform regex search. Please try again.");
    }
  };

  const handleReset = async () => {
    try {
      const response = await axios.post(`http://${publicIp}:3000/reset`, {}, {
        headers: {
          "X-Authorization": `Bearer <your-token-here>`,
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
 {/* Get Package by ID Section */}
 <h2>Get Package by ID</h2>
      <div>
        <input
          type="text"
          placeholder="Enter Package ID"
          value={packageId}
          onChange={(e) => setPackageId(e.target.value)}
        />
        <button style={{ backgroundColor: '#007ea7', color: '#ffffff' }} 
        onClick={handleGetPackageById}>Get Package</button>
      </div>

      {packageByIdResult && (
        <div>
          <h2>Package Details:</h2>
          <pre>{JSON.stringify(packageByIdResult, null, 2)}</pre>
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
            onChange={() => {setUploadType("content"), setPackageURL("")}}
          />
          Upload Content
        </label>
        <label>
          <input
            type="radio"
            name="uploadType"
            value="URL"
            checked={uploadType === "URL"}
            onChange={() => {setUploadType("URL"), setPackageContent("")}}
          />
          Provide URL
        </label>
      </div>

      {uploadType === "content" ? (
        <textarea
          placeholder="Paste Base64 Encoded Package Content Here"
          value={packageContent}
          onChange={(e) => setPackageContent(e.target.value)}
          rows={10}
          cols={50}
          style={{
          color: "#000000", // Text color
          backgroundColor: "#ffffff", // Background color
          borderColor: "#cccccc", // for border visibility
          padding: "10px",
          borderRadius: "4px", // Rounded corners
      fontFamily: "Arial, sans-serif", // Font family
      fontSize: "16px", // Font size
      resize: "vertical", // Allow vertical resizing only
      width: "100%", // Ensure it adjusts to container width
      maxWidth: "90vw", // Limit to viewport width
      boxSizing: "border-box", // Include padding in width calculation
        }}
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
      <button style={{ backgroundColor: '#007ea7', color: '#ffffff' }}
      onClick={handleUpload}>Upload</button>

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
      name="uploadUpdateType"
      value="content"
      checked={uploadUpdateType === "content"}
      onChange={() => {setUploadUpdateType("content"); setUpdatePackageURL("");}}
    />
    Upload Content
  </label>
  <label>
    <input
      type="radio"
      name="uploadUpdateType"
      value="URL"
      checked={uploadUpdateType === "URL"}
      onChange={() => {setUploadUpdateType("URL"); setUpdatePackageContent("");}}
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
        placeholder="Enter Package ID to Update"
        value={updatePackageID}
        onChange={(e) => setUpdatePackageId(e.target.value)}
        // style={{ marginLeft: '10px', width: '300px' }}
        style={{
    marginLeft: "10px",
    width: "100%", // Makes it responsive
    maxWidth: "250px", // Limits the maximum width
    padding: "8px", // Adds internal spacing
    fontSize: "12px", // Adjusts text size for readability
    borderRadius: "4px", // Adds slight rounding to edges
    border: "1px solid #ccc", // Ensures visible border
    boxSizing: "border-box", // Includes padding in width
  }}
        
      />
    </label>
  </div>
  <div style={{ marginBottom: '10px' }}>
    <label>
      Package Name:
      <input
        type="text"
        placeholder="Enter Package Name to Update"
        value={updatePackageName}
        onChange={(e) => setUpdatePackageName(e.target.value)}
        // style={{ marginLeft: '10px', width: '300px' }}
        style={{
    marginLeft: "10px",
    width: "100%", // Makes it responsive
    maxWidth: "250px", // Limits the maximum width
    padding: "8px", // Adds internal spacing
    fontSize: "12px", // Adjusts text size for readability
    borderRadius: "4px", // Adds slight rounding to edges
    border: "1px solid #ccc", // Ensures visible border
    boxSizing: "border-box", // Includes padding in width
  }}
      />
    </label>
  </div>
  <div style={{ marginBottom: '10px' }}>
    <label>
      Package Version:
      <input
        type="text"
        placeholder="Enter Package Version to Update"
        value={updatePackageVersion}
        onChange={(e) => setUpdatePackageVersion(e.target.value)}
        // style={{ marginLeft: '10px', width: '300px' }}
        style={{
    marginLeft: "10px",
    width: "100%", // Makes it responsive
    maxWidth: "250px", // Limits the maximum width
    padding: "8px", // Adds internal spacing
    fontSize: "12px", // Adjusts text size for readability
    borderRadius: "4px", // Adds slight rounding to edges
    border: "1px solid #ccc", // Ensures visible border
    boxSizing: "border-box", // Includes padding in width
  }}
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
          style={{ display: 'block', marginTop: '5px', width: '300px' ,
                      color: "#000000", // Text color
          backgroundColor: "#ffffff", // Background color
          borderColor: "#cccccc", // for border visibility
          padding: "10px",
          borderRadius: "4px", // Rounded corners
      fontFamily: "Arial, sans-serif", // Font family
      fontSize: "16px", // Font size
      resize: "vertical", // Allow vertical resizing only
      width: "100%", // Ensure it adjusts to container width
      maxWidth: "90vw", // Limit to viewport width
      boxSizing: "border-box", // Include padding in width calculation
          }}
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

  <button onClick={handleUpdate} style={{ marginTop: '10px', backgroundColor: '#007ea7', color: '#ffffff' }}>Update Package</button>
</div>


      {/* Check Package Rating Section */}
      <div>
        <h2>Check Package Rating</h2>
        <input
          type="text"
          placeholder="Package ID"
          value={ratingPackageId}
          onChange={(e) => setRatingPackageId(e.target.value)}
        />
        <button onClick={handleCheckRating}
        style={{ backgroundColor: '#007ea7', color: '#ffffff' }}>Check Rating</button>
      </div>

      {ratingResult && (
        <div>
          <h2>Package Rating Results:</h2>
          <pre>{JSON.stringify(ratingResult, null, 2)}</pre>
        </div>
      )}

       {/* Check Package Cost Section */}
       <div>
        <h2>Check Package Cost</h2>
        <input
          type="text"
          placeholder="Package ID for Cost"
          value={costPackageId}
          onChange={(e) => setCostPackageId(e.target.value)}
        />
        <button onClick={handleCheckCost}
        style={{ backgroundColor: '#007ea7', color: '#ffffff' }}>Check Cost</button>
      </div>

      {costResult && (
        <div>
          <h2>Package Cost Results:</h2>
          <pre>{JSON.stringify(costResult, null, 2)}</pre>
        </div>
      )}

      {/* Search by Regex Section */}
      <h2>Search by Regex</h2>
      <div>
        <input
          type="text"
          placeholder="Enter Regex"
          value={regexSearchTerm}
          onChange={(e) => setRegexSearchTerm(e.target.value)}
        />
        <button onClick={handleRegexSearch} style={{ backgroundColor: '#007ea7', color: '#ffffff' }}>Search</button>
      </div>

      {regexSearchResults.length > 0 && (
        <div>
          <h2>Search Results:</h2>
          <ul>
            {regexSearchResults.map((result, index) => (
              <li key={index}>
                {result.name} (Version: {result.version})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Get Packages Section */}
<h2>Get Packages</h2>
<div>

  <input
    type="text"
    placeholder="Enter package Name"
    value={packagesName}
    onChange={(e) => setPackagesName(e.target.value)}
  />
  <div>
   <input
    type="text"
    placeholder="Enter package Version"
    value={packagesVersion}
    onChange={(e) => setPackagesVersion(e.target.value)}
  /></div>
  <div><button onClick={handleGetPackages}  style={{ backgroundColor: '#007ea7', color: '#ffffff' }}>Get Packages</button></div>
</div>

{packageResults.length > 0 && (
  <div>
    <h2>Package Results:</h2>
    <ul>
      {packageResults.map((pkg, index) => (
        <li key={index}>
          {pkg.Name} (Version: {pkg.Version}, ID: {pkg.ID})
        </li>
      ))}
    </ul>
    { (
      <button onClick={handleGetPackages} style={{ backgroundColor: '#007ea7', color: '#ffffff' }}>Load More</button>
    )}
  </div>
)}

    
      {/* Reset Data Section */}
      <h2>Reset Data</h2>
      <div>
        <button onClick={handleReset} style={{ backgroundColor: '#007ea7', color: '#ffffff' }}>Reset Data</button>
      </div>

        {/* Display All Tracks */}
        <h2>Tracks</h2>
      <div>
        <button onClick={handleTracks} style={{ backgroundColor: '#007ea7', color: '#ffffff' }}>Get Tracks</button>
      </div>
      {trackResult && (
        <div>
          <pre>{JSON.stringify(trackResult, null, 2)}</pre>
        </div>
      )}
    </div>
    

  );
};

export default App;
