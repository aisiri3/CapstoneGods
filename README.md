# CapstoneGods
## Set up Backend
Go to the folder's directory, then 'cd backend' to go to the backend folder.
First, we need to install [Rhubarb Lip-Sync](https://github.com/DanielSWolf/rhubarb-lip-sync/releases). Go to the link and download the correct zip file for your machine (e.g. if on Windows laptop, download Rhubarb-Lip-Sync-1.13.0-Windows.zip). 

Unzip the file, then place the Rhubarb folder in the backend folder. Then, rename it from "Rhubarb-Lip-Sync-1.13.0-Windows" to simply "Rhubarb-Lip-Sync-1.13.0".

Create a virtual environment with Python 3.9 and activate it:
```
cd backend
python3.9 -m venv venv

# for MacOS
source venv/bin/activate

# for Windows
venv2/Scripts/activate
```

In the virtual environment, install required dependencies:
```
pip install -r requirements.txt
```

To run the backend server:
``` 
python combined_app.py 
```

## Set up Frontend
On the frontend, first make sure Node.js (v23.7.0) and Next.js (15) installed on your machine.

Then run:
```
npm install
npm install tailwindcss @tailwindcss/vite @react-three/fiber @react-three/drei 
```

To run the UI, open a separate terminal window and run:
```
npm run dev
```

The UI should be running on
```
localhost:3000/
```

Run in case got unicode issue
''chcp 65001''
