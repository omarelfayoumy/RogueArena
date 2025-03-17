import openai
import os

openai.api_key = os.getenv("OPENAI_API_KEY")

def generate_enemy_move(player_data, enemy_data, projectiles_data):
    prompt = f"""
You are controlling an enemy at position {enemy_data}.
The player is at position {player_data}.
The player's projectiles are at {projectiles_data}.
Choose ONE action from: move_left, move_right, shoot, dodge_left, dodge_right, idle.
- If a projectile is very close, prefer to dodge.
- If the player is lined up, consider shooting.
- Return only the command (e.g., "shoot").
"""
    response = openai.ChatCompletion.create(
        model="gpt-4-turbo",
        messages=[{"role": "system", "content": prompt}]
    )
    return response["choices"][0]["message"]["content"].strip()

