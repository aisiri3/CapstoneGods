        # const workflowResponse = await fetch('http://127.0.0.1:3001/workflow', {
        #   method: 'get',
        #   headers: { 'Content-Type': 'application/json' },
        #   body:
        #   })
        # });
# filterString to use  = {"where" : {"status": "WTP", "currentStep":"PromptEntered" }}
# make API call to api to check for item in WTP status,
# If item in WTP status, get promptId, go into avatar_config to find the promptid and get the avatar config items from that table 
# 
# call the function process_speech(avatar_config); 
# process_speech function, path where function is = C:\Users\EBS10011030\Desktop\MALAY-MAC-final-webapp\backend\api\chat\services.py
# use the below as the placeholder config 
# current_avatar_selections = {
#     "gender": "Male",
#     "persona": "Casual",
#     "language": "English"
# }