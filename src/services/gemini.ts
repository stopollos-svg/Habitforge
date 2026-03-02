import { GoogleGenAI, Type } from "@google/genai";
import { Habit, User, Quest } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getPersonalizedHabitSuggestion(habit: Habit, allHabits: Habit[], user: User, quests: Quest[]) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The user is currently working on the habit: "${habit.name}" (Category: ${habit.category}, Current Streak: ${habit.streak}).
      Their other habits include: ${allHabits.filter(h => h.id !== habit.id).map(h => h.name).join(", ")}.
      Their current daily quests/goals are: ${quests.map(q => q.title).join(", ")}.
      The user is Level ${user.level} with ${user.forge_points} Forge Points.
      
      Suggest a personalized way to improve or expand this specific habit ("${habit.name}"), or a micro-goal related to it, taking into account their other habits and current quests.
      Keep it short, encouraging, and actionable.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestion: { type: Type.STRING },
            reason: { type: Type.STRING }
          },
          required: ["suggestion", "reason"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error fetching personalized suggestion:", error);
    return {
      suggestion: "Try to do it at the same time every day.",
      reason: "Consistency is the foundation of any strong habit."
    };
  }
}

export async function getHabitSuggestions(currentHabits: string[]) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on these current habits: ${currentHabits.join(", ")}, suggest 3 new habits that would complement them. Provide a reason for each.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              reason: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["name", "reason", "category"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return [
      { name: "Drink Water", reason: "Hydration is key for focus.", category: "Health" },
      { name: "Read 10 Pages", reason: "Continuous learning expands the mind.", category: "Growth" },
      { name: "5-Min Meditation", reason: "Reduces stress and improves clarity.", category: "Mindfulness" }
    ];
  }
}
