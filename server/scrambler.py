import random
import asyncio
import nltk  # type: ignore
from nltk.corpus import stopwords, wordnet  # type: ignore
from typing import List
async def download_nltk_resources():
    await asyncio.gather(
        asyncio.to_thread(nltk.download, 'stopwords'),
        asyncio.to_thread(nltk.download, 'wordnet'),
        asyncio.to_thread(nltk.download, 'punkt'),
        asyncio.to_thread(nltk.download, 'punkt_tab'),
        asyncio.to_thread(nltk.download, 'averaged_perceptron_tagger_eng'),
        asyncio.to_thread(nltk.download, 'universal_tagset')
    )


class Word:
    def __init__(self, word, marked, tag):
        self.word = word
        self.marked = marked
        self.tag = tag

    def __repr__(self):
        return f"{self.word}: {self.tag}, Marked? {self.marked}"

    def __str__(self):
        return self.word


async def mark_words(pos_tagged_words: list, silliness: float) -> list:
    marked_words: list = []
    for word, tag in pos_tagged_words:
        item = Word(word, False, tag)
        if 0.1 < silliness:
            if tag == "VERB":
                item.marked = True
            if tag == "NOUN":
                item.marked = True
        elif 0.4 < silliness:
            if tag == "ADJ":
                item.marked = True
            elif tag == "ADV":
                item.marked = True
        elif silliness > 0.5:
            if tag == "PUNCT":
                item.marked = True
        marked_words.append(item)
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
    for syn in wordnet.synsets(word, wn_pos):
        for lemma in syn.lemmas():
            synonyms.append(lemma.name())
    return synonyms

async def replace_synonyms(marked_words: List[Word], silliness: float) -> list:
    replaced_words: list = []
    replace_tasks = []

    for word in marked_words:
        if word.tag in ["ADJ", "ADV", "NOUN", "VERB"] and word.marked:
            replace_tasks.append(process_marked_word(word))
        else:
            replaced_words.append(word)
    
    processed_words = await asyncio.gather(*replace_tasks)
    replaced_words.extend(processed_words)
    
    replaced_words.sort(key=lambda x: marked_words.index(x) if x in marked_words else 
                        next(i for i, w in enumerate(processed_words) if w.word == x.word))
    
    return replaced_words


async def process_marked_word(word):
    new_word = await get_synonym(word.word, word.tag)
    return Word(new_word, word.marked, word.tag)

async def replace_punctuation(marked_words: List[Word], silliness: float) -> list:
    replaced_words: list = []
    for word in marked_words:
        if word.tag == ".":
            replaced_words.append(Word(random.choice(['?', '.', '!']), word.marked, word.tag))
        elif word == ",":
            replaced_words.append(Word(random.choice(['?', '.', '!', '-', '...']), word.marked, word.tag))
        else:
            replaced_words.append(word)
    return replaced_words


async def scramble_message(text: str, silliness: float) -> str:
    words: list = nltk.word_tokenize(text)
    tagged_words = nltk.pos_tag(words, tagset="universal")

    # Phase 1: marking words based on silliness value
    phase1 = await mark_words(tagged_words, silliness)
    print(phase1)

    # Phase 2: replacing marked words with synonyms
    phase2 = await replace_synonyms(phase1, silliness)
    print(phase2)

    # Phase 3: replacing certain punctuation
    phase3 = await replace_punctuation(phase2, silliness)
    print(phase3)

    final = ""
    for word in phase3:
        if '_' in word.word:
            word.word.replace('_', ' ')
        elif word.tag == '.':
            final += word.word
        else:
            final += f" {word.word}"

    return final