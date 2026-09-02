/**
 * Barrel re-export for validation utilities.
 *
 * Individual modules:
 *   @/utils/emailValidation    — validateEmail
 *   @/utils/passwordValidation — validatePassword
 *
 * This file exists so that existing imports from '@/utils/validation'
 * continue to work without modification.
 */
export { validateEmail } from './emailValidation';
export { validatePassword } from './passwordValidation';
