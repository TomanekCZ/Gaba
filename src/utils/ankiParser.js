import JSZip from 'jszip';
import initSqlJs from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

let sqlPromise;

function getSql() {
    if (!sqlPromise) {
        sqlPromise = initSqlJs({
            // Let Vite resolve the actual emitted wasm asset instead of guessing /assets paths.
            locateFile: () => sqlWasmUrl,
        });
    }

    return sqlPromise;
}

function normalizePlainText(value) {
    return String(value || '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<div[^>]*>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<p[^>]*>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

function extractMeaningParts(value) {
    const chunks = String(value || '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<div[^>]*>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<p[^>]*>/gi, '\n')
        .split('\n');

    const meanings = [];

    for (const chunk of chunks) {
        const plainText = normalizePlainText(chunk)
            .replace(/^\d+\.\s*/, '')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/^[\s-–]+|[\s-–]+$/g, '');

        if (plainText) {
            meanings.push(plainText);
        }
    }

    return meanings;
}

export async function parseApkg(file) {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file);
    
    // Look for the SQLite DB file (collection.anki2 or collection.anki21)
    let dbFile = zipContent.file('collection.anki21') || zipContent.file('collection.anki2');
    if (!dbFile) {
        throw new Error('Nepodařilo se najít databázi uvnitř .apkg souboru.');
    }

    const dbData = await dbFile.async('uint8array');
    
    const SQL = await getSql();

    const db = new SQL.Database(dbData);
    
    try {
        const query = `
            SELECT DISTINCT notes.id, notes.flds, notes.tags
            FROM cards
            JOIN notes ON cards.nid = notes.id
            ORDER BY notes.id
        `;
        
        const result = db.exec(query);
        if (!result.length) {
            return [];
        }

        return result[0].values
            .map((row) => {
                const fields = String(row[1] || '').split('\x1f');
                const tags = String(row[2] || '')
                    .split(/\s+/)
                    .map((tag) => tag.trim())
                    .filter(Boolean);
                const en = normalizePlainText(fields[0]);
                // Slovicka.apkg stores the actual Czech meanings in the 3rd field.
                // The 2nd field is just the count of meanings (e.g. "1", "7").
                const meanings = extractMeaningParts(fields[2] ?? fields[1] ?? '');
                const cz = meanings[0] || normalizePlainText(fields[2] ?? fields[1] ?? '');
                const frequencyTag = tags.find((tag) => /^EN-\d+$/.test(tag)) || null;
                const isPhrase = tags.includes('multi-word') || /\s/.test(en);

                if (!en && !cz) {
                    return null;
                }

                return {
                    id: `anki_${row[0]}`,
                    level: 'Anki',
                    en,
                    cz,
                    meanings,
                    type: isPhrase ? 'Fráze' : 'Slovíčko',
                    tags,
                    frequencyTag,
                    isPhrase,
                    stage: 0,
                    nextReview: null,
                };
            })
            .filter(Boolean);
    } finally {
        db.close();
    }
}
