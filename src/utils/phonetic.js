// Common English phonetic patterns (IPA approximation)
const PHONETIC_PATTERNS = {
  // Vowels
  'a': 'æ', 'e': 'ɛ', 'i': 'ɪ', 'o': 'ɒ', 'u': 'ʌ',
  'ay': 'eɪ', 'ee': 'iː', 'ie': 'iː', 'ea': 'iː', 'oa': 'əʊ',
  'ai': 'eɪ', 'ei': 'iː', 'ey': 'eɪ', 'ye': 'aɪ',
  'ou': 'aʊ', 'ow': 'aʊ', 'oo': 'uː', 'ue': 'uː', 'ui': 'uː',
  'ar': 'ɑː', 'or': 'ɔː', 'er': 'ə', 'ir': 'ɜː', 'ur': 'ɜː',
  'air': 'eə', 'ear': 'ɪə', 'oor': 'ʊə', 'ure': 'ʊə',
  'igh': 'aɪ', 'ight': 'aɪt', 'tion': 'ʃən', 'sion': 'ʒən',
  'th': 'θ', 'th': 'ð', 'sh': 'ʃ', 'ch': 'tʃ', 'ph': 'f',
  'wh': 'w', 'ck': 'k', 'ng': 'ŋ', 'qu': 'kw',
  'tion': 'ʃən', 'ing': 'ɪŋ', 'ed': 'd', 'es': 'z', 's': 'z',
};

// Common words with their IPA pronunciation
const COMMON_WORDS = {
  'the': 'ðə', 'be': 'biː', 'to': 'tuː', 'of': 'ɒv', 'and': 'ænd',
  'a': 'ə', 'in': 'ɪn', 'that': 'ðæt', 'have': 'hæv', 'i': 'aɪ',
  'it': 'ɪt', 'for': 'fɔː', 'not': 'nɒt', 'on': 'ɒn', 'with': 'wɪð',
  'he': 'hiː', 'as': 'æz', 'you': 'juː', 'do': 'duː', 'at': 'æt',
  'this': 'ðɪs', 'but': 'bʌt', 'his': 'hɪz', 'by': 'baɪ', 'from': 'frɒm',
  'they': 'ðeɪ', 'we': 'wiː', 'say': 'seɪ', 'her': 'hɜː', 'she': 'ʃiː',
  'or': 'ɔː', 'an': 'æn', 'will': 'wɪl', 'my': 'maɪ', 'one': 'wʌn',
  'all': 'ɔːl', 'would': 'wʊd', 'there': 'ðeə', 'their': 'ðeə', 'what': 'wɒt',
  'so': 'səʊ', 'up': 'ʌp', 'out': 'aʊt', 'if': 'ɪf', 'about': 'əˈbaʊt',
  'who': 'huː', 'get': 'ɡɛt', 'which': 'wɪtʃ', 'go': 'ɡəʊ', 'me': 'miː',
  'when': 'wɛn', 'make': 'meɪk', 'can': 'kæn', 'like': 'laɪk', 'time': 'taɪm',
  'no': 'nəʊ', 'just': 'dʒʌst', 'him': 'hɪm', 'know': 'nəʊ', 'take': 'teɪk',
  'people': 'ˈpiːpəl', 'into': 'ˈɪntuː', 'year': 'jɪə', 'your': 'jɔː', 'good': 'ɡʊd',
  'could': 'kʊd', 'them': 'ðɛm', 'see': 'siː', 'other': 'ˈʌðə', 'than': 'ðæn',
  'then': 'ðɛn', 'now': 'naʊ', 'look': 'lʊk', 'only': 'ˈəʊnli', 'come': 'kʌm',
  'its': 'ɪts', 'over': 'ˈəʊvə', 'think': 'θɪŋk', 'also': 'ˈɔːlsəʊ', 'back': 'bæk',
  'after': 'ˈɑːftə', 'use': 'juːz', 'two': 'tuː', 'how': 'haʊ', 'our': 'aʊə',
  'work': 'wɜːk', 'first': 'fɜːst', 'well': 'wɛl', 'way': 'weɪ', 'even': 'ˈiːvən',
  'new': 'njuː', 'want': 'wɒnt', 'because': 'bɪˈkɒz', 'any': 'ˈɛni', 'these': 'ðiːz',
  'give': 'ɡɪv', 'day': 'deɪ', 'most': 'məʊst', 'is': 'ɪz', 'was': 'wɒz',
  'are': 'ɑː', 'been': 'biːn', 'has': 'hæz', 'had': 'hæd', 'were': 'wɜː',
  'happy': 'ˈhæpi', 'love': 'lʌv', 'nice': 'naɪs', 'boy': 'bɔɪ', 'girl': 'ɡɜːl',
  'man': 'mæn', 'woman': 'ˈwʊmən', 'child': 'tʃaɪld', 'house': 'haʊs', 'home': 'həʊm',
  'room': 'ruːm', 'book': 'bʊk', 'school': 'skuːl', 'teacher': 'ˈtiːtʃə', 'student': 'ˈstjuːdənt',
  'friend': 'frɛnd', 'family': 'ˈfæmɪli', 'brother': 'ˈbrʌðə', 'sister': 'ˈsɪstə', 'father': 'ˈfɑːðə',
  'mother': 'ˈmʌðə', 'water': 'ˈwɔːtə', 'food': 'fuːd', 'money': 'ˈmʌni', 'world': 'wɜːld',
  'problem': 'ˈprɒbləm', 'hand': 'hænd', 'part': 'pɑːt', 'place': 'pleɪs', 'case': 'keɪs',
  'week': 'wiːk', 'company': 'ˈkʌmpəni', 'system': 'ˈsɪstəm', 'program': 'ˈprəʊɡræm', 'question': 'ˈkwɛstʃən',
  'number': 'ˈnʌmbə', 'night': 'naɪt', 'point': 'pɔɪnt', 'business': 'ˈbɪznɪs', 'government': 'ˈɡʌvənmənt',
  'start': 'stɑːt', 'today': 'təˈdeɪ', 'head': 'hɛd', 'idea': 'aɪˈdɪə', 'word': 'wɜːd',
  'body': 'ˈbɒdi', 'person': 'ˈpɜːsən', 'level': 'ˈlɛvəl', 'office': 'ˈɒfɪs', 'door': 'dɔː',
  'right': 'raɪt', 'open': 'ˈəʊpən', 'young': 'jʌŋ', 'large': 'lɑːdʒ', 'small': 'smɔːl',
  'big': 'bɪɡ', 'long': 'lɒŋ', 'little': 'ˈlɪtəl', 'great': 'ɡreɪt', 'high': 'haɪ',
  'different': 'ˈdɪfrənt', 'important': 'ɪmˈpɔːtənt', 'same': 'seɪm', 'old': 'əʊld', 'early': 'ˈɜːli',
  'late': 'leɪt', 'free': 'friː', 'busy': 'ˈbɪzi', 'please': 'pliːz', 'thank': 'θæŋk',
  'sorry': 'ˈsɒri', 'hello': 'həˈləʊ', 'goodbye': 'ˌɡʊdˈbaɪ', 'yes': 'jɛs', 'no': 'nəʊ',
  'okay': 'əʊˈkeɪ', 'maybe': 'ˈmeɪbiː', 'perhaps': 'pəˈhæps', 'certainly': 'ˈsɜːtənli', 'definitely': 'ˈdɛfɪnɪtli',
};

/**
 * Get phonetic transcription for an English word
 * @param {string} word - The English word
 * @returns {string} IPA phonetic transcription
 */
export function getPhonetic(word) {
  if (!word) return '';
  
  const lowerWord = word.toLowerCase().trim();
  
  // Check common words first
  if (COMMON_WORDS[lowerWord]) {
    return COMMON_WORDS[lowerWord];
  }
  
  // For compound words, try to split and translate
  if (lowerWord.includes(' ')) {
    return lowerWord.split(' ').map(w => getPhonetic(w)).join(' ');
  }
  
  // Generate phonetic using patterns (simplified)
  let phonetic = '';
  let i = 0;
  
  while (i < lowerWord.length) {
    let matched = false;
    
    // Try to match multi-character patterns first (3 chars)
    for (let len = 3; len >= 1; len--) {
      const pattern = lowerWord.slice(i, i + len);
      if (PHONETIC_PATTERNS[pattern]) {
        phonetic += PHONETIC_PATTERNS[pattern];
        i += len;
        matched = true;
        break;
      }
    }
    
    // If no pattern matched, use the letter itself
    if (!matched) {
      phonetic += lowerWord[i];
      i++;
    }
  }
  
  // Add stress marker for words longer than 2 syllables
  if (phonetic.length > 6) {
    phonetic = 'ˈ' + phonetic;
  }
  
  return phonetic || lowerWord;
}

/**
 * Format phonetic for display with brackets
 * @param {string} word - The English word
 * @returns {string} Formatted phonetic transcription
 */
export function formatPhonetic(word) {
  const phonetic = getPhonetic(word);
  return `/${phonetic}/`;
}

export default { getPhonetic, formatPhonetic };
