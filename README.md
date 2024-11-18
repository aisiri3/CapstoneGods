# CapstoneGods
## Running on Windows laptop with CUDA
To run Wav2Lip, you first need to install ffmpeg, make sure its path is added to the system environment variables and $PROFILE for powershell.
You also need to install a torch version that is compatible with the CUDA version you're using.

For capstone windows laptop, use:
'''
pip install torch==2.1.0+cu121 --index-url https://download.pytorch.org/whl/cu121
'''

Make sure that both ffmpeg and CUDA are activated from the terminal, otherwise the code won't run.

To run the UI, create a virtual environment with Python 3.9 and activate it.
Go to the capstone folder through the terminal, and install the required dependencies:
```
pip install -r requirements.txt
```

Download the Wav2Lip zip file at https://drive.google.com/file/d/13cwrAED4l-x-Cf2veB4O28I2j_sNxDhk/view?usp=sharing,
extract it and insert it in the project folder.

Then run the UI on a local server with the command:
```
python app.py
```

Wait for it to finish loading. Then open in an incognito tab:
```
http://127.0.0.1:5000/
```

