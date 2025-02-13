# Chatbot Evaluation Dashboard Setup  

This guide will walk you through setting up and running both the backend and frontend for the Chatbot Evaluation Dashboard.  

---

## Prerequisites  

Ensure you have the following installed:  

### 1️⃣ **Node.js & npm**  
- **Mac**: Install using Homebrew  
  ```sh
  brew install node
  ```
- **Windows**: Download and install from [Node.js official site](https://nodejs.org/)  
  OR install via Chocolatey:  
  ```sh
  choco install nodejs
  ```
- Verify installation:  
  ```sh
  node -v
  npm -v
  ```

### 2️⃣ **Python & Virtual Environment**  
- **Mac/Linux**: Ensure Python is installed (`python3 --version`)  
- **Windows**: Install Python from [Python.org](https://www.python.org/downloads/)  

---

## 1️⃣ Setup & Installation  

1. **Navigate to your project root directory**  
   ```sh
   cd chatbot-eval
   ```

2. **Create a virtual environment (Python)**  
   - **Mac/Linux**  
     ```sh
     python3 -m venv chatbot_eval
     source chatbot_eval/bin/activate
     ```
   - **Windows (PowerShell)**  
     ```sh
     python -m venv chatbot_eval
     chatbot_eval\Scripts\activate
     ```

3. **Installing PyTorch**
  Install a compatible version of PyTorch based on your CUDA version. For example, if using CUDA 12.6, this version may be compatible:

pip install torch==2.1.0+cu121 --index-url https://download.pytorch.org/whl/cu121 
You can verify that PyTorch is using CUDA by running:

python check_cuda.py


3. **Install Python dependencies**  
   ```sh
   pip install -r requirements.txt
   ```

4. **Install npm dependencies**  
   ```sh
   npm install
   npm install axios
   ```

5. **Create a React App (if not already created)**  
   ```sh
   npx create-react-app chatbot_eval
   ```

---

## 2️⃣ Running the Application  

### Start the Backend Server  
```sh
node server.js
```

### Start the Frontend  
Open a new terminal and run:  
```sh
npm start
```

The React app should now be running on `http://localhost:3000`. 🚀  

