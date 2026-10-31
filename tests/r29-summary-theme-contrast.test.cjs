const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync('www/index.html','utf8');

test('R29: las tres métricas de Resumen mantienen reglas explícitas de contraste en ambos temas', () => {
  for (const id of ['cfR25IndependentCollected', 'cfR25IndependentExpenses', 'cfR25IndependentDue']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /\.cfR25IndependentTotals\{[^}]*background:#111920;[^}]*color:#f6f8fa\}/);
  assert.match(html, /\.cfR25IndependentTotals strong\{color:#f6f8fa;/);
  assert.match(html, /body\.lightTheme \.cfR25IndependentTotals\{background:#fff;[^}]*color:#111820\}/);
  assert.match(html, /body\.lightTheme \.cfR25IndependentTotals span\{color:#465563\}/);
  assert.match(html, /body\.lightTheme \.cfR25IndependentTotals strong\{color:#111820\}/);
});
