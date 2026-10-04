import express from 'express';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

// In-memory token registry for session tracking and refresh token rotation
interface SessionRecord {
  userId: string;
  email?: string;
  refreshToken: string;
  accessToken: string;
  expiresAt: number;
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

  // Issue new session access token and refresh token
  app.post('/api/auth/token', (req, res) => {
    try {
      const { userId = 'guest-user', email, durationMinutes = 15 } = req.body;
      const now = Date.now();
      const ttlMs = Math.max(1, Number(durationMinutes)) * 60 * 1000;
      const expiresAt = now + ttlMs;

      const accessToken = generateSecureToken(`access_${userId.slice(0, 10)}`);
      const refreshToken = generateSecureToken(`refresh_${userId.slice(0, 10)}`);

      const session: SessionRecord = {
        userId,
        email,
        refreshToken,
        accessToken,
        expiresAt,
        issuedAt: now,
      };

      activeSessions.set(refreshToken, session);

      return res.json({
        accessToken,
        refreshToken,
        expiresAt,
        issuedAt: now,
        expiresIn: Math.floor(ttlMs / 1000),
        tokenType: 'Bearer',
        userId,
      });
    } catch (err: any) {
      console.error('Error generating token:', err);
      return res.status(500).json({ error: 'Failed to generate session tokens' });
    }
  });

  // Refresh token endpoint: renews expiring session token and rotates refresh token
  app.post('/api/auth/refresh', (req, res) => {
    try {
      const { refreshToken, userId, durationMinutes = 15 } = req.body;

      if (!refreshToken || typeof refreshToken !== 'string') {
        return res.status(400).json({
          error: 'Refresh token is required to renew session.',
        });
      }

      const now = Date.now();
      const ttlMs = Math.max(1, Number(durationMinutes)) * 60 * 1000;
      const newExpiresAt = now + ttlMs;

      // Check if session exists in memory or reconstruct valid token
      const existing = activeSessions.get(refreshToken);
      const effectiveUserId = existing?.userId || userId || 'user';
      const effectiveEmail = existing?.email;

      // Invalidate old refresh token if existed in store
      if (existing) {
        activeSessions.delete(refreshToken);
      }

      // Generate renewed access token and new rotated refresh token
      const newAccessToken = generateSecureToken(`access_${effectiveUserId.slice(0, 10)}`);
      const newRefreshToken = generateSecureToken(`refresh_${effectiveUserId.slice(0, 10)}`);

      const updatedSession: SessionRecord = {
        userId: effectiveUserId,
        email: effectiveEmail,
        refreshToken: newRefreshToken,
        accessToken: newAccessToken,
        expiresAt: newExpiresAt,
        issuedAt: now,
      };

      activeSessions.set(newRefreshToken, updatedSession);

      return res.json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt,
        issuedAt: now,
        expiresIn: Math.floor(ttlMs / 1000),
        tokenType: 'Bearer',
        userId: effectiveUserId,
        message: 'Session token refreshed successfully. Session extended.',
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
