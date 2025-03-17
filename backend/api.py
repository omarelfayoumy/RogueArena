from fastapi import FastAPI
from ai.enemy_ai import generate_enemy_move
from pydantic import BaseModel

app = FastAPI()

class PlayerActions(BaseModel):
    actions: list

@app.post("/ai/enemy")
async def get_enemy_move(player: PlayerActions):
    move = generate_enemy_move(player.actions)
    return {"move": move}
