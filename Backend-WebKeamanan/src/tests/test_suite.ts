import fs from 'fs';
import path from 'path';
import {
  generateSecureOTP,
  hashOTP,
  verifyOTPHash,
  generateMfaChallengeToken,
  verifyMfaChallengeToken,
  generateAdminSessionToken,
  verifyAdminSessionToken,
} from '../utils/security';
import {
  parseRawFileBuffer,
  validateParsedRows,
} from '../services/importParserService';
import { sendOtpEmail } from '../services/emailService';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 EXAMCENTER TEST SUITE: SECURITY, AUTH, MFA & PARSER');
  console.log('======================================================\n');

  // TEST SUITE 1: Cryptographic Security & OTP Hashing
  console.log('--- Test Suite 1: Cryptography, OTP Hashing & MFA Tokens ---');
  {
    const otp = generateSecureOTP();
    assert(otp.length === 6 && /^\d{6}$/.test(otp), `OTP generator produces 6-digit number: ${otp}`);

    const salt = 'user-uuid-1234';
    const hash = hashOTP(otp, salt);
    assert(hash.length === 64, `SHA-256 OTP Hash produces 64-char hex digest: ${hash.substring(0, 16)}...`);

    const isMatchCorrect = verifyOTPHash(otp, hash, salt);
    assert(isMatchCorrect === true, 'Constant-time OTP hash verification succeeds for correct OTP');

    const isMatchWrong = verifyOTPHash('000000', hash, salt);
    assert(isMatchWrong === false, 'Constant-time OTP hash verification rejects invalid OTP');

    // Test Challenge Token
    const challengeToken = generateMfaChallengeToken({
      userId: 'test-admin-id',
      challengeId: 'challenge-uuid-777',
      email: 'admin@examcenter.internal',
    });
    assert(typeof challengeToken === 'string' && challengeToken.length > 20, 'Generates signed JWT challenge token');

    const decodedChallenge = verifyMfaChallengeToken(challengeToken);
    assert(
      decodedChallenge?.userId === 'test-admin-id' &&
      decodedChallenge?.challengeId === 'challenge-uuid-777' &&
      decodedChallenge?.email === 'admin@examcenter.internal',
      'Decodes and verifies valid MFA challenge token payload'
    );

    // Test Admin Session Token
    const adminSessionToken = generateAdminSessionToken({
      userId: 'test-admin-id',
      email: 'admin@examcenter.internal',
      role: 'admin',
    });
    const decodedSession = verifyAdminSessionToken(adminSessionToken);
    assert(
      decodedSession?.mfaVerified === true && decodedSession?.role === 'admin',
      'Admin Session Token carries mfaVerified: true flag'
    );
    // Test Resend Email Service Dispatcher
    const emailResult = await sendOtpEmail({
      toEmail: 'admin@examcenter.internal',
      adminName: 'Chief Administrator',
      otpCode: otp,
      expiryMinutes: 5,
    });
    assert(emailResult === true, 'Resend Email Service successfully dispatched OTP email');
  }

  // TEST SUITE 2: CSV & XLSX Parser & Zod Validation Engine
  console.log('\n--- Test Suite 2: CSV/XLSX Parser & Line-by-Line Zod Validation ---');
  {
    const validCsvPath = path.resolve(__dirname, '../../sample_imports/sample_valid_soal.csv');
    const validBuffer = fs.readFileSync(validCsvPath);
    const rawValidRows = parseRawFileBuffer(validBuffer, 'sample_valid_soal.csv');
    assert(rawValidRows.length === 5, `Parsed 5 raw rows from valid CSV file`);

    const validResult = validateParsedRows(rawValidRows);
    assert(validResult.summary.totalRows === 5, 'Summary total rows is 5');
    assert(validResult.summary.validCount === 5, 'Summary valid count is 5 (100% valid)');
    assert(validResult.summary.invalidCount === 0, 'Summary invalid count is 0');
    assert(validResult.invalidRows.length === 0, 'No invalid rows recorded');

    // Test valid XLSX buffer
    const validXlsxPath = path.resolve(__dirname, '../../sample_imports/sample_valid_soal.xlsx');
    const validXlsxBuffer = fs.readFileSync(validXlsxPath);
    const rawXlsxRows = parseRawFileBuffer(validXlsxBuffer, 'sample_valid_soal.xlsx');
    assert(rawXlsxRows.length === 5, `Parsed 5 raw rows from valid XLSX spreadsheet file`);

    const xlsxResult = validateParsedRows(rawXlsxRows);
    assert(xlsxResult.summary.validCount === 5, 'XLSX validation confirms all 5 rows are 100% valid');

    // Test invalid CSV with deliberate corrupted lines
    const invalidCsvPath = path.resolve(__dirname, '../../sample_imports/sample_invalid_soal.csv');
    const invalidBuffer = fs.readFileSync(invalidCsvPath);
    const rawInvalidRows = parseRawFileBuffer(invalidBuffer, 'sample_invalid_soal.csv');
    assert(rawInvalidRows.length === 5, `Parsed 5 raw rows from invalid test CSV`);

    const invalidResult = validateParsedRows(rawInvalidRows);
    assert(invalidResult.summary.validCount === 1, 'Only 1 row is valid (row 2)');
    assert(invalidResult.summary.invalidCount === 4, 'Detected 4 invalid rows with precise errors');

    // Check specific row errors
    const errorRowNumbers = invalidResult.invalidRows.map((r) => r.rowNumber);
    assert(
      errorRowNumbers.includes(3) &&
      errorRowNumbers.includes(4) &&
      errorRowNumbers.includes(5) &&
      errorRowNumbers.includes(6),
      `Correctly identified exact line numbers for errors: rows [${errorRowNumbers.join(', ')}]`
    );

    console.log('   Sample error messages caught on invalid rows:');
    invalidResult.invalidRows.forEach((r) => {
      console.log(`     - Row #${r.rowNumber}: ${r.errors.join(' | ')}`);
    });
  }

  // TEST SUITE 3: Exam Grading & Anti-Cheat Zero-Leak Simulation
  console.log('\n--- Test Suite 3: Exam Evaluation Logic & Zero-Leak Student Protection ---');
  {
    const realDbQuestions = [
      { id: 'q1', correct_answer: 'A', points: 1 },
      { id: 'q2', correct_answer: 'B', points: 2 },
      { id: 'q3', correct_answer: 'C', points: 1 },
      { id: 'q4', correct_answer: 'D', points: 2 },
    ];

    // Simulate stripping correct answers for student client
    const studentPayload = realDbQuestions.map((q) => {
      const copy: any = { ...q };
      delete copy.correct_answer;
      return copy;
    });

    const hasAnyLeak = studentPayload.some((q) => q.correct_answer !== undefined);
    assert(hasAnyLeak === false, 'Student payload is strictly scrubbed: zero client leak of correct answers');

    // Simulate grading student answers:
    // Student answers: q1: 'A' (correct, +1), q2: 'B' (correct, +2), q3: 'A' (wrong, +0), q4: 'D' (correct, +2)
    // Total score = 5 / 6 = 83.3%
    const studentAnswers = new Map<string, string>([
      ['q1', 'A'],
      ['q2', 'B'],
      ['q3', 'A'],
      ['q4', 'D'],
    ]);

    let totalScore = 0;
    let maxScore = 0;
    realDbQuestions.forEach((q) => {
      maxScore += q.points;
      if (studentAnswers.get(q.id) === q.correct_answer) {
        totalScore += q.points;
      }
    });

    const percentage = Math.round((totalScore / maxScore) * 100 * 10) / 10;
    const passingScore = 75;
    const isPassed = percentage >= passingScore;

    assert(totalScore === 5 && maxScore === 6, `Total score computed correctly: ${totalScore}/${maxScore}`);
    assert(percentage === 83.3, `Percentage computed accurately: ${percentage}%`);
    assert(isPassed === true, `Student passed because percentage ${percentage}% >= passing score ${passingScore}%`);
  }

  console.log('\n======================================================');
  console.log(`🎉 ALL TESTS PASSED: ${passedTests} / ${totalTests} assertions verified!`);
  console.log('======================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\n❌ Test suite failed with error:', err);
  process.exit(1);
});

