# CapstoneGods
## Set up Backend
Go to the folder's directory, then 'cd backend' to go to the backend folder.
First, we need to install [Rhubarb Lip-Sync](https://github.com/DanielSWolf/rhubarb-lip-sync/releases). Go to the link and download the correct zip file for your machine (e.g. if on Windows laptop, download Rhubarb-Lip-Sync-1.13.0-Windows.zip). 

Unzip the file, then place the Rhubarb folder in the ***backend/workflows*** folder. Make sure to place it in the right place. Then, rename it from "Rhubarb-Lip-Sync-1.13.0-Windows" to simply "Rhubarb-Lip-Sync-1.13.0".

Create a virtual environment with Python 3.9 and activate it:
```
cd backend
python3.9 -m venv venv

# for MacOS
source venv/bin/activate

# for Windows
venv/Scripts/activate
```

In the virtual environment, install required dependencies:
```
pip install -r requirements.txt
```

**NOTE!** Apart from the requirements already installed, you also need to make sure to install the appropriate versions of torch and torchaudio for your machine and CUDA version; the compatible numpy version to install also depends on these versions. To double check if your torch version is compatible with your CUDA (and it is activated), run:
```
python check_cuda.py
```

To run the backend server:
``` 
python app.py 
```

## Setting up Malay virtual environment
Due to dependency conflicts, you are required to create a second virtual environment in the backend folder to run the mesolitica Malay TTS models.
```
cd backend
python3.9 -m venv venv-malay

# for MacOS
source venv-malay/bin/activate

# for Windows
venv-malay/Scripts/activate
```
**NOTE!** You strictly need to name this virtual environment venv-malay as we are calling the virtual environment directly in the code.

You are also required to install a **separate set of requirements** in this new virtual environment:
```
# with venv-malay activated:
pip install -r malay_requirements.txt
```


## Set up Frontend
On the frontend, first make sure Node.js (v23.7.0) and Next.js (15) installed on your machine.

Then run:
```
npm install
npm install js-cookie tailwindcss react-icons react-spinners @tailwindcss/vite @react-three/fiber @react-three/drei 
```

To run the UI, open a separate terminal window and run:
```
npm run dev
```

The UI should be running on
```
localhost:3000/
```



## Troubleshooting
In the case that XTTS is not working as per normal, and you encounter this error:
```
Flask error: {
    "error": "Weights only load failed. This file can still be loaded, to do so you have two options, \u001b[1mdo those steps only if you trust the source of the checkpoint\u001b[0m. \n\t(1) In PyTorch 2.6, we changed the default value of the weights_only argument in torch.load from False to True. 

    ......
```
You may need to go to your virtual environment (venv)'s folder and look for the following file at this path: ***venv/lib/python/site-packages/TTS/tts/utils/io.py***. You then have to manually force the model to load not in weights only mode:

```
# Look for the chunk of code below:

    is_local = os.path.isdir(path) or os.path.isfile(path)
    if cache and not is_local:
        with fsspec.open(
            f"filecache::{path}",
            filecache={"cache_storage": str(get_user_data_dir("tts_cache"))},
            mode="rb",
        ) as f:
            # Add weights_only=False to this line!
            return torch.load(f, map_location=map_location, weights_only=False, **kwargs)
    else:
        with fsspec.open(path, "rb") as f:
            # This line as well!
            return torch.load(f, map_location=map_location, weights_only=False, **kwargs)
```


Run in case got unicode issue
''chcp 65001''
