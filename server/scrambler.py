import random
import asyncio
import nltk  # type: ignore
from nltk.corpus import stopwords, wordnet  # type: ignore
from typing import List

import json
import random
from mistralai import Mistral
import time
import os
from dotenv import load_dotenv

load_dotenv()

mistral = Mistral(os.getenv("MISTRAL_API_KEY"))


async def download_nltk_resources():
    await asyncio.gather(
        asyncio.to_thread(nltk.download, 'stopwords'),
        asyncio.to_thread(nltk.download, 'wordnet'),
        asyncio.to_thread(nltk.download, 'punkt_tab'),
        asyncio.to_thread(nltk.download, 'averaged_perceptron_tagger_eng'),
        asyncio.to_thread(nltk.download, 'universal_tagset')
    )


class Word:
    def __init__(self, word, marked, tag, position):
        self.word = word
        self.marked = marked
        self.tag = tag
        self.position : int = position
    def __repr__(self):
        return f"{self.word}: {self.tag}, Marked? {self.marked}, position: {self.position}"

    def __str__(self):
        return self.word
    
async def convert_message_to_emoji(message: str)->str:
    try:
        prompt = f"Convert this text message into a sequence of emojis, which represents the sentence. The output should only be the sequence of emojis, with no words. If there is a problem, simply fill the sentence with random emoticons, no text.  Example: The hiker went parachuting -> 🗻🧍‍♂️🪂. Message: {message}"

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

        return res.choices[0].message.content
    except Exception as e:
        print(f"Error in emoji conversion: {e}")
        return message  # Fallback to original message if API fails


async def mark_words(pos_tagged_words: list, silliness: float) -> list:
    marked_words: list = []
    i = 0
    for word, tag in pos_tagged_words:
        item = Word(word, False, tag, i)
        if silliness > 0.1:
            if tag == "VERB":
                item.marked = True
            if tag == "NOUN":
                item.marked = True
        if silliness > 0.4:
            if tag == "ADJ":
                item.marked = True
            elif tag == "ADV":
                item.marked = True
        if silliness > 0.5:
            if tag == "PUNCT":
                item.marked = True
        marked_words.append(item)
        i+=1
    return marked_words


def universal_to_wn_pos(pos):
    dict = {
        "ADJ": wordnet.ADJ,
        "ADV": wordnet.ADV,
        "NOUN": wordnet.NOUN,
        "VERB": wordnet.VERB,
    }
    return dict[pos] if pos in dict else None


async def get_synonym(word, pos):
    wn_pos = universal_to_wn_pos(pos)
    if not wn_pos:
        return word
    
    synonyms = await asyncio.to_thread(get_synonyms_sync, word, wn_pos)

    if synonyms:
        return random.choice(synonyms)
    else:
        return word

def get_synonyms_sync(word, wn_pos):
    synonyms = []
    for syn in wordnet.synsets(word.word if isinstance(word, Word) else word, wn_pos):
        for lemma in syn.lemmas():
            synonyms.append(lemma.name())
    return synonyms

async def process_marked_word(word: Word):
    new_word = await get_synonym(word.word, word.tag)
    return Word(new_word, word.marked, word.tag, word.position)

async def replace_synonyms(marked_words: List[Word], silliness: float) -> List[Word]:
    tasks = []
    # Create a list to hold our results, initialized with None
    result : List[Word] = [Word("null", False, "NONE", 0)] * len(marked_words)
    
    # Create tasks for processing marked words
    for word in marked_words:
        if word.tag in ["ADJ", "ADV", "NOUN", "VERB"] and word.marked:
            # Start task but store it with its position
            task = asyncio.create_task(process_marked_word(word))
            tasks.append((task, word.position))
        else:
            # For unmarked words, just place them directly in the result
            result[word.position] = word
    
    # Wait for all tasks to complete
    if tasks:
        for task, position in tasks:
            processed_word = await task
            print(f"processed word: {processed_word} at position: {position}")
            result[position] = processed_word
    
    # Filter out any None values (shouldn't happen, but just in case)
    return result

async def replace_punctuation(marked_words: List[Word], silliness: float) -> list:
    replaced_words: list = []
    for word in marked_words:
        if word.tag == ".":
            replaced_words.append(Word(random.choice(['?', '.', '!']), word.marked, word.tag, word.position))
        elif word.word == ",":
            replaced_words.append(Word(random.choice(['?', '.', '!', '-', '...']), word.marked, word.tag, word.position))
        else:
            replaced_words.append(word)
    return replaced_words

async def scramble_message(text: str, silliness: float) -> str:
    try:
        final = ""
        if random.random() < 0.7:  # 70% chance of synonym replacement, 30% chance of emoji
            words: list = nltk.word_tokenize(text)
            tagged_words = nltk.pos_tag(words, tagset="universal")

            # Phase 1: marking words based on silliness value
            phase1 = await mark_words(tagged_words, silliness)
            print(f"marking phase: {phase1}")
            # Phase 2: replacing marked words with synonyms
            phase2 = await replace_synonyms(phase1, silliness)
            print(f"synonym phase: {phase2}")

            # Phase 3: replacing certain punctuation
            phase3 = await replace_punctuation(phase2, silliness)
            # Sort words by position to maintain original order
            phase3.sort(key=lambda x: x.position)
            print(f"punctuation phase: {phase3}")

            for word in phase3:
                if '_' in word.word:
                    word.word = word.word.replace('_', ' ')
                elif word.tag == '.':
                    final += word.word
                else:
                    final += f" {word.word}"
            
            final = final.strip()
        else:
            final = await convert_message_to_emoji(text)

        return final
    except Exception as e:
        print(f"Error in scramble_message: {e}")
        return text  # Return the original text if anything fails
    


#       // "https://youtu.be/K3AN33pKJfE",
#   // "https://youtu.be/j6a3b9NBCvg",
#   // "https://youtu.be/X7P6WKKFL08",
#   // "https://youtu.be/j5RBYrkvxPo",
#   // "https://youtu.be/-Hn9c_2us8E",
#   // "https://youtu.be/WptdmMFLEnU",
#   // "https://youtu.be/E9icdLBFAvs",
#   // "https://youtu.be/VP4TFvihAxA",