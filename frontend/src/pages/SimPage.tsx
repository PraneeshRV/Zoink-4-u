import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { triggersAPI } from '../lib/api';
import Icon from '../components/Icon';

const ZONES = [
  { label: 'T. Nagar, Chennai', value: '8829e24dfffffff', city: 'Chennai' },
  { label: 'Madhapur, Hyderabad', value: '8831a91dfffffff', city: 'Hyderabad' },
  { label: 'Koramangala, Bengaluru', value: '883148c7fffffff', city: 'Bengaluru' },
  { label: 'Andheri, Mumbai', value: '88292e3dfffffff', city: 'Mumbai' },
  { label: 'Ernakulam, Kochi', value: '88316899fffffff', city: 'Kochi' },
  { label: 'Connaught Place, Delhi', value: '88395cd7fffffff', city: 'Delhi' },
];

type EventType = { value: string; label: string; icon: 'rain' | 'aqi' | 'fire' | 'traffic' | 'shield' | 'wifi-off'; color: string };
const EVENTS: EventType[] = [
  { value: 'T1_HEAVY_RAIN', label: 'Heavy Rainfall', icon: 'rain', color: 'var(--info)' },
  { value: 'T3_SEVERE_AQI', label: 'Severe AQI', icon: 'aqi', color: 'var(--purple)' },
  { value: 'T4_EXTREME_HEAT', label: 'Extreme Heat', icon: 'fire', color: 'var(--danger)' },
  { value: 'T9_GRIDLOCK', label: 'Traffic Gridlock', icon: 'traffic', color: 'var(--warning)' },
  { value: 'T10_CURFEW', label: 'Curfew / Bandh', icon: 'shield', color: 'var(--text-secondary)' },
  { value: 'T17_PLATFORM_CRASH', label: 'Platform Crash', icon: 'wifi-off', color: 'var(--accent-400)' },
];

const PIPELINE: { label: string; sub: string; icon: 'map' | 'shield' | 'activity' | 'bar-chart' | 'wallet' }[] = [
  { label: 'Event registered in zone', sub: 'H3 hexagon indexed', icon: 'map' },
  { label: 'Policies scanned', sub: 'Active riders in area identified', icon: 'shield' },
  { label: 'Fraud validation', sub: '5-layer ML pipeline executed', icon: 'activity' },
  { label: 'SRS score calculated', sub: 'Severity × duration × zone weighted', icon: 'bar-chart' },
  { label: 'UPI payouts initiated', sub: 'Razorpay sandbox transfers queued', icon: 'wallet' },
];

const SRS_BANDS = [
  { range: '1 – 4', label: 'Minor disruption', pct: '60%', color: 'var(--info)' },
  { range: '5 – 7', label: 'Standard disruption', pct: '80%', color: 'var(--warning)' },
  { range: '8 – 10', label: 'Severe — full stop', pct: '100%', color: 'var(--danger)' },
];

export default function SimPage() {
  const [eventType, setEventType] = useState('T1_HEAVY_RAIN');
  const [zone, setZone] = useState(ZONES[0].value);
  const [severity, setSeverity] = useState(7);
  const [duration, setDuration] = useState(4);
  const [running, setRunning] = useState(false);
  const [completedStep, setCompletedStep] = useState(-1);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'run' | 'how'>('live');

  // Live State
  const [loadingLive, setLoadingLive] = useState(false);
  const [liveData, setLiveData] = useState<any>(null);
  const [liveProgress, setLiveProgress] = useState(0);

  const selectedEvent = EVENTS.find(e => e.value === eventType)!;
  const selectedZone = ZONES.find(z => z.value === zone)!;
  const srsBand = severity >= 8 ? SRS_BANDS[2] : severity >= 5 ? SRS_BANDS[1] : SRS_BANDS[0];

  const handleRun = async (overrideSeverity?: number, overrideEvent?: string) => {
    setRunning(true);
    setCompletedStep(-1);
    setResult(null);
    const finalSeverity = overrideSeverity !== undefined ? Math.round(overrideSeverity) : severity;
    const finalEvent = overrideEvent || eventType;

    try {
      const res = await triggersAPI.simulate({
        event_type: finalEvent,
        zone_h3: zone,
        city: selectedZone.city,
        severity: finalSeverity || 1,
        duration_hours: duration,
      });
      toast.success('Disruption simulated');

      for (let i = 0; i < PIPELINE.length; i++) {
        await new Promise(r => setTimeout(r, 600));
        setCompletedStep(i);
      }

      await new Promise(r => setTimeout(r, 400));
      const pr = res.data?.pipeline_result || {};
      setResult({
        claimsCreated: pr.claims_created || 0,
        ridersPaid: pr.claims_approved || 0,
        totalPayout: pr.total_payout || 0,
        avgPayout: pr.avg_payout || 0,
        fraudFlagged: pr.claims_fraud_flagged || 0,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Simulation failed');
      setRunning(false);
    }
  };

  const loadLiveConditions = async () => {
    setLoadingLive(true);
    setLiveData(null);
    setLiveProgress(0);
    try {
      // Fake progress for visual coolness
      const fetchStart = Date.now();
      const interval = setInterval(() => {
        setLiveProgress(p => p >= 90 ? 90 : p + 5);
      }, 50);
      
      const res = await triggersAPI.getCurrentConditions(zone, selectedZone.city);
      const elapsed = Date.now() - fetchStart;
      if (elapsed < 1500) await new Promise(r => setTimeout(r, 1500 - elapsed));
      
      clearInterval(interval);
      setLiveProgress(100);
      setLiveData(res.data);
    } catch (e: any) {
      toast.error("Failed to load APIs");
    } finally {
      setTimeout(() => setLoadingLive(false), 300);
    }
  };

  const handleReset = () => {
    setRunning(false);
    setCompletedStep(-1);
    setResult(null);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Simulation</h1>
        <p className="page-subtitle">Trigger disruptions and watch the auto-claim pipeline</p>
      </div>

      <div className="page-content">
        {/* Tabs */}
        <div className="pill-tabs">
          <button className={`pill-tab ${activeTab === 'live' ? 'active' : ''}`} onClick={() => setActiveTab('live')}>
            <Icon name="activity" size={14} style={{ marginRight: 6 }} /> Live Engine
          </button>
          <button className={`pill-tab ${activeTab === 'run' ? 'active' : ''}`} onClick={() => setActiveTab('run')}>
            Manual Sim
          </button>
          <button className={`pill-tab ${activeTab === 'how' ? 'active' : ''}`} onClick={() => setActiveTab('how')}>
            How It Works
          </button>
        </div>

        {activeTab === 'live' && (
           <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
             <div className="card">
               <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 12 }}>Target Zone</div>
               <div className="input-group" style={{ marginBottom: 16 }}>
                 <select className="input-field" value={zone} onChange={e => {setZone(e.target.value); setLiveData(null);}}>
                   {ZONES.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
                 </select>
               </div>
               
               <button onClick={loadLiveConditions} disabled={loadingLive || running} className="btn btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                 {loadingLive ? `Fetching satellite & sensor data ${liveProgress}%...` : "Run Real-time Engine Radar"}
               </button>
             </div>

             <AnimatePresence>
               {liveData && !loadingLive && (
                 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ background: 'var(--bg-raised)', padding: '16px', borderRadius: 10, marginBottom: 16, border: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div className="text-secondary text-sm">Calculated Risk Score (SRS)</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: liveData.overall_risk_score > 7 ? 'var(--danger)' : liveData.overall_risk_score > 4 ? 'var(--warning)' : 'var(--success)' }}>
                          {liveData.overall_risk_score.toFixed(1)} <span style={{ fontSize: '1rem', color: 'var(--text-hint)'}}>/ 10</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="text-secondary text-sm">Active Auto-triggers</div>
                        {liveData.active_triggers.length > 0 ? (
                          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', justifyContent: 'flex-end'}}>
                            {liveData.active_triggers.map((t: string) => (
                              <span key={t} style={{ padding: '4px 8px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: 'var(--danger)', color: 'white' }}>{t}</span>
                            ))}
                          </div>
                        ) : (
                           <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--success)', marginTop: 4}}>None</div>
                        )}
                      </div>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 16 }}>20-Parameter Risk Matrix</div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                      {Object.entries(liveData.parameters_20).map(([key, value], idx) => (
                         <motion.div 
                           initial={{ opacity: 0, y: 10 }} 
                           animate={{ opacity: 1, y: 0 }} 
                           transition={{ delay: idx * 0.03 }}
                           key={key} 
                           style={{ 
                             background: 'var(--bg-overlay)', padding: '10px 14px', borderRadius: 8, 
                             border: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden' 
                           }}
                         >
                           <div style={{ fontSize: '0.7rem', color: 'var(--text-hint)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>{key.replace(/_/g, ' ')}</div>
                           <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{String(value)}</div>
                           {/* Decorative pulsing dot based on severity approximations */}
                           { (key.includes('rainfall') && Number(value) > 20) || (key.includes('aqi') && Number(value) > 200) || (key.includes('congestion') && Number(value) > 4) ? (
                              <motion.div
                                animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                style={{ position: 'absolute', top: 12, right: 12, width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)' }}
                              />
                           ) : (
                              <div style={{ position: 'absolute', top: 12, right: 12, width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', opacity: 0.5 }} />
                           )}
                         </motion.div>
                      ))}
                    </div>

                    <div style={{ marginTop: 24 }}>
                      <button className="btn btn-primary" style={{ width: '100%', gap: 8, background: liveData.overall_risk_score > 5 ? 'var(--danger)' : 'var(--accent-600)' }} onClick={() => handleRun(liveData.overall_risk_score, liveData.active_triggers[0] || 'T1_HEAVY_RAIN')} disabled={running || liveData.overall_risk_score <= 1}>
                        <Icon name="zap" size={16} /> 
                        { liveData.overall_risk_score > 1 ? `Execute Automated Payout Pipeline with SRS ${liveData.overall_risk_score}` : "Conditions are stable. No Payout needed." }
                      </button>
                    </div>

                 </motion.div>
               )}
             </AnimatePresence>
           </motion.div>
        )}

        {activeTab === 'how' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {/* Explain parametric insurance */}
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 12 }}>
                What is Parametric Insurance?
              </div>
              <p className="text-secondary text-sm" style={{ lineHeight: 1.7 }}>
                Traditional insurance requires you to file a claim and wait. Parametric insurance pays out
                <strong style={{ color: 'var(--text-primary)' }}> automatically</strong> when a predefined
                trigger condition is met — no paperwork, no adjuster, no waiting.
              </p>
              <p className="text-secondary text-sm" style={{ lineHeight: 1.7, marginTop: 8 }}>
                Zoink-4-u measures real-world disruptions in your delivery zone using live weather, AQI,
                traffic, and platform signals. When conditions cross a threshold, your payout fires instantly.
              </p>
            </div>

            {/* Pipeline steps */}
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 16 }}>
                Auto-Claim Pipeline
              </div>
              {PIPELINE.map((step, i) => (
                <div key={step.label} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  paddingBottom: i < PIPELINE.length - 1 ? 18 : 0,
                  position: 'relative',
                }}>
                  {i < PIPELINE.length - 1 && (
                    <div style={{
                      position: 'absolute', left: 16, top: 34, bottom: 0, width: 1,
                      background: 'var(--border-default)',
                    }} />
                  )}
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--accent-soft)',
                    border: '1px solid rgba(92,124,250,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1,
                  }}>
                    <Icon name={step.icon} size={15} style={{ color: 'var(--accent-400)' }} />
                  </div>
                  <div style={{ paddingTop: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{step.label}</div>
                    <div className="text-xs text-secondary" style={{ marginTop: 2 }}>{step.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* SRS model */}
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 14 }}>
                Severity-Response Score (SRS)
              </div>
              {SRS_BANDS.map(b => (
                <div key={b.range} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '10px 0',
                  borderBottom: b.range === '8 – 10' ? 'none' : '1px solid var(--border-subtle)',
                }}>
                  <div style={{
                    width: 44, flexShrink: 0, textAlign: 'center',
                    fontFamily: 'JetBrains Mono, monospace', fontWeight: 800,
                    fontSize: '1rem', color: b.color,
                  }}>{b.pct}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>SRS {b.range}</div>
                    <div className="text-xs text-secondary">{b.label}</div>
                  </div>
                </div>
              ))}
              <div className="info-box" style={{ marginTop: 12 }}>
                <Icon name="info" size={14} style={{ color: 'var(--accent-400)', marginTop: 1, flexShrink: 0 }} />
                <span className="text-xs">Dinner rush (7–10 PM) triggers get an extra <strong>+20% surge bonus</strong></span>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'run' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Event picker */}
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 12 }}>Event Type</div>
              <div className="grid-2" style={{ gap: 8 }}>
                {EVENTS.map(ev => (
                  <button
                    key={ev.value}
                    onClick={() => setEventType(ev.value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                      border: '1px solid',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                      ...(eventType === ev.value
                        ? { background: ev.color + '15', borderColor: ev.color + '60', color: ev.color }
                        : { background: 'var(--bg-raised)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }
                      ),
                    }}
                  >
                    <Icon name={ev.icon} size={16} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{ev.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Zone */}
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 12 }}>Target Zone</div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <select className="input-field" value={zone} onChange={e => setZone(e.target.value)}>
                  {ZONES.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
                </select>
              </div>
            </div>

            {/* Sliders */}
            <div className="card">
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label className="stat-label">Severity</label>
                  <span className="font-mono font-bold" style={{ color: srsBand.color, fontSize: '0.95rem' }}>
                    {severity}/10 — {srsBand.pct} payout
                  </span>
                </div>
                <input
                  type="range" min={1} max={10} value={severity}
                  onChange={e => setSeverity(Number(e.target.value))}
                  style={{ width: '100%', accentColor: srsBand.color, cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between' }} className="text-xs text-hint">
                  <span>Minor</span><span>Catastrophic</span>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label className="stat-label">Duration</label>
                  <span className="font-mono font-bold" style={{ fontSize: '0.95rem' }}>
                    {duration}h
                  </span>
                </div>
                <input
                  type="range" min={1} max={12} value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-600)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between' }} className="text-xs text-hint">
                  <span>1 hr</span><span>12 hrs</span>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="card-accent" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: selectedEvent.color + '20',
                border: `1px solid ${selectedEvent.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={selectedEvent.icon} size={18} style={{ color: selectedEvent.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selectedEvent.label}</div>
                <div className="text-xs text-secondary">
                  {selectedZone.label} · Severity {severity}/10 · {duration}h · {srsBand.pct} payout band
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => handleRun()}
              disabled={running}
              style={{ gap: 10 }}
            >
              {running
                ? <><span className="spinner" /> Running pipeline…</>
                : <><Icon name="zap" size={17} /> Fire Disruption</>
              }
            </button>
            
          </motion.div>
        )}

        {/* Pipeline steps (show across run and live if executing) */}
        {(running || result) && (
          <div className="card" style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 16 }}>Pipeline Execution</div>
            {PIPELINE.map((step, i) => {
              const isDone = completedStep >= i;
              const isActive = running && completedStep === i - 1;
              return (
                <div key={step.label} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  paddingBottom: i < PIPELINE.length - 1 ? 18 : 0,
                  position: 'relative',
                }}>
                  {i < PIPELINE.length - 1 && (
                    <div style={{
                      position: 'absolute', left: 16, top: 34, bottom: 0, width: 1,
                      background: isDone ? 'var(--accent-600)' : 'var(--border-default)',
                      transition: 'background 0.4s ease',
                    }} />
                  )}
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1, transition: 'all 0.3s ease',
                    background: isDone ? 'var(--accent-600)' : isActive ? 'var(--bg-overlay)' : 'var(--bg-raised)',
                    border: isDone ? '2px solid var(--accent-600)' : '2px solid var(--border-default)',
                  }}>
                    {isDone
                      ? <Icon name="check" size={14} style={{ color: '#fff' }} />
                      : isActive
                      ? <span className="spinner" style={{ width: 13, height: 13, borderWidth: 2, borderTopColor: 'var(--accent-400)' }} />
                      : <Icon name={step.icon} size={14} style={{ color: 'var(--text-hint)' }} />
                    }
                  </div>
                  <div style={{ paddingTop: 5 }}>
                    <div style={{
                      fontWeight: isDone ? 600 : 400, fontSize: '0.9rem',
                      color: isDone ? 'var(--text-primary)' : 'var(--text-secondary)',
                      transition: 'color 0.3s ease',
                    }}>{step.label}</div>
                    <div className="text-xs text-hint" style={{ marginTop: 1 }}>{step.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              style={{ marginTop: 16 }}
            >
              <div className="card" style={{
                border: '1px solid rgba(81,207,102,0.25)',
                background: 'rgba(81,207,102,0.04)',
                marginBottom: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--success-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name="check" size={14} style={{ color: 'var(--success)' }} />
                  </div>
                  <div style={{ fontWeight: 800 }}>Pipeline Complete</div>
                </div>

                <div className="grid-2" style={{ gap: 14 }}>
                  <div className="stat-cell">
                    <div className="stat-label">Claims Created</div>
                    <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800 }}>{result.claimsCreated}</div>
                  </div>
                  <div className="stat-cell">
                    <div className="stat-label">Riders Paid</div>
                    <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>{result.ridersPaid}</div>
                  </div>
                  <div className="stat-cell">
                    <div className="stat-label">Total Payout</div>
                    <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>
                      ₹{result.totalPayout.toFixed(0)}
                    </div>
                  </div>
                  <div className="stat-cell">
                    <div className="stat-label">Avg per Rider</div>
                    <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800 }}>₹{result.avgPayout.toFixed(0)}</div>
                  </div>
                </div>

                {result.fraudFlagged > 0 && (
                  <div className="info-box" style={{
                    marginTop: 14,
                    background: 'var(--warning-soft)', borderColor: 'rgba(252,196,25,0.25)',
                  }}>
                    <Icon name="alert" size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                    <span className="text-xs">
                      <strong>{result.fraudFlagged}</strong> claim{result.fraudFlagged > 1 ? 's' : ''} flagged for manual review
                    </span>
                  </div>
                )}
              </div>

              <button className="btn btn-secondary" onClick={handleReset}>
                Reset
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
