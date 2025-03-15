from fastapi import FastAPI, WebSocket

app = FastAPI()
from typing import List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import json
# Dictionary to store connected WebSocket clients
connected_users = {}
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # can alter with time
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# html = """<!DOCTYPE html>
# <html>
#     <head>
#         <title>Chat</title>
#     </head>
#     <body>
#         <h1>WebSocket Chat</h1>
#         <form action="" onsubmit="sendMessage(event)">
#             <input type="text" id="messageText" autocomplete="off"/>
#             <button>Send</button>
#         </form>
#         <ul id='messages'>
#         </ul>
#         <script>
#             const userId = prompt("Enter your user ID (e.g., user1, user2):"); // Prompt the user for their user ID
#             var ws = new WebSocket(`ws://localhost:8000/ws/${userId}`);
#             ws.onmessage = function(event) {
#                 var messages = document.getElementById('messages')
#                 var message = document.createElement('li')
#                 var content = document.createTextNode(event.data)
#                 message.appendChild(content)
#                 messages.appendChild(message)
#             };
#             function sendMessage(event) {
#                 var input = document.getElementById("messageText")
#                 ws.send(input.value)
#                 input.value = ''
#                 event.preventDefault()
#             }
#         </script>
#     </body>
# </html>
# """
# @app.get("/")
# async def root():
#     return HTMLResponse(html)
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(user_id:str, websocket: WebSocket):
    await websocket.accept()
    connected_users[user_id] = websocket
    try:
        while True:
            data = await websocket.receive_text()
            # Send the received data to the other user
            for user, user_socket in connected_users.items():
                #if (user != user_id):
                await user_socket.send_text(f"{user}: {data}")
    except:
        # If a user disconnects, remove them from the dictionary
        del connected_users[user_id]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)