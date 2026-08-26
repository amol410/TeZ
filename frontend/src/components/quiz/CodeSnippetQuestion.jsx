/**
 * CodeSnippetQuestion — isolated component for "code-mcq" question type.
 * To roll back: remove this file and revert the two lines added in
 * QuizFormPage.jsx and QuizTakePage.jsx that reference it.
 */

import { useEffect, useRef } from 'react';
import hljs from 'highlight.js/lib/core';
import python   from 'highlight.js/lib/languages/python';
import javascript from 'highlight.js/lib/languages/javascript';
import java     from 'highlight.js/lib/languages/java';
import sql      from 'highlight.js/lib/languages/sql';
import cpp      from 'highlight.js/lib/languages/cpp';
import php      from 'highlight.js/lib/languages/php';
import clsx from 'clsx';

hljs.registerLanguage('python', python);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('java', java);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('php', php);

export const CODE_LANGUAGES = [
  { value: 'python',     label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java',       label: 'Java' },
  { value: 'sql',        label: 'SQL' },
  { value: 'cpp',        label: 'C++' },
  { value: 'php',        label: 'PHP' },
];

/* ─── Syntax-highlighted code block ─── */
function CodeBlock({ code, language }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = code || '';
      hljs.highlightElement(ref.current);
    }
  }, [code, language]);

  return (
    <pre className="m-0 p-0 bg-transparent overflow-auto text-xs leading-relaxed">
      <code ref={ref} className={`language-${language} bg-transparent !text-xs`} />
    </pre>
  );
}

/* ─── Quiz-take view: 2×2 grid of selectable code options ─── */
export function CodeSnippetDisplay({ question, selectedIndex, onSelect, disabled }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {question.options.map((code, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => !disabled && onSelect(idx)}
          className={clsx(
            'text-left rounded-xl border-2 overflow-hidden transition-all duration-200',
            selectedIndex === idx
              ? 'border-dolphin-500 shadow-lg shadow-dolphin-900/30'
              : 'border-white/10 hover:border-white/25'
          )}
        >
          {/* Option label */}
          <div className={clsx(
            'px-3 py-1.5 text-xs font-bold flex items-center gap-2',
            selectedIndex === idx ? 'bg-dolphin-600/40 text-dolphin-200' : 'bg-white/5 text-gray-500'
          )}>
            <span className={clsx(
              'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
              selectedIndex === idx ? 'bg-dolphin-500 text-white' : 'bg-white/10 text-gray-500'
            )}>
              {String.fromCharCode(65 + idx)}
            </span>
            {selectedIndex === idx ? 'Selected' : 'Click to select'}
          </div>
          {/* Code */}
          <div className="bg-gray-950 px-4 py-3 min-h-24">
            <CodeBlock code={code} language={question.language || 'javascript'} />
          </div>
        </button>
      ))}
    </div>
  );
}

/* ─── Quiz form: editor for trainer to write 4 code options ─── */
export function CodeSnippetForm({ question, qIdx, updateQuestion }) {
  return (
    <div className="space-y-4">
      {/* Language selector */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Language</label>
        <select
          value={question.language || 'python'}
          onChange={e => updateQuestion(qIdx, 'language', e.target.value)}
          className="select-field text-sm"
        >
          {CODE_LANGUAGES.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      {/* 4 code option editors */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2">
          Code Options — click the circle to mark correct answer
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {question.options.map((code, optIdx) => (
            <div
              key={optIdx}
              className={clsx(
                'rounded-xl border-2 overflow-hidden transition-all',
                question.correctIndex === optIdx
                  ? 'border-green-500/60'
                  : 'border-white/10'
              )}
            >
              {/* Header */}
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border-b border-white/10">
                <button
                  type="button"
                  onClick={() => updateQuestion(qIdx, 'correctIndex', optIdx)}
                  className={clsx(
                    'w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all',
                    question.correctIndex === optIdx
                      ? 'border-green-500 bg-green-500'
                      : 'border-white/20 hover:border-white/40'
                  )}
                />
                <span className="text-xs font-semibold text-gray-400">
                  Option {String.fromCharCode(65 + optIdx)}
                  {question.correctIndex === optIdx && (
                    <span className="ml-2 text-green-400">✓ Correct</span>
                  )}
                </span>
              </div>
              {/* Code textarea */}
              <textarea
                value={code}
                onChange={e => {
                  const opts = [...question.options];
                  opts[optIdx] = e.target.value;
                  updateQuestion(qIdx, 'options', opts);
                }}
                className="w-full bg-gray-950 text-green-300 font-mono text-xs p-3 resize-none outline-none border-none focus:ring-0 min-h-28 placeholder-gray-700"
                placeholder={`# Write code option ${String.fromCharCode(65 + optIdx)} here...`}
                spellCheck={false}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
