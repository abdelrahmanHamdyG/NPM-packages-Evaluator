# Package Registrar CLI Tool

This is a CLI tool for evaluating the trustworthiness of Node.js modules based on several metrics such as Ramp-Up Time, Correctness, Bus Factor, Responsive Maintainers, and License Compatibility.

## Installation

### Prerequisites
- Node.js (v14 or later)
- GitHub Token (for accessing GitHub API)

### Clone the Repository
```bash
git clone https://github.com/abdelrahmanHamdyG/NPM-packages-Evaluator.git
cd package-registrar
```

### Install Dependencies
``` bash
$ ./run install

```

### Rank Modules
#### your file should contain the packages URLs
``` bash
$ ./run <absolute_path_to_file>
```

### Sample Output
``` bash
{"URL":"https://github.com/nullivex/nodist", "NetScore":0.9, "NetScore_Latency": 0.033, "RampUp":0.5, "RampUp_Latency": 0.023, "Correctness":0.7, "Correctness_Latency":0.005, "BusFactor":0.3, "BusFactor_Latency": 0.002, "ResponsiveMaintainer":0.4, "ResponsiveMaintainer_Latency": 0.002, "License":1, "License_Latency": 0.001}
{"URL":"https://www.npmjs.com/package/browserify", "NetScore":0.76, "NetScore_Latency": 0.099, "RampUp":0.5, "RampUp_Latency": 0.003, "Correctness":0.7, "Correctness_Latency":0.019, "BusFactor":0.3, "BusFactor_Latency": 0.024, "ResponsiveMaintainer":0.6, "ResponsiveMaintainer_Latency": 0.042, "License":1, "License_Latency": 0.011}
```



