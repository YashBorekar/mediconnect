interface SymptomInput {
  symptoms: string;
  age: string;
  gender: string;
}

interface AnalysisResult {
  conditions: Array<{
    name: string;
    probability: number;
    description: string;
  }>;
  recommendations: string[];
  source: string;
  timestamp: string;
}

export class SymptomAnalysisService {
  private readonly openaiApiKey = process.env.OPENAI_API_KEY;

  constructor() {
    if (!this.openaiApiKey) {
      console.log(
        "OpenAI API key not found. Using enhanced medical analysis algorithm."
      );
    }
  }

  async analyzeSymptoms(input: SymptomInput): Promise<AnalysisResult> {
    // Try OpenAI first if available, otherwise use enhanced local analysis
    if (this.openaiApiKey && this.openaiApiKey !== "your_openai_api_key_here") {
      try {
        return await this.analyzeWithOpenAI(input);
      } catch (error) {
        console.error(
          "OpenAI API error, falling back to local analysis:",
          error
        );
        return this.analyzeLocally(input);
      }
    }

    return this.analyzeLocally(input);
  }

  private async analyzeWithOpenAI(
    input: SymptomInput
  ): Promise<AnalysisResult> {
    const prompt = `As a medical assistant, analyze these symptoms and provide a medical assessment. 
    
    Patient Details:
    - Age: ${input.age}
    - Gender: ${input.gender}
    - Symptoms: ${input.symptoms}
    
    Please provide:
    1. Top 3 most likely conditions with probability percentages
    2. Specific recommendations for care
    
    Format your response as JSON with this structure:
    {
      "conditions": [
        {
          "name": "condition name",
          "probability": 85,
          "description": "brief description"
        }
      ],
      "recommendations": [
        "recommendation 1",
        "recommendation 2"
      ]
    }
    
    Important: This is for educational purposes only and should not replace professional medical advice.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a medical assistant providing preliminary symptom analysis. Always remind users to consult healthcare professionals.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    try {
      const parsed = JSON.parse(content);
      return {
        conditions: parsed.conditions || [],
        recommendations: parsed.recommendations || [],
        source: "openai",
        timestamp: new Date().toISOString(),
      };
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      return this.analyzeLocally(input);
    }
  }

  private analyzeLocally(input: SymptomInput): AnalysisResult {
    const symptomsLower = input.symptoms.toLowerCase();

    // Enhanced symptom analysis using medical knowledge
    const conditions = this.getConditionsFromSymptoms(
      symptomsLower,
      input.age,
      input.gender
    );
    const recommendations = this.getRecommendationsFromSymptoms(
      symptomsLower,
      input.age
    );

    return {
      conditions,
      recommendations,
      source: "local_analysis",
      timestamp: new Date().toISOString(),
    };
  }

  private getConditionsFromSymptoms(
    symptoms: string,
    age: string,
    gender: string
  ): Array<{
    name: string;
    probability: number;
    description: string;
  }> {
    const conditions: Array<{
      name: string;
      probability: number;
      description: string;
      keywords: string[];
    }> = [
      {
        name: "Viral Upper Respiratory Infection",
        probability: 70,
        description:
          "Common cold symptoms including nasal congestion, runny nose, and mild fever. Usually resolves within 7-10 days.",
        keywords: [
          "cold",
          "runny nose",
          "congestion",
          "sneezing",
          "mild fever",
        ],
      },
      {
        name: "Influenza (Flu)",
        probability: 60,
        description:
          "Viral infection causing fever, body aches, fatigue, and respiratory symptoms. More severe than common cold.",
        keywords: [
          "flu",
          "fever",
          "body aches",
          "fatigue",
          "chills",
          "headache",
        ],
      },
      {
        name: "Gastroenteritis",
        probability: 50,
        description:
          "Stomach flu causing nausea, vomiting, diarrhea, and abdominal pain. Often resolves within 2-3 days.",
        keywords: [
          "nausea",
          "vomiting",
          "diarrhea",
          "stomach pain",
          "abdominal pain",
        ],
      },
      {
        name: "Allergic Rhinitis",
        probability: 45,
        description:
          "Allergic reaction to airborne substances causing sneezing, runny nose, and itchy eyes.",
        keywords: [
          "allergies",
          "sneezing",
          "itchy eyes",
          "runny nose",
          "seasonal",
        ],
      },
      {
        name: "Tension Headache",
        probability: 40,
        description:
          "Most common type of headache, often caused by stress, lack of sleep, or dehydration.",
        keywords: ["headache", "head pain", "stress", "tension"],
      },
      {
        name: "Acute Bronchitis",
        probability: 55,
        description:
          "Inflammation of the bronchial tubes causing persistent cough, often with mucus production.",
        keywords: ["cough", "bronchitis", "mucus", "chest congestion"],
      },
      {
        name: "Migraine",
        probability: 35,
        description:
          "Severe headache often accompanied by nausea, vomiting, and sensitivity to light and sound.",
        keywords: [
          "migraine",
          "severe headache",
          "nausea",
          "light sensitivity",
        ],
      },
      {
        name: "Urinary Tract Infection",
        probability: 30,
        description:
          "Bacterial infection of the urinary system causing painful urination and frequent urge to urinate.",
        keywords: [
          "uti",
          "burning urination",
          "frequent urination",
          "bladder pain",
        ],
      },
    ];

    // Score conditions based on symptom matches
    const scoredConditions = conditions.map((condition) => {
      const matchCount = condition.keywords.filter((keyword) =>
        symptoms.includes(keyword)
      ).length;

      let adjustedProbability = condition.probability;

      if (matchCount > 0) {
        adjustedProbability += matchCount * 15; // Boost probability for matches
      }

      // Age-based adjustments
      if (age === "65+" && condition.name.includes("Influenza")) {
        adjustedProbability += 10; // Higher risk for older adults
      }

      return {
        name: condition.name,
        probability: Math.min(adjustedProbability, 95), // Cap at 95%
        description: condition.description,
      };
    });

    // Sort by probability and return top 3
    return scoredConditions
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 3)
      .filter((condition) => condition.probability >= 20); // Only include reasonable matches
  }

  private getRecommendationsFromSymptoms(
    symptoms: string,
    age: string
  ): string[] {
    const recommendations: string[] = [];

    // General recommendations
    recommendations.push("Rest and get adequate sleep");
    recommendations.push("Stay well hydrated with water and clear fluids");

    // Symptom-specific recommendations
    if (symptoms.includes("fever")) {
      recommendations.push("Monitor temperature regularly");
      recommendations.push(
        "Consider over-the-counter fever reducers (acetaminophen or ibuprofen)"
      );
    }

    if (symptoms.includes("cough")) {
      recommendations.push(
        "Use a humidifier or breathe steam from a hot shower"
      );
      recommendations.push(
        "Consider throat lozenges or warm salt water gargles"
      );
    }

    if (symptoms.includes("headache")) {
      recommendations.push("Apply cold or warm compress to head/neck");
      recommendations.push("Consider over-the-counter pain relievers");
    }

    if (symptoms.includes("nausea") || symptoms.includes("vomiting")) {
      recommendations.push(
        "Eat bland foods (BRAT diet: bananas, rice, applesauce, toast)"
      );
      recommendations.push("Avoid dairy, caffeine, and fatty foods");
    }

    if (symptoms.includes("diarrhea")) {
      recommendations.push("Increase fluid intake to prevent dehydration");
      recommendations.push("Consider oral rehydration solutions");
    }

    // Age-specific recommendations
    if (age === "65+") {
      recommendations.push(
        "Monitor symptoms closely and seek medical attention if worsening"
      );
    }

    // Always include medical consultation advice
    recommendations.push(
      "Consult a healthcare provider if symptoms worsen or persist beyond 7 days"
    );
    recommendations.push(
      "Seek immediate medical attention if you experience difficulty breathing, chest pain, or severe dehydration"
    );

    return recommendations;
  }
}
