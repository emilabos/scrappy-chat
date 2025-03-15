import json
import random
from mistralai import Mistral
import time
import os

mistral = Mistral(api_key="tOVWJjUbpOycz59WejVifYmm8SwOyFNZ")
message = "You are a great person"
prompt = f"Your task is to this message so that it has a different context. Output the new message and nothing else Example: 'I am a happy person' -> 'I am a sad person', 'Meet me at 9:00pm on buckingham street' -> 'Meet me at 4:00am on loyd street'. Message: {message}"

res = mistral.chat.complete(
    model="mistral-small-latest", 
    messages=[
        {
            "content": prompt,
            "role": "user",
        },
    ], 
    stream=False
)

print(res.choices[0].message.content)