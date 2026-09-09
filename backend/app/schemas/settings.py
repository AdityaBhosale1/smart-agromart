from pydantic import BaseModel
from typing import Optional, Dict

class SettingItem(BaseModel):
    key: str
    value: str
    group: str = "shop"

class SettingsBatchUpdate(BaseModel):
    settings: Dict[str, str]
