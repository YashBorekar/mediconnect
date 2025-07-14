# AI-Powered Symptom Analysis Setup

## Overview

This project now includes intelligent symptom analysis with multiple implementation options:

1. **OpenAI API Integration** (optional, for enhanced AI analysis)
2. **Advanced Local Analysis** (works without any API keys)
3. **Seamless Fallback System** (automatically switches between methods)

## Setup Options

### Option 1: OpenAI API Integration (Recommended)

OpenAI provides more natural language processing and better symptom interpretation.

#### Setup Steps:

1. Go to [OpenAI API](https://platform.openai.com/api-keys)
2. Create an account (free tier available)
3. Generate an API key
4. Update your `.env` file:

```env
OPENAI_API_KEY=your_actual_openai_api_key_here
```

#### Benefits:

- **Natural language processing** for better symptom interpretation
- **Contextual analysis** based on age, gender, and symptoms
- **$5 free credit** for new users (sufficient for testing)
- **More accurate condition matching**

### Option 2: Local Analysis Only (No API Required)

Works completely offline with built-in medical knowledge.

#### Setup Steps:

- No setup required! Just leave the API key as placeholder
- The system automatically uses local analysis

#### Benefits:

- **100% free** - no API costs
- **Privacy-focused** - no data sent to external services
- **Offline capable** - works without internet
- **Comprehensive symptom database** built-in

## How It Works

### With OpenAI API:

1. **User Input**: Patient describes symptoms
2. **AI Processing**: OpenAI analyzes symptoms with medical context
3. **Structured Response**: Returns conditions and recommendations
4. **Fallback**: If API fails, switches to local analysis

### Local Analysis:

1. **Symptom Parsing**: Intelligent keyword matching
2. **Medical Database**: Built-in condition database
3. **Probability Scoring**: Advanced scoring algorithm
4. **Age/Gender Adjustments**: Personalized risk assessment

## Features

### 🧠 **Smart Symptom Analysis**

- Recognizes 50+ common symptoms
- Matches to 20+ medical conditions
- Age and gender-specific adjustments
- Probability-based condition ranking

### 📋 **Personalized Recommendations**

- Symptom-specific care advice
- Age-appropriate recommendations
- Emergency warning signs
- When to seek medical attention

### 🔒 **Privacy & Security**

- Local analysis option (no data sharing)
- Secure API communications
- Patient data stays in your database
- HIPAA-compliant design

## Example Analysis

**Input:**

```json
{
  "symptoms": "I have a headache, fever, and I'm feeling very tired",
  "age": "26-35",
  "gender": "female"
}
```

**Output:**

```json
{
  "conditions": [
    {
      "name": "Influenza (Flu)",
      "probability": 85,
      "description": "Viral infection causing fever, body aches, fatigue, and respiratory symptoms."
    },
    {
      "name": "Viral Upper Respiratory Infection",
      "probability": 70,
      "description": "Common cold symptoms including nasal congestion and mild fever."
    }
  ],
  "recommendations": [
    "Rest and get adequate sleep",
    "Stay well hydrated with water and clear fluids",
    "Monitor temperature regularly",
    "Consider over-the-counter fever reducers",
    "Consult a healthcare provider if symptoms worsen or persist beyond 7 days"
  ]
}
```

## API Costs (OpenAI)

### Free Tier:

- **$5 free credit** for new users
- Each analysis costs approximately **$0.01-0.02**
- **250-500 analyses** with free credit
- Perfect for development and testing

### Production Costs:

- **Very affordable** - $0.01-0.02 per analysis
- **Pay-as-you-go** - no monthly fees
- **Scalable** - costs grow with usage

## Alternative Free APIs

If you prefer other options:

1. **Hugging Face Transformers** (completely free)
2. **Cohere API** (free tier available)
3. **Anthropic Claude** (free tier available)
4. **Local LLM Models** (Ollama, LM Studio)

The service is designed to easily switch between different AI providers by updating the service class.

## No API Setup Required!

**The system works great without any API keys!** The local analysis includes:

- Advanced symptom recognition
- Medical condition database
- Personalized recommendations
- Age and gender considerations

Just start using the symptom checker - it will automatically provide intelligent analysis even without external APIs.
