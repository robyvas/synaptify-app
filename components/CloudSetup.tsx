import React, { useState } from 'react';
import { Sheet, Wifi, WifiOff, Info, FileSpreadsheet, Copy, Check } from 'lucide-react';
import { CloudConfig } from '../types';

interface CloudSetupProps {
  onSave: (config: CloudConfig) => void;
  onOffline: () => void;
}

const CloudSetup: React.FC<CloudSetupProps> = ({ onSave, onOffline }) => {
  const [url, setUrl] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      onSave({ url });
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scriptCode = `function doGet() {
  return ContentService.createTextOutput(JSON.stringify(getData())).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  if (data.action === 'add') {
    if (sheet.getLastRow() === 0) sheet.appendRow(['id', 'title', 'amount', 'categories', 'date']);
    var t = data.transaction;
    sheet.appendRow([t.id, t.title, t.amount, t.categories.join(','), t.date]);
  } else if (data.action === 'delete') {
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] == data.id) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
  }
  return ContentService.createTextOutput(JSON.stringify({success:true})).setMimeType(ContentService.MimeType.JSON);
}

function getData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  return rows.slice(1).map(function(row) {
    return {
      id: row[0],
      title: row[1],
      amount: Number(row[2]),
      categories: row[3] ? row[3].toString().split(',') : [],
      date: row[4]
    };
  });
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl my-8">
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 sticky top-0 backdrop-blur-md z-10 rounded-t-2xl">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-green-900/30 p-2 rounded-lg text-green-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Conectare Google Sheet</h2>
          </div>
          <p className="text-zinc-400 text-sm">
            Salvează datele direct în Google Drive-ul tău. Simplu și accesibil.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {!showGuide ? (
            <div className="space-y-6">
               <button 
                onClick={() => setShowGuide(true)}
                className="w-full text-left p-4 rounded-xl bg-purple-900/10 border border-purple-500/20 hover:bg-purple-900/20 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-purple-400 flex items-center">
                    <Info className="w-5 h-5 mr-2" />
                    Cum obțin Link-ul? (Instrucțiuni)
                  </span>
                  <span className="text-purple-400/50 text-sm group-hover:translate-x-1 transition-transform">Arată pașii &rarr;</span>
                </div>
              </button>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Link Web App (Google Script)</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/..."
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!url}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg shadow-green-900/20 transition-all"
                >
                  <Wifi className="w-4 h-4" />
                  <span>Conectează Sheet-ul</span>
                </button>
              </form>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-zinc-800"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-2 bg-zinc-900 text-sm text-zinc-600">sau</span>
                </div>
              </div>

              <button
                onClick={onOffline}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg transition-colors border border-zinc-700"
              >
                <WifiOff className="w-4 h-4" />
                <span>Continuă Offline</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="prose prose-invert prose-sm max-w-none text-zinc-300 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 font-bold text-xs">1</span>
                  <p>Creează un <a href="https://sheets.new" target="_blank" className="text-green-400 hover:underline">Google Sheet nou</a>.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 font-bold text-xs">2</span>
                  <p>În meniu, mergi la <strong>Extensions</strong> (Extensii) &gt; <strong>Apps Script</strong>.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 font-bold text-xs">3</span>
                  <div className="w-full">
                    <p className="mb-2">Șterge tot codul existent și lipește codul de mai jos:</p>
                    <div className="relative group">
                      <pre className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs font-mono text-zinc-400 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {scriptCode}
                      </pre>
                      <button 
                        onClick={copyCode}
                        className="absolute top-2 right-2 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-md text-zinc-400 hover:text-white transition-colors border border-zinc-700"
                        title="Copiază codul"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 font-bold text-xs">4</span>
                  <p>Apasă butonul albastru <strong>Deploy</strong> &gt; <strong>New deployment</strong>.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 font-bold text-xs">5</span>
                  <p>La "Select type" alege <strong>Web app</strong>.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 font-bold text-xs">6</span>
                  <div className="bg-yellow-900/20 p-3 rounded border border-yellow-700/30">
                    <p className="text-yellow-200/80 font-medium">Foarte important:</p>
                    <ul className="list-disc pl-4 mt-1 text-yellow-100/60">
                      <li>Description: <em>orice nume</em></li>
                      <li>Execute as: <strong>Me</strong> (eu)</li>
                      <li>Who has access: <strong>Anyone</strong> (Oricine)</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 font-bold text-xs">7</span>
                  <p>Apasă <strong>Deploy</strong>, copiază "Web App URL" și întoarce-te aici.</p>
                </div>
              </div>
              
              <button 
                onClick={() => setShowGuide(false)}
                className="w-full mt-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
              >
                Am copiat link-ul, înapoi la configurare
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CloudSetup;