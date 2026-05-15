'use client';

import { useState } from 'react';
import OtpInput from './OtpInput';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Mail, Phone, CheckCircle, Loader2 } from 'lucide-react';

interface VerifyStepProps {
  email: string;
  phone: string;
  onVerified: () => void;
}

type Step = 'send' | 'verify' | 'done';

export default function BookingVerifyStep({ email, phone, onVerified }: VerifyStepProps) {
  const [step, setStep] = useState<Step>('send');
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(!phone); // skip if no phone
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(60);
    const t = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; });
    }, 1000);
  };

  const sendCodes = async () => {
    setSending(true);
    try {
      const sends = [api.post('/api/verify/send', { target: email, type: 'EMAIL' })];
      if (phone) sends.push(api.post('/api/verify/send', { target: phone, type: 'PHONE' }));
      await Promise.all(sends);
      toast.success(`Verification codes sent!`);
      setStep('verify');
      startCountdown();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to send codes';
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const verifyCodes = async () => {
    setVerifying(true);
    setEmailError(false);
    setPhoneError(false);
    try {
      let allGood = true;

      if (!emailVerified) {
        try {
          await api.post('/api/verify/confirm', { target: email, type: 'EMAIL', code: emailCode });
          setEmailVerified(true);
        } catch {
          setEmailError(true);
          allGood = false;
          toast.error('Email verification code is incorrect');
        }
      }

      if (phone && !phoneVerified) {
        try {
          await api.post('/api/verify/confirm', { target: phone, type: 'PHONE', code: phoneCode });
          setPhoneVerified(true);
        } catch {
          setPhoneError(true);
          allGood = false;
          toast.error('Phone verification code is incorrect');
        }
      }

      if (allGood) {
        setStep('done');
        toast.success('Verification complete! 🎉');
        setTimeout(onVerified, 800);
      }
    } finally {
      setVerifying(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <p className="font-semibold text-lg">Verified!</p>
        <p className="text-airbnb-gray text-sm">Taking you to the booking form...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {step === 'send' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Email verification</p>
              <p className="text-sm text-blue-700">We'll send a 6-digit code to <strong>{email}</strong></p>
            </div>
          </div>
          {phone && (
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
              <Phone className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Phone verification</p>
                <p className="text-sm text-green-700">We'll send a code via SMS to <strong>{phone}</strong></p>
              </div>
            </div>
          )}
          <button
            onClick={sendCodes}
            disabled={sending}
            className="btn-primary w-full py-4 flex items-center justify-center gap-2"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {sending ? 'Sending codes...' : 'Send verification codes'}
          </button>
        </div>
      )}

      {step === 'verify' && (
        <div className="space-y-6">
          {/* Email OTP */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {emailVerified
                ? <CheckCircle className="w-5 h-5 text-green-500" />
                : <Mail className="w-5 h-5 text-airbnb-gray" />}
              <p className="font-medium text-sm">Email code — sent to {email}</p>
            </div>
            {!emailVerified && (
              <OtpInput value={emailCode} onChange={setEmailCode} error={emailError} />
            )}
          </div>

          {/* Phone OTP */}
          {phone && !phoneVerified && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-airbnb-gray" />
                <p className="font-medium text-sm">SMS code — sent to {phone}</p>
              </div>
              <OtpInput value={phoneCode} onChange={setPhoneCode} error={phoneError} />
            </div>
          )}

          <button
            onClick={verifyCodes}
            disabled={verifying || (!emailVerified && emailCode.length < 6) || (!!phone && !phoneVerified && phoneCode.length < 6)}
            className="btn-primary w-full py-4 flex items-center justify-center gap-2"
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {verifying ? 'Verifying...' : 'Verify codes'}
          </button>

          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-sm text-airbnb-gray">Resend in {countdown}s</p>
            ) : (
              <button onClick={sendCodes} className="text-sm text-airbnb-pink hover:underline">
                Resend codes
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
