import random
import nltk
from nltk.corpus import stopwords, wordnet
nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('punkt')
nltk.download('punkt_tab')
class Word:
    def __init__(self, word, marked, tag):
        self.word = word
        self.marked = marked
        self.tag = tag
    def __repr__(self):
        return f"{self.word}: {self.tag}, Marked? {self.marked}"
    def __str__(self):
        return self.word
def mark_words(pos_tagged_words : list, silliness:float) -> list:
    marked_words : list = []
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

def get_synonym(word, pos) :

    wn_pos = universal_to_wn_pos(pos)
    if not wn_pos :
        return word
    synonyms = []
    for syn in wordnet.synsets(word, wn_pos):
        for lemma in syn.lemmas():
            synonyms.append(lemma.name())
    if synonyms:
        return random.choice(synonyms)
    else:
        return word
def replace_synonyms (marked_words:[Word], silliness:float) -> list:
    replaced_words : list = []
    for word in marked_words:
        if word.tag in ["ADJ", "ADV", "NOUN", "VERB"]:
            if word.marked:
                replaced_words.append(Word(get_synonym(word.word, word.tag), word.marked, word.tag))
            else:
                replaced_words.append(word)
        else:
            replaced_words.append(word)

    return replaced_words

def replace_punctuation (marked_words:[Word], silliness:float) -> list:
    replaced_words : list = []
    for word in marked_words:
        if word.tag == "." and word.marked:
            replaced_words.append(Word(random.choice(['?', '.', '!']), word.marked, word.tag))
        elif word == "," and word.marked:
            replaced_words.append(Word(random.choice(['?', '.', '!', '-', '...']), word.marked, word.tag))
        else:
            replaced_words.append(word)
    return replaced_words


def scramble_message(text:str, silliness:float) -> str:
    words : list = nltk.word_tokenize(text)
    tagged_words = nltk.pos_tag(words, tagset="universal")
    new_words = []

    # phase 1 is marking words based on silliness value
    phase1 : [Word] = mark_words(tagged_words, silliness)
    print(phase1)
    # phase 2 is replacing marked words with synomyms
    phase2 : [Word] = replace_synonyms(phase1, silliness)
    # phase 3 is replacing certain punctuation
    print(phase2)
    phase3 : [Word] = replace_punctuation(phase2, silliness)
    print(phase3)
    final_string = ""
    for word in phase3:
        if (word.tag == '.'):
            final_string += word.word
        else:
            final_string += " " + word.word

    return final_string

if __name__ == "__main__":
    while True:
        input_text = input("Input the string to be scrambled: ")
        silly = random.random()
        print(f"Silliness is {silly}")
        print(scramble_message(input_text, silly))