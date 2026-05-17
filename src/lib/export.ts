import { db } from './db';

export async function exportToCSV() {
  const concepts = await db.concepts.toArray();
  const decks = await db.decks.toArray();
  
  if (concepts.length === 0) {
    alert("No data to export");
    return;
  }

  const deckMap = new Map(decks.map(d => [d.id, d.name]));
  
  // Headers
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += ["ID", "Deck", "Front", "Back", "Options", "State", "Lapses", "Reps", "Stability", "Difficulty", "Next Review", "Created At"].join(",") + "\r\n";
  
  concepts.forEach(c => {
    const row = [
      c.id,
      `"${deckMap.get(c.deckId) || ''}"`,
      `"${(c.question || '').replace(/"/g, '""')}"`,
      `"${(c.explanation || '').replace(/"/g, '""')}"`,
      `"${(c.options || []).join(' | ').replace(/"/g, '""')}"`,
      c.state,
      c.lapses,
      c.reps,
      c.stability,
      c.difficulty,
      c.nextReview || '',
      c.createdAt || ''
    ];
    csvContent += row.join(",") + "\r\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `mcqprep_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportToAnki() {
  // Real Anki sync requires apkg generation or AnkiConnect. 
  // We'll export a TSV that is Anki compatible.
  const concepts = await db.concepts.toArray();
  
  if (concepts.length === 0) {
    alert("No data to export");
    return;
  }

  let tsvContent = "data:text/tab-separated-values;charset=utf-8,";
  
  // Anki basic format: Front \t Back \t Tags
  concepts.forEach(c => {
    // Basic formatting
    const front = (c.question || '').replace(/\n/g, '<br>').replace(/\t/g, ' ');
    
    // Format options as list
    let optionsHtml = '';
    if (c.options && c.options.length > 0) {
       optionsHtml = '<br><br><ul>' + c.options.map(o => `<li>${o}</li>`).join('') + '</ul>';
    }
    
    const back = (c.explanation || '').replace(/\n/g, '<br>').replace(/\t/g, ' ');
    const tags = "mcqprep";
    
    tsvContent += `${front}${optionsHtml}\t${back}\t${tags}\r\n`;
  });

  const encodedUri = encodeURI(tsvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `mcqprep_anki_${new Date().toISOString().split('T')[0]}.txt`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
