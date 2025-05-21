import litellm
from litellm import acompletion
from fastapi import HTTPException
from typing import List, Tuple, Dict, Any
import re
import os
import json

# --- Configuration for Beta/Production ---
# For BETA TESTING and PRODUCTION, ensure DEV_MODE is NOT 'true' in your environment.
# If you are developing and want to use real APIs, set USE_REAL_API_IN_DEV to 'true'.
DEV_MODE = os.environ.get("DEV_MODE", "false").lower() == "true"
USE_REAL_API_IN_DEV = os.environ.get("USE_REAL_API_IN_DEV", "false").lower() == "true"
# --- End Configuration ---

class LLMManager:
    def __init__(self):
        """
        Initialize the LLM Manager.
        In a more complex setup, you might load configurations from litellm_config.yaml here.
        """
        print(f"DEBUG LLMManager: DEV_MODE is {DEV_MODE}") # Debug print
        print(f"DEBUG LLMManager: USE_REAL_API_IN_DEV is {USE_REAL_API_IN_DEV}") # Debug print

        # Optional: add any initialization parameters if necessary
        self.system_prompt = """You are an AI assistant designed to help users solve their problems iteratively or provide empathetic support. 
If the user presents a problem, try to break it down and offer actionable suggestions. Ask clarifying questions if needed. 
If the user seems distressed or is sharing a personal issue, respond with empathy, validate their feelings, and offer consolation. 
Avoid giving unsolicited advice unless specifically asked for problem-solving. 
For every main suggestion or solution you provide, also give a short justification for why you are suggesting it. 
Structure your response clearly. The main response should be distinct from the justification, which should be prefixed with 'Justification:'."""

        # Configure LiteLLM for Gemini if GOOGLE_API_KEY is present
        self.google_api_key = os.environ.get("GOOGLE_API_KEY")
        self.gemini_available = self.google_api_key is not None and len(self.google_api_key) > 10
        print(f"DEBUG LLMManager: GOOGLE_API_KEY is set: {self.google_api_key is not None and len(self.google_api_key or '') > 0}") # More robust check for print
        print(f"DEBUG LLMManager: Gemini available (based on API key): {self.gemini_available}") # Debug print

    async def get_llm_response(
        self, 
        conversation_history: List[Dict[str, Any]], 
        user_message: str, 
        model_name: str = "gemini-1.5-flash"
    ) -> Tuple[str, str]:
        """
        Get a response from the LLM based on conversation history and the new user message.
        In development mode, returns mock responses unless USE_REAL_API_IN_DEV is true.
        
        Args:
            conversation_history: List of previous messages in the conversation
            user_message: The new message from the user
            model_name: Name of the LLM model to use
            
        Returns:
            Tuple containing (main_response, justification)
        """
        # Map model names to their provider-specific formats for LiteLLM
        # For Gemini, LiteLLM often expects "gemini/model-name"
        model_mapping = {
            "gemini-1.5-flash": "gemini/gemini-1.5-flash",
            "gemini-1.5-pro": "gemini/gemini-1.5-pro",
            "gemini-1.0-pro": "gemini/gemini-1.0-pro",
            "claude-3-opus": "anthropic/claude-3-opus",
            "claude-3-sonnet": "anthropic/claude-3-sonnet",
            "claude-3-haiku": "anthropic/claude-3-haiku",
            "gpt-4": "openai/gpt-4",
            "gpt-4-turbo": "openai/gpt-4-turbo",
            "gpt-3.5-turbo": "openai/gpt-3.5-turbo"
        }

        # Use the mapped model name if available, otherwise use the original
        litellm_model = model_mapping.get(model_name, model_name)
        
        # Determine if we should use mock responses
        # For Beta: defaults to NOT using mock responses unless DEV_MODE is true AND USE_REAL_API_IN_DEV is false.
        use_mock = DEV_MODE and not USE_REAL_API_IN_DEV

        if use_mock:
            print(f"DEV MODE (mock): Using mock LLM response for message: '{user_message}'")
            return self._get_enhanced_mock_response(user_message, conversation_history)
        
        # Check for Gemini API key if a Gemini model is selected and not in mock mode
        if "gemini/" in litellm_model and not self.gemini_available:
            print(f"Warning: Attempting to use Gemini model ('{litellm_model}') but GOOGLE_API_KEY is not properly set or missing.")
            # Fallback strategy for Beta if primary API key (Gemini) is missing:
            # Option 1: Raise error immediately (current behavior if not DEV_MODE)
            # Option 2: Try a different model (e.g., a free tier one if configured)
            # Option 3: Return a polite error message to the user via the chat interface
            # For now, we will let it proceed to LiteLLM, which might have its own fallbacks or will error out.
            # If LiteLLM errors, it will be caught below.
            # Consider adding a specific user-facing error message here if LiteLLM call fails due to auth.
            pass # Let LiteLLM attempt the call
            
        try:
            # Prepare the messages list for LiteLLM
            messages = []
            
            # Add system prompt at the beginning
            messages.append({"role": "system", "content": self.system_prompt})
            
            # Add conversation history
            for msg in conversation_history:
                # Only include role and content for LiteLLM
                content_to_send = msg["content"]
                if msg["role"] == "assistant" and msg.get("justification"):
                    content_to_send += f"\n[Context: My justification for the above response was: {msg['justification']}]"
                
                messages.append({
                    "role": msg["role"],
                    "content": content_to_send
                })
            
            # Add the new user message
            messages.append({"role": "user", "content": user_message})
            
            print(f"Sending request to {litellm_model} with {len(messages)} messages")
            
            # Prepare API key if necessary (especially for Google/Gemini)
            kwargs_for_acompletion = {}
            if "gemini/" in litellm_model and self.google_api_key:
                kwargs_for_acompletion['api_key'] = self.google_api_key
                # You might also need to set litellm.vertex_project = "your-gcp-project"
                # and litellm.vertex_location = "your-gcp-region" if using Vertex AI

            # Make the API call to LiteLLM
            response = await acompletion(
                model=litellm_model,
                messages=messages,
                stream=False,
                max_tokens=1024,  
                **kwargs_for_acompletion
            )
            
            # Extract the response content
            full_response = response.choices[0].message.content.strip()
            
            # Extract the justification from the response
            # Looking for "Justification:" marker
            justification = ""
            main_response = full_response
            
            justification_match = re.search(r'(?:^|\n)Justification:\s*(.*?)(?:$|\n\n)', full_response, re.DOTALL)
            if justification_match:
                justification = justification_match.group(1).strip()
                # Remove the justification part from the main response
                main_response = re.sub(r'(?:^|\n)Justification:\s*.*?(?:$|\n\n)', '', full_response, flags=re.DOTALL).strip()
            else:
                # If no explicit justification, generate a generic one or extract the last sentence
                sentences = full_response.split('.')
                if len(sentences) > 1:
                    # Use the last complete sentence as justification
                    justification = sentences[-2].strip() + '.'
                    # Remove it from the main response
                    main_response = '.'.join(sentences[:-2]) + '.'
                else:
                    justification = "This response aims to address your specific query with relevant information."
            
            return main_response, justification
            
        except Exception as e:
            # Handle LiteLLM errors
            error_msg = f"Error communicating with LLM service: {str(e)}"
            print(error_msg)
            if DEV_MODE: # Only fall back to mock if in actual dev_mode with no real_api requested
                print("DEV_MODE: Using mock response due to LLM communication error.")
                return self._get_enhanced_mock_response(user_message, conversation_history)
            # For Beta/Prod, re-raise the error so it becomes a 500 to the client
            raise HTTPException(status_code=500, detail="Error communicating with the AI service. Please try again later.")
    
    def _get_mock_response(self, user_message: str, conversation_history: List[Dict[str, Any]]) -> Tuple[str, str]:
        """
        Generate mock responses for development testing.
        This avoids the need for actual API calls during development.
        """
        # Simple keyword-based mock responses
        mock_responses = {
            "hello": ("Hello! How can I help you today?", "Greeting the user with a friendly tone establishes rapport."),
            "help": ("I'm here to help! Could you tell me more about what you're looking for?", "Asking for more information helps me provide targeted assistance."),
            "problem": ("I understand you're facing a problem. Let's break it down: 1) What exactly is happening? 2) When did it start? 3) What have you tried so far?", "Breaking down problems into components makes them more manageable."),
            "sad": ("I'm sorry to hear you're feeling down. It's completely normal to feel this way sometimes, and your feelings are valid.", "Validating emotions is important for providing empathetic support."),
            "angry": ("I can sense you're frustrated, and that's understandable. Would it help to talk more about what's causing this feeling?", "Acknowledging anger without judgment shows respect for the person's emotional state."),
            "thanks": ("You're welcome! I'm glad I could be of assistance.", "Acknowledging gratitude maintains a positive interaction."),
            "bye": ("Goodbye! Feel free to return if you need help in the future.", "Leaving the conversation on a positive note encourages future engagement.")
        }
        
        # Default response if no keywords match
        default_response = (
            "Thank you for sharing that with me. I'd like to understand better - could you tell me more about your situation?",
            "Asking open-ended questions helps gather more information to provide appropriate support."
        )
        
        # Check for keywords in the user message
        lower_msg = user_message.lower()
        for keyword, response in mock_responses.items():
            if keyword in lower_msg:
                return response
                
        return default_response
        
    def _get_enhanced_mock_response(self, user_message: str, conversation_history: List[Dict[str, Any]]) -> Tuple[str, str]:
        """
        Generate more comprehensive mock responses for better testing experience.
        """
        lower_msg = user_message.lower()
        
        # Financial advice
        if any(term in lower_msg for term in ["loan", "debt", "money", "financial", "bank", "interest"]):
            return (
                "I understand you're facing financial challenges. Here are some steps that might help: \n\n"
                "1. Consider debt consolidation through a personal loan from a reputable bank, which often has lower interest rates than informal loans.\n"
                "2. Check if you qualify for any government assistance programs.\n"
                "3. Create a detailed budget to track your expenses and identify areas where you can save.\n"
                "4. Consider speaking with a financial advisor who specializes in debt management.\n"
                "5. If possible, try to negotiate with your relatives for a lower interest rate or extended payment terms.\n\n"
                "Would you like me to elaborate on any of these suggestions?",
                
                "Financial stress can be overwhelming, and having a structured approach with multiple options provides a sense of control and practical next steps."
            )
        
        # Health advice
        elif any(term in lower_msg for term in ["health", "sick", "doctor", "pain", "disease", "symptom"]):
            return (
                "I hear you're concerned about health issues. While I'm not a medical professional, I can suggest some general steps:\n\n"
                "1. Consider scheduling an appointment with a healthcare provider for a proper diagnosis.\n"
                "2. Keep track of your symptoms - when they occur, what makes them better or worse.\n"
                "3. Ensure you're maintaining basic health habits: adequate sleep, hydration, and nutrition.\n"
                "4. Be careful about self-diagnosing using internet sources.\n\n"
                "Remember that your health is a priority, and seeking professional medical advice is important.",
                
                "Health concerns often benefit from professional medical attention rather than self-diagnosis, and tracking symptoms provides valuable information for healthcare providers."
            )
        
        # Relationship advice
        elif any(term in lower_msg for term in ["relationship", "partner", "marriage", "divorce", "girlfriend", "boyfriend", "spouse", "love"]):
            return (
                "Relationships can be complex, and I appreciate you sharing this with me. Here are some thoughts:\n\n"
                "1. Open communication is key - consider expressing your feelings using 'I' statements to avoid sounding accusatory.\n"
                "2. Active listening can help both parties feel heard and validated.\n"
                "3. Setting healthy boundaries is important for any relationship.\n"
                "4. Sometimes, a neutral third party like a relationship counselor can provide valuable guidance.\n\n"
                "What aspects of the relationship are most challenging for you right now?",
                
                "Communication and understanding are foundational to healthy relationships, and approaching issues collaboratively rather than confrontationally tends to lead to better outcomes."
            )
        
        # Career advice
        elif any(term in lower_msg for term in ["job", "career", "work", "boss", "colleague", "interview", "resume", "salary"]):
            return (
                "Career development is an important aspect of life. Based on what you've shared, here are some thoughts:\n\n"
                "1. Consider your long-term career goals and how your current situation aligns with them.\n"
                "2. Networking and professional development can open new opportunities.\n"
                "3. When facing workplace challenges, documenting incidents and maintaining professionalism is advisable.\n"
                "4. For job searches, tailoring your resume and preparation for interviews are crucial steps.\n\n"
                "Could you tell me more about your specific career aspirations or challenges?",
                
                "Career decisions benefit from aligning short-term actions with long-term goals, and professional development is an ongoing process that extends beyond formal education."
            )
        
        # Mental health
        elif any(term in lower_msg for term in ["anxiety", "depression", "stress", "overwhelmed", "therapy", "counseling", "mental health"]):
            return (
                "I'm sorry to hear you're struggling with these feelings. Your mental wellbeing is important, and it's brave of you to talk about it.\n\n"
                "1. Consider speaking with a mental health professional who can provide personalized support.\n"
                "2. Self-care routines, including physical activity and mindfulness practices, can be helpful supplements to professional care.\n"
                "3. Setting small, achievable goals may help when feeling overwhelmed.\n"
                "4. Remember that seeking help is a sign of strength, not weakness.\n\n"
                "Would you like to talk more about how you've been feeling?",
                
                "Mental health challenges benefit from professional support, and acknowledging feelings without judgment creates a safe space for discussion."
            )
            
        # Technical/coding questions
        elif any(term in lower_msg for term in ["code", "programming", "software", "developer", "bug", "error", "javascript", "python", "java"]):
            return (
                "For technical challenges, a systematic approach often works best:\n\n"
                "1. Break down the problem into smaller, manageable parts.\n"
                "2. Check documentation and existing solutions in forums like Stack Overflow.\n"
                "3. Use debugging tools to identify where the issue occurs.\n"
                "4. Consider implementing automated tests to catch similar issues in the future.\n"
                "5. Sometimes, explaining the problem to someone else (or even to yourself) can lead to insights.\n\n"
                "Could you provide more details about the specific technical challenge you're facing?",
                
                "Technical problems often benefit from systematic troubleshooting rather than trial-and-error approaches, and documentation and community resources are valuable tools."
            )
            
        # Problem-solving/General help request
        elif any(term in lower_msg for term in ["problem", "solve", "issue", "help me", "assist me", "challenge"]) and not any(term in lower_msg for term in ["technical", "code", "software", "financial", "health", "relationship", "career", "mental health"]): # Avoid overlap with more specific categories
            return (
                "I understand you're looking for help with a problem or challenge. I'll do my best to assist. To get a clearer picture, could you tell me a bit more about it?\n\n"
                "For instance:\n"
                "1. Can you describe the main challenge or what you're trying to achieve?\n"
                "2. Are there any specific constraints or factors I should be aware of?\n"
                "3. Have you tried anything already, or do you have any initial thoughts on how to approach it?\n\n"
                "The more information you can provide, the better I can help you explore solutions.",
                "Gathering specific details about the problem upfront helps in formulating a targeted and effective response strategy."
            )
            
        # Generic greeting
        elif any(term in lower_msg for term in ["hello", "hi", "hey", "greetings", "morning", "afternoon", "evening"]):
            return (
                "Hello! I'm here to help with any questions or challenges you're facing. Feel free to share what's on your mind, and I'll do my best to provide helpful information or perspectives.",
                
                "A warm welcome establishes rapport and encourages open communication."
            )
            
        # If user message is very short or unclear
        elif len(user_message.strip()) < 5 or user_message.strip() in ["?", "test", "ok"]:
            return (
                "I'm not sure I understand completely. Could you provide more details about what you'd like to discuss or what kind of help you're looking for? I'm here to assist with a variety of topics and concerns.",
                
                "Requesting clarification when messages are unclear helps ensure the conversation moves in a productive direction."
            )
        
        # Default fallback for unrecognized topics
        else:
            return (
                "Thank you for sharing that with me. I'm here to help and would like to understand your situation better. Could you tell me more about what you're experiencing or what kind of support you're looking for?",
                
                "Open-ended questions encourage elaboration and help gather more information to provide appropriate support."
            )
    
    # You can add additional methods here as needed, such as for streaming responses,
    # handling different model providers, etc. 