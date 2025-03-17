import openai
import os

openai.api_key = os.getenv("OPENAI_API_KEY")

def generate_level():
    prompt = """
Generate a procedural level design for a roguelike arena game.
Provide a brief description and layout instructions.
"""
    response = openai.ChatCompletion.create(
        model="gpt-4-turbo",
        messages=[{"role": "system", "content": prompt}]
    )
    return response["choices"][0]["message"]["content"]
