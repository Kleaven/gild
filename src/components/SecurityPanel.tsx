'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { GILD_FONTS } from '@/components/gild';
import { Shield, Key, Smartphone, Mail, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/auth/client';

export function SecurityPanel() {
  const [isPending, startTransition] = useTransition();
  const [mfaStatus, setMfaStatus] = useState<'none' | 'partial' | 'full'>('none');
  const [enrollmentData, setEnrollmentData] = useState<any>(null);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    checkMfaStatus();
  }, []);

  async function checkMfaStatus() {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (data?.all?.length) {
      const active = data.all.filter(f => f.status === 'verified');
      if (active.length > 0) setMfaStatus('full');
      else setMfaStatus('partial');
    }
  }

  async function startMfaEnrollment() {
    setError(null);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      issuer: 'Gild',
      friendlyName: 'Authenticator App'
    });

    if (error) {
      setError(error.message);
      return;
    }
    setEnrollmentData(data);
  }

  async function verifyMfa() {
    setError(null);
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enrollmentData.id,
      code: otpCode
    });

    if (error) {
      setError(error.message);
      return;
    }
    
    setSuccess('MFA enabled successfully!');
    setEnrollmentData(null);
    setMfaStatus('full');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* 2FA Section */}
      <section style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ padding: 10, borderRadius: 12, background: 'oklch(0.96 0.04 220)', color: 'oklch(0.50 0.15 220)' }}>
            <Smartphone size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Two-Factor Authentication (2FA)</h3>
            <p style={{ fontSize: 13, color: 'oklch(0.55 0.02 250)', margin: 0 }}>Protect your account with an extra layer of security.</p>
          </div>
        </div>

        {mfaStatus === 'full' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: 'oklch(0.98 0.04 150)', border: '1px solid oklch(0.90 0.10 150)' }}>
            <CheckCircle2 size={18} color="oklch(0.50 0.18 150)" />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'oklch(0.35 0.10 150)' }}>2FA is currently enabled</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!enrollmentData ? (
              <button 
                onClick={startMfaEnrollment}
                style={primaryBtnStyle}
              >
                Enable 2FA
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 20, background: 'oklch(0.99 0.002 250)', borderRadius: 16, border: '1px solid oklch(0.95 0.005 250)' }}>
                <p style={{ fontSize: 14, margin: 0 }}>Scan this QR code with your authenticator app (like Google Authenticator or Authy).</p>
                <div style={{ background: '#fff', padding: 12, borderRadius: 12, width: 'fit-content', border: '1px solid #eee' }}>
                  <img src={enrollmentData.totp.qr_code} alt="QR Code" style={{ width: 180, height: 180 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 700 }}>Enter 6-digit code</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <input 
                      type="text" 
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="000000"
                      maxLength={6}
                      style={{ ...inputStyle, width: 120, fontSize: 18, textAlign: 'center', letterSpacing: '0.2em' }}
                    />
                    <button onClick={verifyMfa} style={primaryBtnStyle}>Verify & Enable</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Social Connections */}
      <section style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ padding: 10, borderRadius: 12, background: 'oklch(0.96 0.04 100)', color: 'oklch(0.50 0.15 100)' }}>
            <Shield size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Social Connections</h3>
            <p style={{ fontSize: 13, color: 'oklch(0.55 0.02 250)', margin: 0 }}>Link your social accounts for faster, more secure sign-ins.</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: 12, background: 'oklch(0.99 0.002 250)', border: '1px solid oklch(0.95 0.005 250)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 24, height: 24, background: '#fff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.3h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.8c2.3-2.1 3.6-5.2 3.6-8.7z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.8-3c-1.1.7-2.5 1.2-4.2 1.2-3.2 0-5.9-2.2-6.9-5.2H1.3v3.1C3.3 21.1 7.4 24 12 24z"/><path fill="#FBBC05" d="M5.1 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.3-2.1V6.8H1.3C.5 8.4 0 10.1 0 12s.5 3.6 1.3 5.2l3.8-3.1z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 1.1 15.2 0 12 0 7.4 0 3.3 2.9 1.3 6.8l3.8 3.1c1-3 3.7-5.1 6.9-5.1z"/></svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Google</span>
          </div>
          <button style={{ ...secondaryBtnStyle, fontSize: 12 }}>Connected</button>
        </div>
      </section>

      {/* Password Section */}
      <section style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ padding: 10, borderRadius: 12, background: 'oklch(0.96 0.04 30)', color: 'oklch(0.50 0.15 30)' }}>
            <Key size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Password</h3>
            <p style={{ fontSize: 13, color: 'oklch(0.55 0.02 250)', margin: 0 }}>Change your password to keep your account safe.</p>
          </div>
        </div>
        <button style={secondaryBtnStyle}>Request Password Reset</button>
      </section>

      {error && <div style={{ color: '#c00', fontSize: 13 }}>{error}</div>}
      {success && <div style={{ color: 'oklch(0.50 0.18 150)', fontSize: 13 }}>{success}</div>}
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 10,
  background: '#111',
  color: '#fff',
  border: 'none',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  width: 'fit-content'
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 10,
  background: 'transparent',
  border: '1px solid oklch(0.90 0.01 250)',
  color: '#111',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  width: 'fit-content'
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  border: '1px solid oklch(0.90 0.01 250)',
  borderRadius: 8,
  fontSize: 14,
  outline: 'none',
  background: '#fff',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};
