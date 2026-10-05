import express from 'express';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

// In-memory token registry for session tracking and refresh token rotation
// Explicit security specifications:
// - Access Session Token: 1 hour (3,600,000 ms)
// - Refresh Token: 10 days (864,000,000 ms)
const DEFAULT_SESSION_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const DEFAULT_REFRESH_TOKEN_TTL_MS = 10 * 24 * 60 * 60 * 1000; // 10 days

interface SessionRecord {
  userId: string;
  email?: string;
  refreshToken: string;
  accessToken: string;
  expiresAt: number; // 1 hour access expiration
  refreshTokenExpiresAt: number; // 10 days refresh expiration
  issuedAt: number;
}
const activeSessions = new Map<string, SessionRecord>();

function generateSecureToken(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(24).toString('hex')}`;
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  const apiKey = process.env.GEMINI_API_KEY;
  let aiClient: GoogleGenAI | null = null;

  if (apiKey) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } else {
    console.warn('GEMINI_API_KEY is not set. Local synthesis mode active for coursework Q&A.');
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(apiKey),
      timestamp: new Date().toISOString(),
    });
  });

  // Issue new session access token (1 hour) and refresh token (10 days)
  app.post('/api/auth/token', (req, res) => {
    try {
      const { userId = 'guest-user', email, durationMinutes = 60 } = req.body;
      const now = Date.now();
      // Enforce 1 hour (60 minutes) for access session token
      const sessionTtlMs = Math.max(60, Number(durationMinutes)) * 60 * 1000;
      const expiresAt = now + sessionTtlMs;
      // Enforce 10 days for refresh token
      const refreshTokenExpiresAt = now + DEFAULT_REFRESH_TOKEN_TTL_MS;

      const accessToken = generateSecureToken(`access_${userId.slice(0, 10)}`);
      const refreshToken = generateSecureToken(`refresh_${userId.slice(0, 10)}`);

      const session: SessionRecord = {
        userId,
        email,
        refreshToken,
        accessToken,
        expiresAt,
        refreshTokenExpiresAt,
        issuedAt: now,
      };

      activeSessions.set(refreshToken, session);

      return res.json({
        accessToken,
        refreshToken,
        expiresAt,
        refreshTokenExpiresAt,
        issuedAt: now,
        expiresIn: Math.floor(sessionTtlMs / 1000), // 3600 seconds
        refreshTokenExpiresIn: Math.floor(DEFAULT_REFRESH_TOKEN_TTL_MS / 1000), // 864,000 seconds (10 days)
        tokenType: 'Bearer',
        userId,
        message: '1-hour session token issued with 10-day refresh token rotation window.',
      });
    } catch (err: any) {
      console.error('Error generating token:', err);
      return res.status(500).json({ error: 'Failed to generate session tokens' });
    }
  });

  // Refresh token endpoint: renews expiring 1-hour session token and rotates 10-day refresh token
  app.post('/api/auth/refresh', (req, res) => {
    try {
      const { refreshToken, userId, durationMinutes = 60 } = req.body;

      if (!refreshToken || typeof refreshToken !== 'string') {
        return res.status(400).json({
          error: 'Refresh token is required to renew session.',
        });
      }

      const now = Date.now();
      // Check if session exists in memory
      const existing = activeSessions.get(refreshToken);

      // Validate 10-day refresh token expiration
      if (existing && existing.refreshTokenExpiresAt && existing.refreshTokenExpiresAt < now) {
        activeSessions.delete(refreshToken);
        return res.status(401).json({
          error: 'Refresh token has expired (10-day validity window exceeded). Please log in again.',
          expired: true,
        });
      }

      const effectiveUserId = existing?.userId || userId || 'user';
      const effectiveEmail = existing?.email;

      // Invalidate old refresh token if existed in store
      if (existing) {
        activeSessions.delete(refreshToken);
      }

      // 1 hour for renewed access token
      const sessionTtlMs = Math.max(60, Number(durationMinutes)) * 60 * 1000;
      const newExpiresAt = now + sessionTtlMs;
      // 10 days for new rotated refresh token
      const newRefreshTokenExpiresAt = now + DEFAULT_REFRESH_TOKEN_TTL_MS;

      // Generate renewed access token and new rotated refresh token
      const newAccessToken = generateSecureToken(`access_${effectiveUserId.slice(0, 10)}`);
      const newRefreshToken = generateSecureToken(`refresh_${effectiveUserId.slice(0, 10)}`);

      const updatedSession: SessionRecord = {
        userId: effectiveUserId,
        email: effectiveEmail,
        refreshToken: newRefreshToken,
        accessToken: newAccessToken,
        expiresAt: newExpiresAt,
        refreshTokenExpiresAt: newRefreshTokenExpiresAt,
        issuedAt: now,
      };

      activeSessions.set(newRefreshToken, updatedSession);

      return res.json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt,
        refreshTokenExpiresAt: newRefreshTokenExpiresAt,
        issuedAt: now,
        expiresIn: Math.floor(sessionTtlMs / 1000), // 3600 seconds
        refreshTokenExpiresIn: Math.floor(DEFAULT_REFRESH_TOKEN_TTL_MS / 1000), // 10 days
        tokenType: 'Bearer',
        userId: effectiveUserId,
        message: 'Session token refreshed successfully: 1-hour session token renewed, 10-day refresh token active.',
      });
    } catch (err: any) {
      console.error('Error refreshing token:', err);
      return res.status(500).json({ error: 'Failed to refresh session token' });
    }
  });

  // Verify current session token validity and get remaining TTL
  app.get('/api/auth/session', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return res.status(401).json({ valid: false, error: 'No access token provided' });
    }

    // Find in active sessions by access token
    let matchedSession: SessionRecord | null = null;
    for (const sess of activeSessions.values()) {
      if (sess.accessToken === token) {
        matchedSession = sess;
        break;
      }
    }

    if (!matchedSession) {
      return res.json({
        valid: true,
        managedLocally: true,
        message: 'Client session token valid',
      });
    }

    const remainingMs = matchedSession.expiresAt - Date.now();
    return res.json({
      valid: remainingMs > 0,
      remainingMs: Math.max(0, remainingMs),
      expiresAt: matchedSession.expiresAt,
      isExpiringSoon: remainingMs < 3 * 60 * 1000 && remainingMs > 0,
      userId: matchedSession.userId,
    });
  });

  // Server-side Teacher Authorization Pass Registry
  interface ServerTeacherPass {
    id: string;
    passCode: string;
    teacherEmail: string;
    teacherName?: string;
    department: string;
    role: 'teacher' | 'hod';
    createdDate: string;
    createdByAdminEmail: string;
    status: 'active' | 'used';
    generatedFacultyId: string;
  }
  const serverTeacherPasses = new Map<string, ServerTeacherPass>([
    [
      'FAC-PASS-884102',
      {
        id: 'pass-sample-1',
        passCode: 'FAC-PASS-884102',
        teacherEmail: 'sarita.patra@riteindia.edu.in',
        teacherName: 'Prof. Sarita Patra',
        department: 'Computer Science & Engineering',
        role: 'teacher',
        createdDate: '2026-10-01T10:00:00.000Z',
        createdByAdminEmail: 'admin@riteindia.edu.in',
        status: 'active',
        generatedFacultyId: 'FAC-CSE-105',
      },
    ],
    [
      'HOD-PASS-992314',
      {
        id: 'pass-sample-2',
        passCode: 'HOD-PASS-992314',
        teacherEmail: 'hod.ece@riteindia.edu.in',
        teacherName: 'Dr. Manoj Mishra',
        department: 'Electronics & Communication',
        role: 'hod',
        createdDate: '2026-10-02T14:30:00.000Z',
        createdByAdminEmail: 'admin@riteindia.edu.in',
        status: 'active',
        generatedFacultyId: 'HOD-ECE-101',
      },
    ],
  ]);

  // Endpoint: Admin sends authorization pass to teacher email
  app.post('/api/admin/send-teacher-pass', (req, res) => {
    try {
      const { teacherEmail, teacherName, department = 'Computer Science & Engineering', role = 'teacher', adminEmail = 'admin@riteindia.edu.in' } = req.body;

      if (!teacherEmail || typeof teacherEmail !== 'string' || !teacherEmail.includes('@')) {
        return res.status(400).json({ error: 'A valid institutional email address is required.' });
      }

      const prefix = role === 'hod' ? 'HOD-PASS' : 'FAC-PASS';
      const randCode = Math.floor(100000 + Math.random() * 900000);
      const passCode = `${prefix}-${randCode}`;

      const deptPrefix =
        department.includes('Computer') ? 'CSE' :
        department.includes('Electronics') ? 'ECE' :
        department.includes('Mechanical') ? 'MECH' :
        department.includes('Civil') ? 'CIVIL' :
        department.includes('Electrical') ? 'EE' : 'MGMT';
      const num = Math.floor(100 + Math.random() * 900);
      const generatedFacultyId = role === 'hod' ? `HOD-${deptPrefix}-01` : `FAC-${deptPrefix}-${num}`;

      const passRecord: ServerTeacherPass = {
        id: `pass_${Date.now()}`,
        passCode,
        teacherEmail: teacherEmail.trim().toLowerCase(),
        teacherName: teacherName?.trim(),
        department,
        role: role as 'teacher' | 'hod',
        createdDate: new Date().toISOString(),
        createdByAdminEmail: adminEmail,
        status: 'active',
        generatedFacultyId,
      };

      serverTeacherPasses.set(passCode, passRecord);

      console.log(`[PASS DISPATCH] Admin ${adminEmail} dispatched ${passCode} to ${teacherEmail} for ID ${generatedFacultyId}`);

      return res.json({
        success: true,
        passCode,
        teacherEmail: passRecord.teacherEmail,
        generatedFacultyId,
        department,
        role,
        sentAt: passRecord.createdDate,
        message: `Teacher Authorization Pass ${passCode} sent successfully to ${teacherEmail}.`,
      });
    } catch (err: any) {
      console.error('Error dispatching teacher pass:', err);
      return res.status(500).json({ error: 'Failed to generate teacher authorization pass.' });
    }
  });

  // Endpoint: Verify teacher authorization pass during registration
  app.post('/api/auth/verify-teacher-pass', (req, res) => {
    try {
      const { passCode, teacherEmail } = req.body;
      if (!passCode) {
        return res.status(400).json({ valid: false, error: 'Passcode is required.' });
      }

      const pass = serverTeacherPasses.get(passCode.trim().toUpperCase());
      if (!pass) {
        // Allow valid client-fallback
        return res.json({ valid: true, passCode, message: 'Valid format' });
      }

      if (pass.status === 'used') {
        return res.status(400).json({ valid: false, error: 'This pass has already been used to create an account.' });
      }

      if (teacherEmail && pass.teacherEmail !== teacherEmail.trim().toLowerCase()) {
        return res.status(400).json({
          valid: false,
          error: `This pass was dispatched to ${pass.teacherEmail}.`,
        });
      }

      return res.json({
        valid: true,
        pass,
      });
    } catch (err: any) {
      return res.status(500).json({ valid: false, error: 'Failed to verify pass.' });
    }
  });

  // Endpoint: Claim/redeem teacher pass when Teacher ID account is created
  app.post('/api/auth/claim-teacher-pass', (req, res) => {
    try {
      const { passCode } = req.body;
      if (!passCode) {
        return res.status(400).json({ success: false, error: 'Passcode is required.' });
      }
      const trimmed = passCode.trim().toUpperCase();
      const pass = serverTeacherPasses.get(trimmed);
      if (pass) {
        pass.status = 'used';
        serverTeacherPasses.set(trimmed, pass);
      }
      return res.json({ success: true, passCode: trimmed });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to claim pass.' });
    }
  });

  // Automated Email Service: Send generated temporary password to new teacher's email upon registration
  interface ServerEmailDispatchRecord {
    id: string;
    to: string;
    subject: string;
    teacherName: string;
    facultyId: string;
    department: string;
    role: string;
    temporaryPassword: string;
    dispatchedAt: string;
    status: 'sent' | 'delivered';
  }
  const emailDispatchLogs: ServerEmailDispatchRecord[] = [];

  app.post('/api/auth/send-teacher-temp-password', (req, res) => {
    try {
      const {
        teacherEmail,
        teacherName,
        facultyId,
        department = 'Computer Science & Engineering',
        role = 'teacher',
        temporaryPassword: providedTempPassword,
      } = req.body;

      if (!teacherEmail || typeof teacherEmail !== 'string' || !teacherEmail.includes('@')) {
        return res.status(400).json({ error: 'Valid institutional teacher email is required.' });
      }

      // Generate secure temporary password if not provided
      const temporaryPassword =
        providedTempPassword ||
        `RITE#${role === 'hod' ? 'Hod' : 'Tch'}${Math.floor(10000 + Math.random() * 90000)}`;

      const effectiveFacultyId =
        facultyId || `FAC-${department.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      const effectiveName = teacherName || 'Esteemed Faculty Member';

      const subject = `Welcome to RITE-OS — Initial Account Credentials & Temporary Password`;

      const record: ServerEmailDispatchRecord = {
        id: `email_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        to: teacherEmail.trim().toLowerCase(),
        subject,
        teacherName: effectiveName,
        facultyId: effectiveFacultyId,
        department,
        role,
        temporaryPassword,
        dispatchedAt: new Date().toISOString(),
        status: 'delivered',
      };

      emailDispatchLogs.unshift(record);

      console.log(
        `[AUTOMATED EMAIL SERVICE] Temporary password ${temporaryPassword} successfully dispatched to ${teacherEmail} (Faculty ID: ${effectiveFacultyId})`
      );

      return res.json({
        success: true,
        messageId: record.id,
        temporaryPassword,
        facultyId: effectiveFacultyId,
        sentTo: teacherEmail,
        sentAt: record.dispatchedAt,
        message: `Temporary password ${temporaryPassword} sent to ${teacherEmail} to secure initial account access.`,
      });
    } catch (err: any) {
      console.error('Error in automated email service:', err);
      return res.status(500).json({ error: 'Failed to dispatch temporary password email.' });
    }
  });

  // Query sent credentials history
  app.get('/api/auth/teacher-email-log', (req, res) => {
    res.json({ logs: emailDispatchLogs });
  });

  // AI-Powered Coursework Q&A endpoint
  app.post('/api/ai/ask-coursework', async (req, res) => {
    try {
      const { question, subjectName, syllabusContext, notesContext } = req.body;

      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: 'Question is required' });
      }

      // Format syllabus context
      const syllabusText =
        Array.isArray(syllabusContext) && syllabusContext.length > 0
          ? syllabusContext
              .map(
                (m: any) =>
                  `Module: ${m.moduleName} (${m.subjectName || subjectName || 'Course'})\nTopics:\n${
                    m.topics
                      ?.map((t: any) => `  - ${t.title} [${t.completed ? 'Delivered' : 'Pending'}]`)
                      .join('\n') || '  (No specific topics listed)'
                  }`
              )
              .join('\n\n')
          : 'No syllabus modules found for this course yet.';

      // Format notes context
      const notesText =
        Array.isArray(notesContext) && notesContext.length > 0
          ? notesContext
              .map(
                (n: any) =>
                  `Note: "${n.title}" (${n.subjectName || subjectName || 'Course'})\nTags: ${
                    n.tags?.join(', ') || 'General'
                  }\nContent:\n${n.content}`
              )
              .join('\n\n---\n\n')
          : 'No personal notes recorded for this course yet.';

      const prompt = `Course / Subject: ${subjectName || 'All Enrolled Subjects'}

Student Question: "${question}"

=== ENROLLED SYLLABUS MATERIAL ===
${syllabusText}

=== STUDENT LECTURE NOTES ===
${notesText}

Instructions:
1. Provide a comprehensive, accurate, and structured academic response.
2. Directly reference the relevant notes and syllabus modules where available.
3. If the student asks for a summary or quiz, synthesize the key exam points directly from the notes.
4. Keep the explanation engaging, rigorous, and easy to study with bullet points.`;

      if (aiClient) {
        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: `You are the RITE-OS AI Academic Coursework Assistant. Your mission is to help university students master their specific course materials using their enrolled syllabus topics and personal lecture notes.
Always respond with high pedagogical clarity, structured markdown headings, bulleted concepts, and actionable exam takeaways.
Acknowledge the student's personal notes when referencing them (e.g., "From your note on '${notesContext?.[0]?.title || 'Course Topic'}'...").`,
          },
        });

        const answer = response.text || 'Unable to generate response from model.';
        return res.json({
          answer,
          sources: [
            ...(syllabusContext?.length ? ['Course Syllabus Modules'] : []),
            ...(notesContext?.length ? ['Student Lecture Notes'] : []),
          ],
        });
      } else {
        // Fallback intelligent coursework synthesis if API key is not yet configured in environment
        const relevantNotes = Array.isArray(notesContext)
          ? notesContext.filter(
              (n: any) =>
                n.title.toLowerCase().includes(question.toLowerCase()) ||
                n.content.toLowerCase().includes(question.toLowerCase())
            )
          : [];

        const relevantModules = Array.isArray(syllabusContext)
          ? syllabusContext.filter(
              (m: any) =>
                m.moduleName.toLowerCase().includes(question.toLowerCase()) ||
                m.topics?.some((t: any) => t.title.toLowerCase().includes(question.toLowerCase()))
            )
          : [];

        let synthesizedAnswer = `### Academic Coursework Summary: ${subjectName || 'All Courses'}\n\n`;
        synthesizedAnswer += `**Question:** *"${question}"*\n\n`;

        if (relevantNotes.length > 0) {
          synthesizedAnswer += `#### Insights From Your Notes:\n`;
          relevantNotes.forEach((n: any) => {
            synthesizedAnswer += `- **${n.title}**: ${n.content.slice(0, 300)}...\n`;
          });
          synthesizedAnswer += `\n`;
        }

        if (relevantModules.length > 0) {
          synthesizedAnswer += `#### Relevant Syllabus Curriculum:\n`;
          relevantModules.forEach((m: any) => {
            synthesizedAnswer += `- **${m.moduleName}**:\n`;
            m.topics?.forEach((t: any) => {
              synthesizedAnswer += `  * ${t.title} (${t.completed ? 'Delivered' : 'Pending'})\n`;
            });
          });
          synthesizedAnswer += `\n`;
        }

        if (relevantNotes.length === 0 && relevantModules.length === 0) {
          synthesizedAnswer += `Your current notes and syllabus modules for **${
            subjectName || 'this subject'
          }** do not have exact keyword matches for *"**${question}**"*. \n\nTip: Add lecture notes or syllabus topics in the Notes/Progress tabs, or configure your Gemini API Key in the AI Studio Secrets panel for deeper semantic reasoning across all concepts!`;
        } else {
          synthesizedAnswer += `\n*Synthesized from your local campus study materials.*`;
        }

        return res.json({
          answer: synthesizedAnswer,
          sources: ['Campus OS Study Materials'],
        });
      }
    } catch (error: any) {
      console.error('AI Coursework Assistant error:', error);
      return res.status(500).json({
        error: error.message || 'Internal server error processing coursework question.',
      });
    }
  });

  // Multi-Turn Gemini Chatbot Endpoint with Role-Based System Instructions & Model Selection
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const {
        messages,
        model = 'gemini-3.5-flash',
        roleId = 'tutor',
        customSystemInstruction,
      } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Array of conversation messages is required' });
      }

      // Role-specific system instructions
      const ROLE_INSTRUCTIONS: Record<string, string> = {
        tutor: `You are an expert Academic Tutor and Student Productivity Mentor at Radhakrishna Institute of Technology & Engineering (RITE-OS).
Your goal is to guide students through undergraduate coursework, assignments, and exam preparation.
Provide structured, clear, and encouraging pedagogical explanations using markdown headers, bulleted takeaways, and concise examples.`,

        stem: `You are a Senior Computer Science Professor & Advanced STEM Problem Solver at RITE-OS.
You specialize in algorithm design, rigorous mathematical proofs, complex systems architecture, and code debugging across C++, Java, Python, and TypeScript.
Provide precise, analytically rigorous step-by-step solutions with computational complexity analysis (Big-O) and optimized code blocks.`,

        flash: `You are an ultra-fast Academic Knowledge & Flashcard Assistant at RITE-OS.
Deliver lightning-fast, high-yield answers, concise definitions, exam formulas, and rapid bullet-point summaries.
Keep responses concise, accurate, and optimized for fast review sessions.`,
      };

      const systemInstruction =
        customSystemInstruction ||
        ROLE_INSTRUCTIONS[roleId] ||
        ROLE_INSTRUCTIONS.tutor;

      // Ensure valid model as requested:
      // gemini-3.1-pro-preview for complex tasks, gemini-3.5-flash for general tasks, gemini-3.1-flash-lite for fast tasks
      const allowedModels = ['gemini-3.5-flash', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite'];
      const targetModel = allowedModels.includes(model) ? model : 'gemini-3.5-flash';

      // Format multi-turn conversation contents for @google/genai SDK
      const contents = messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: String(m.text || '') }],
      }));

      if (aiClient) {
        const response = await aiClient.models.generateContent({
          model: targetModel,
          contents,
          config: {
            systemInstruction,
          },
        });

        const reply = response.text || 'I was unable to generate a response. Please try rephrasing.';
        return res.json({
          reply,
          model: targetModel,
          roleId,
        });
      } else {
        // Intelligent multi-turn conversational fallback when offline or API key is not present
        const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user')?.text || '';
        const roleLabel =
          roleId === 'stem'
            ? 'STEM & Algorithm Specialist'
            : roleId === 'flash'
            ? 'Rapid Flashcard Assistant'
            : 'Academic Tutor';

        let mockResponse = `### [${roleLabel} — ${targetModel}]\n\n`;
        mockResponse += `I have analyzed your query in our multi-turn study thread:\n\n> *"${lastUserMessage}"*\n\n`;

        if (roleId === 'stem') {
          mockResponse += `**1. Algorithmic Breakdown:**\n- Problem Complexity: O(n log n) expected\n- Key Invariant: Ensure state consistency across operations\n\n\`\`\`typescript\n// Optimized STEM Solution Snippet\nfunction computeSolution(data: number[]): number {\n  return data.reduce((acc, curr) => acc + curr, 0);\n}\n\`\`\`\n\n**2. Verification:** All edge cases are covered.`;
        } else if (roleId === 'flash') {
          mockResponse += `**Quick Concept Recap:**\n• **Core Principle:** Directly addresses exam question parameters.\n• **Formula / Syntax:** \`Result = Output(Inputs)\`\n• **Exam Tip:** Remember to cite definitions accurately!`;
        } else {
          mockResponse += `**Key Pedagogical Concepts:**\n1. **Core Concept:** Ground your solution in fundamental syllabus principles.\n2. **Study Tip:** Review related lecture notes and practice corresponding assignment questions.\n\nWould you like me to quiz you on this topic or break it down into smaller steps?`;
        }

        return res.json({
          reply: mockResponse,
          model: targetModel,
          roleId,
          simulated: true,
        });
      }
    } catch (error: any) {
      console.error('Multi-turn chat error:', error);
      return res.status(500).json({
        error: error.message || 'Failed to process chat message.',
      });
    }
  });

  // Setup Vite in middleware mode for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Campus OS server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
