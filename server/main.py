import socket

import websockets
from fastapi import FastAPI, WebSocket
app = FastAPI()

connections = {}

@app.get("/")
async def root():
    return {"message": "App root"}
@app.websocket("/ws/{user_id}")
async def chat_endpoint(user_id:str, websocket:WebSocket) -> None:
    # go and accept the connection
    await websocket.accept()

    # assign this id to this web socket
    connections[user_id] = websocket

    try:
        while True:
            # accept messages on the websocket constantly
            data = await websocket.receive_text()
            for user, user_ws in connections.items():
                # only send to the other user
                if user != user_id:
                    await user_ws.send_text(f"{user}: {data}")
                    print(f"Sent websocket message: {user}:{data}")
    except:
        del connections[user_id]
        await websocket.close()

