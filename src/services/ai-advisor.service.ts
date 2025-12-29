
import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

@Injectable({ providedIn: 'root' })
export class AIAdvisorService {
  private ai = new GoogleGenAI({ apiKey: (window as any).process?.env?.API_KEY || '' });

  async generateGameEvent(projectName: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a short, fun software engineering challenge or lucky event for a board game called 'Code Tycoon'. 
        The context is a project named '${projectName}'. 
        Return a short JSON object with: 
        1. 'title': short headline
        2. 'description': 1 sentence about what happened
        3. 'impact': a number between -50 and 100 (money change) or 0
        4. 'codeSnippet': a simple 1-line pseudo-code like 'if (db.isFull) { upgrade() }'`,
        config: {
            responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text);
    } catch (e) {
      return {
        title: "Server Maintenance",
        description: "Routine maintenance completed successfully.",
        impact: 20,
        codeSnippet: "server.reboot();"
      };
    }
  }
}
