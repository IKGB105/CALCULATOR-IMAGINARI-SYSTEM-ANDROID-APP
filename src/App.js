import React, { useState, useEffect } from 'react';

// Complex number utilities
const parseComplex = (text) => {
  const t = (text || '').trim().replace(/\s/g, '').replace(/∠/g, 'L');
  
  if (!t) throw new Error('Empty value');
  
  // Phasor form
  if (t.includes('L')) {
    const [r, ang] = t.split('L');
    const radius = parseFloat(r);
    const angle = parseFloat(ang.replace('°', '')) * (Math.PI / 180);
    return { re: radius * Math.cos(angle), im: radius * Math.sin(angle) };
  }
  
  // Normalize i/I to j
  let normalized = t.replace(/i/gi, 'j');
  
  // Convert j5 to 5j
  normalized = normalized.replace(/([+-]?)j(\d+\.?\d*)/g, '$1$2j');
  
  // Convert standalone j
  normalized = normalized.replace(/\+j/g, '+1j').replace(/-j/g, '-1j');
  normalized = normalized.replace(/^j$/, '1j');
  
  // Try parsing
  const match = normalized.match(/^([+-]?\d*\.?\d+)?([+-]?\d*\.?\d*j)?$/);
  if (match) {
    const real = parseFloat(match[1] || '0');
    const imagStr = (match[2] || '0j').replace('j', '');
    const imag = imagStr === '' || imagStr === '+' || imagStr === '-' ? (imagStr === '-' ? -1 : 1) : parseFloat(imagStr);
    return { re: real, im: imag };
  }
  
  throw new Error(`Invalid complex value: ${text}`);
};

const toPolar = (c) => {
  const r = Math.sqrt(c.re * c.re + c.im * c.im);
  const ang = Math.atan2(c.im, c.re) * (180 / Math.PI);
  return `${r.toPrecision(4)} ∠ ${ang.toPrecision(4)}°`;
};

const toRect = (c) => {
  const sign = c.im >= 0 ? '+' : '';
  return `${c.re.toPrecision(4)} ${sign} ${c.im.toPrecision(4)}j`;
};

// Matrix solver using Gaussian elimination
const solveSystem = (A, b) => {
  const n = A.length;
  const aug = A.map((row, i) => [...row.map(c => ({...c})), {...b[i]}]);
  
  // Forward elimination
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      const curr = Math.sqrt(aug[k][i].re ** 2 + aug[k][i].im ** 2);
      const max = Math.sqrt(aug[maxRow][i].re ** 2 + aug[maxRow][i].im ** 2);
      if (curr > max) maxRow = k;
    }
    [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];
    
    const pivot = aug[i][i];
    const pivotMag = pivot.re ** 2 + pivot.im ** 2;
    if (pivotMag < 1e-10) throw new Error('Singular Matrix Error\n\nThis means the system has no unique solution.\n\nTips:\n• Check if rows are linearly dependent\n• Verify matrix has non-zero determinant\n• Make sure equations are independent\n• Try different coefficient values');
    
    for (let k = i + 1; k < n; k++) {
      const factor = complexDiv(aug[k][i], pivot);
      for (let j = i; j <= n; j++) {
        aug[k][j] = complexSub(aug[k][j], complexMul(factor, aug[i][j]));
      }
    }
  }
  
  // Back substitution
  const x = Array(n).fill(null).map(() => ({re: 0, im: 0}));
  for (let i = n - 1; i >= 0; i--) {
    x[i] = {...aug[i][n]};
    for (let j = i + 1; j < n; j++) {
      x[i] = complexSub(x[i], complexMul(aug[i][j], x[j]));
    }
    x[i] = complexDiv(x[i], aug[i][i]);
  }
  
  return x;
};

const complexMul = (a, b) => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re
});

const complexDiv = (a, b) => {
  const denom = b.re * b.re + b.im * b.im;
  return {
    re: (a.re * b.re + a.im * b.im) / denom,
    im: (a.im * b.re - a.re * b.im) / denom
  };
};

const complexSub = (a, b) => ({
  re: a.re - b.re,
  im: a.im - b.im
});

const App = () => {
  const [size, setSize] = useState(3);
  const [themeMode, setThemeMode] = useState('dark'); // 'dark', 'light', 'pink'
  const [matrix, setMatrix] = useState([]);
  const [vector, setVector] = useState([]);
  const [history, setHistory] = useState([]);
  const [savedSystems, setSavedSystems] = useState([]);
  const [activeInput, setActiveInput] = useState(null); // Track focused input
  
  useEffect(() => {
    initializeMatrix(size);
    loadSavedSystems();
    loadThemePreference();
  }, []);
  
  useEffect(() => {
    loadExample();
  }, [size]);
  
  const initializeMatrix = (n) => {
    setMatrix(Array(n).fill(null).map(() => Array(n).fill('1∠0')));
    setVector(Array(n).fill('0'));
  };
  
  const loadExample = () => {
    const examples = {
      2: {
        matrix: [
          ['2+1i', '-1'],
          ['-1', '2']
        ],
        vector: ['1', '1i']
      },
      3: {
        matrix: [
          ['2+1i', '-1', '0'],
          ['-1', '2+0.5i', '-1'],
          ['0', '-1', '2']
        ],
        vector: ['1', '0', '1i']
      },
      4: {
        matrix: [
          ['3', '-1', '0', '0'],
          ['-1', '3', '-1', '0'],
          ['0', '-1', '3', '-1'],
          ['0', '0', '-1', '3']
        ],
        vector: ['1', '0', '0', '1']
      },
      5: {
        matrix: [
          ['4', '-1', '0', '0', '0'],
          ['-1', '4', '-1', '0', '0'],
          ['0', '-1', '4', '-1', '0'],
          ['0', '0', '-1', '4', '-1'],
          ['0', '0', '0', '-1', '4']
        ],
        vector: ['1', '0', '0', '0', '1']
      }
    };
    
    const example = examples[size];
    if (example) {
      setMatrix(example.matrix);
      setVector(example.vector);
    }
  };
  
  const handleSizeChange = (newSize) => {
    const n = Math.min(Math.max(1, parseInt(newSize)), 10);
    setSize(n);
    initializeMatrix(n);
  };
  
  const cycleTheme = () => {
    setThemeMode(prev => {
      const newTheme = prev === 'dark' ? 'light' : prev === 'light' ? 'pink' : 'dark';
      saveThemePreference(newTheme);
      return newTheme;
    });
  };
  
  const loadThemePreference = async () => {
    try {
      const data = await window.storage?.get('themeMode', false);
      if (data?.value) {
        setThemeMode(data.value);
      }
    } catch (err) {
      console.error('Load theme error:', err);
    }
  };
  
  const saveThemePreference = async (theme) => {
    try {
      await window.storage?.set('themeMode', theme, false);
    } catch (err) {
      console.error('Save theme error:', err);
    }
  };
  
  const insertSymbol = (symbol) => {
    if (!activeInput) return;
    
    const { type, i, j } = activeInput;
    if (type === 'matrix') {
      const newMatrix = [...matrix];
      const currentValue = newMatrix[i][j] || '';
      newMatrix[i][j] = currentValue + symbol;
      setMatrix(newMatrix);
    } else if (type === 'vector') {
      const newVector = [...vector];
      const currentValue = newVector[i] || '';
      newVector[i] = currentValue + symbol;
      setVector(newVector);
    }
  };
  
  const deleteLastChar = () => {
    if (!activeInput) return;
    
    const { type, i, j } = activeInput;
    if (type === 'matrix') {
      const newMatrix = [...matrix];
      const currentValue = newMatrix[i][j] || '';
      newMatrix[i][j] = currentValue.slice(0, -1);
      setMatrix(newMatrix);
    } else if (type === 'vector') {
      const newVector = [...vector];
      const currentValue = newVector[i] || '';
      newVector[i] = currentValue.slice(0, -1);
      setVector(newVector);
    }
  };
  
  const clearInput = () => {
    if (!activeInput) return;
    
    const { type, i, j } = activeInput;
    if (type === 'matrix') {
      const newMatrix = [...matrix];
      newMatrix[i][j] = '';
      setMatrix(newMatrix);
    } else if (type === 'vector') {
      const newVector = [...vector];
      newVector[i] = '';
      setVector(newVector);
    }
  };
  
  const updateCell = (i, j, value) => {
    const newMatrix = [...matrix];
    newMatrix[i][j] = value;
    setMatrix(newMatrix);
  };
  
  const updateVector = (i, value) => {
    const newVector = [...vector];
    newVector[i] = value;
    setVector(newVector);
  };
  
  const solve = () => {
    try {
      const A = matrix.map(row => row.map(parseComplex));
      const b = vector.map(parseComplex);
      const x = solveSystem(A, b);
      
      const timestamp = new Date().toLocaleString();
      const result = {
        timestamp,
        size,
        A_polar: matrix.map(row => row.map(v => {
          try { return toPolar(parseComplex(v)); } catch { return v; }
        })),
        b_polar: vector.map(v => {
          try { return toPolar(parseComplex(v)); } catch { return v; }
        }),
        x_polar: x.map(toPolar),
        x_rect: x.map(toRect),
        x
      };
      
      setHistory([result, ...history]);
      saveSystem(result);
    } catch (err) {
      window.alert(`Error: ${err.message}`);
    }
  };
  
  const saveSystem = async (result) => {
    try {
      const saved = [...savedSystems, result];
      setSavedSystems(saved);
      await window.storage?.set('savedSystems', JSON.stringify(saved), false);
    } catch (err) {
      console.error('Save error:', err);
    }
  };
  
  const loadSavedSystems = async () => {
    try {
      const data = await window.storage?.get('savedSystems', false);
      if (data?.value) {
        setSavedSystems(JSON.parse(data.value));
      }
    } catch (err) {
      console.error('Load error:', err);
    }
  };
  
  const loadSavedSystem = (sys) => {
    setSize(sys.size);
    setMatrix(sys.A_polar || matrix);
    setVector(sys.b_polar || vector);
  };
  
  const clearHistory = () => {
    if (window.confirm('Clear all history?')) {
      setHistory([]);
    }
  };
  
  const themes = {
    dark: {
      bg: '#0f0f10',
      card: '#1f1f20',
      text: '#ffffff',
      border: '#333333',
      input: '#191919',
      button: '#3a3a3a',
      buttonHover: '#4a4a4a',
      accent: '#60a5fa'
    },
    light: {
      bg: '#f7f7f8',
      card: '#ffffff',
      text: '#222222',
      border: '#dddddd',
      input: '#ffffff',
      button: '#e0e0e0',
      buttonHover: '#cccccc',
      accent: '#3b82f6'
    },
    pink: {
      bg: '#FFE4F0',
      card: '#FFF0F5',
      text: '#8B4789',
      border: '#FFB6D9',
      input: '#FFFFFF',
      button: '#FF69B4',
      buttonHover: '#FF1493',
      accent: '#FF1493'
    }
  };
  
  const theme = themes[themeMode];
  
  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bg,
      color: theme.text,
      padding: '20px 10px 10px 10px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        marginTop: '10px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 'bold' }}>
            Complex Calc 1.05
          </h1>
          <p style={{ margin: '5px 0', fontSize: 'clamp(11px, 3vw, 14px)', opacity: 0.7 }}>
            Iker Garcia - UAA
          </p>
        </div>
        <button
          onClick={cycleTheme}
          style={{
            padding: '8px 16px',
            background: theme.button,
            color: theme.text,
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px'
          }}
        >
          {themeMode === 'dark' ? '🌙' : themeMode === 'light' ? '☀️' : '💖'} {themeMode === 'dark' ? 'Dark' : themeMode === 'light' ? 'Light' : 'Pink'}
        </button>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr', 
        gap: '15px'
      }}>
        {/* Left Panel */}
        <div style={{
          background: theme.card,
          padding: '15px',
          borderRadius: '12px',
          border: `1px solid ${theme.border}`,
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: theme.input,
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            <strong>How to enter values:</strong><br />
            Complex: 3+4j, -j2, 5, 1.2-3j<br />
            Phasors: 10∠30°, 5∠-90, 3∠0°<br />
            Max size: 10×10
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>Matrix Size: {size}×{size}</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <button
                onClick={() => handleSizeChange(size - 1)}
                disabled={size <= 1}
                style={{
                  padding: '10px 20px',
                  background: size <= 1 ? theme.input : theme.button,
                  color: theme.text,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: size <= 1 ? 'not-allowed' : 'pointer',
                  opacity: size <= 1 ? 0.5 : 1,
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              >
                −
              </button>
              {[2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => handleSizeChange(n)}
                  style={{
                    padding: '10px 15px',
                    background: size === n ? theme.accent : theme.button,
                    color: size === n ? '#ffffff' : theme.text,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: size === n ? 'bold' : 'normal'
                  }}
                >
                  {n}×{n}
                </button>
              ))}
              <button
                onClick={() => handleSizeChange(size + 1)}
                disabled={size >= 10}
                style={{
                  padding: '10px 20px',
                  background: size >= 10 ? theme.input : theme.button,
                  color: theme.text,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: size >= 10 ? 'not-allowed' : 'pointer',
                  opacity: size >= 10 ? 0.5 : 1,
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              >
                +
              </button>
            </div>
            <button
              onClick={loadExample}
              style={{
                padding: '10px 20px',
                background: theme.button,
                color: theme.text,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Example
            </button>
          </div>
          
          {/* Matrix Input */}
          <div style={{ 
            overflowX: 'auto', 
            marginBottom: '20px', 
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            paddingBottom: '10px',
            border: `2px solid ${theme.border}`,
            borderRadius: '8px',
            padding: '10px',
            backgroundColor: theme.input
          }}>
            <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', minWidth: 'min-content' }}>
              <div style={{ display: 'grid', gap: '4px' }}>
                {Array(size).fill(0).map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: '4px' }}>
                    {Array(size).fill(0).map((_, j) => (
                      <input
                        key={j}
                        type="text"
                        inputMode="none"
                        value={matrix[i]?.[j] || ''}
                        onChange={(e) => updateCell(i, j, e.target.value)}
                        onFocus={() => setActiveInput({ type: 'matrix', i, j })}
                        readOnly
                        style={{
                          width: 'clamp(70px, 15vw, 100px)',
                          padding: '8px 4px',
                          background: theme.input,
                          color: theme.text,
                          border: `1px solid ${theme.border}`,
                          borderRadius: '6px',
                          fontSize: 'clamp(12px, 3vw, 14px)',
                          boxSizing: 'border-box'
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
              
              <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', padding: '0 3px', flexShrink: 0 }}>|</div>
              
              <div style={{ display: 'grid', gap: '4px' }}>
                {Array(size).fill(0).map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    inputMode="none"
                    value={vector[i] || ''}
                    onChange={(e) => updateVector(i, e.target.value)}
                    onFocus={() => setActiveInput({ type: 'vector', i })}
                    readOnly
                    style={{
                      width: 'clamp(70px, 15vw, 100px)',
                      padding: '8px 4px',
                      background: theme.input,
                      color: theme.text,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '6px',
                      fontSize: 'clamp(12px, 3vw, 14px)',
                      boxSizing: 'border-box'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <button
            onClick={solve}
            style={{
              width: '100%',
              padding: '15px',
              background: theme.accent,
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Solve System
          </button>
          
          {/* Custom Keyboard */}
          {activeInput && (
            <div style={{ 
              marginTop: '15px',
              background: theme.card,
              border: `2px solid ${theme.accent}`,
              borderRadius: '8px',
              padding: '10px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: theme.accent }}>
                Keyboard Active
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '6px' }}>
                {['7', '8', '9', '∠'].map(key => (
                  <button
                    key={key}
                    onClick={() => insertSymbol(key)}
                    style={{
                      padding: '12px',
                      background: key === '∠' ? theme.accent : theme.button,
                      color: key === '∠' ? '#ffffff' : theme.text,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}
                  >
                    {key}
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '6px' }}>
                {['4', '5', '6', '°'].map(key => (
                  <button
                    key={key}
                    onClick={() => insertSymbol(key)}
                    style={{
                      padding: '12px',
                      background: key === '°' ? theme.accent : theme.button,
                      color: key === '°' ? '#ffffff' : theme.text,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}
                  >
                    {key}
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '6px' }}>
                {['1', '2', '3', 'j'].map(key => (
                  <button
                    key={key}
                    onClick={() => insertSymbol(key)}
                    style={{
                      padding: '12px',
                      background: key === 'j' ? theme.accent : theme.button,
                      color: key === 'j' ? '#ffffff' : theme.text,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}
                  >
                    {key}
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '6px' }}>
                {['.', '0', '+', 'i'].map(key => (
                  <button
                    key={key}
                    onClick={() => insertSymbol(key)}
                    style={{
                      padding: '12px',
                      background: key === 'i' ? theme.accent : theme.button,
                      color: key === 'i' ? '#ffffff' : theme.text,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}
                  >
                    {key}
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                <button
                  onClick={() => insertSymbol('-')}
                  style={{
                    padding: '12px',
                    background: theme.button,
                    color: theme.text,
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}
                >
                  −
                </button>
                <button
                  onClick={deleteLastChar}
                  style={{
                    padding: '12px',
                    background: '#ff6b6b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  ⌫
                </button>
                <button
                  onClick={clearInput}
                  style={{
                    padding: '12px',
                    background: '#ff6b6b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  C
                </button>
              </div>
            </div>
          )}
          
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={loadSavedSystems}
              style={{
                width: '100%',
                padding: '10px',
                background: theme.button,
                color: theme.text,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              Refresh Saved Systems
            </button>
          </div>
        </div>
        
        {/* Right Panel */}
        <div>
          {/* History */}
          <div style={{
            background: theme.card,
            padding: '15px',
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
            marginBottom: '15px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>Solution History</h3>
              <button
                onClick={clearHistory}
                style={{
                  padding: '8px 12px',
                  background: theme.button,
                  color: theme.text,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                Clear
              </button>
            </div>
            
            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              background: theme.input,
              padding: '15px',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'monospace'
            }}>
              {history.length === 0 ? (
                <p style={{ opacity: 0.5, textAlign: 'center' }}>No solutions yet</p>
              ) : (
                history.map((h, idx) => (
                  <div key={idx} style={{
                    marginBottom: '20px',
                    paddingBottom: '20px',
                    borderBottom: `1px solid ${theme.border}`
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                      Solution #{history.length - idx}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '10px' }}>
                      {h.timestamp}
                    </div>
                    {h.x_polar.map((val, i) => (
                      <div key={i} style={{ marginBottom: '5px' }}>
                        x{i+1} = {val} | {h.x_rect[i]}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Saved Systems */}
          <div style={{
            background: theme.card,
            padding: '15px',
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
            boxSizing: 'border-box'
          }}>
            <h3 style={{ marginTop: 0 }}>Saved Systems</h3>
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {savedSystems.length === 0 ? (
                <p style={{ opacity: 0.5, textAlign: 'center' }}>No saved systems</p>
              ) : (
                savedSystems.map((sys, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadSavedSystem(sys)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: theme.button,
                      color: theme.text,
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      marginBottom: '8px',
                      textAlign: 'left'
                    }}
                  >
                    System #{idx + 1} — {sys.timestamp}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;