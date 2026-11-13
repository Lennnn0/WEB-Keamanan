import { Resend } from 'resend';
import { ENV } from './env';

// Official Resend Client
export const resendClient = new Resend(ENV.RESEND_API_KEY || 're_placeholder_key');

