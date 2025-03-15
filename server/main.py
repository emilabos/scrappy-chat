from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import json
from typing import List

app = FastAPI()

def load_chat_history():
    try:
        with open("chat_log.json", "r") as file:
            chat_log = json.load(file)
        return chat_log
    except (FileNotFoundError, json.JSONDecodeError):
        with open("chat_log.json", "w") as file:
            json.dump([], file)
        return []

def update_chat_history(message):
    chat_log = load_chat_history()
    chat_log.append(message)
    with open("chat_log.json", "w") as file:
        json.dump(chat_log, file)

connected_users = {}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(user_id: str, websocket: WebSocket):
    await websocket.accept()
    connected_users[user_id] = websocket
    
    join_message = f"SYSTEM:{user_id} has joined the chat"
    for user, user_socket in connected_users.items():
        if user != user_id:
            try:
                await user_socket.send_text(join_message)
            except:
                pass
                
    try:
        while True:
            data = await websocket.receive_text()
            for user, user_socket in connected_users.items():
                if user != user_id:
                    try:
                        await user_socket.send_text(data)
                    except:
                        pass
            
            update_chat_history(data)
    except WebSocketDisconnect:
        leave_message = f"SYSTEM:{user_id} has left the chat"
        if user_id in connected_users:
            del connected_users[user_id]
            
        for user, user_socket in connected_users.items():
            try:
                await user_socket.send_text(leave_message)
            except:
                pass
    except Exception as e:
        print(f"Error in WebSocket: {e}")
        if user_id in connected_users:
            del connected_users[user_id]

@app.get("/chat-log")
async def get_chat_history():
    """API endpoint to retrieve chat history"""
    return load_chat_history()

@app.get("/")
async def root():
    return {"message": "Scrappy Chat API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)