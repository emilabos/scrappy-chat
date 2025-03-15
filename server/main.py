import math
import random
import json
from typing import List
import asyncio

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.requests import Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from scrambler import scramble_message, download_nltk_resources

app = FastAPI()

templates = Jinja2Templates(directory="./ui/build")

app.mount('/static', StaticFiles(directory=f"./ui/build/static"), 'static')

app.mount("/assets", StaticFiles(directory=f"./ui/build/assets"), name="assets")

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

@app.on_event("startup")
async def startup_event():
    # Download NLTK resources when the server starts
    await download_nltk_resources()
    print("NLTK resources downloaded successfully")

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(user_id: str, websocket: WebSocket):
    insanity_meter: float = 0
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
            data_split = data.split(':', 1) 
            if len(data_split) == 2:
                username = data_split[0]
                message_content = data_split[1]
                
                scrambled_message = await scramble_message(message_content, random.random())
                print(f"Scrambled message: {scrambled_message}")
                data_new = f"{username}:{scrambled_message}"
                
                for user, user_socket in connected_users.items():
                    if user != user_id:
                        try:
                            await user_socket.send_text(data_new)
                        except:
                            pass

                update_chat_history(data_new)
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
    return load_chat_history()

# @app.get("/")
# async def root():
#     return {"message": "Scrappy Chat API is running"}

@app.get("/{rest_of_path:path}")
async def react_app(req: Request, rest_of_path: str):
    return templates.TemplateResponse('index.html', { 'request': req })

@app.get("/assets/{file_path:path}")
def get_asset(file_path: str):
    return FileResponse(f"./ui/build/{file_path}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)